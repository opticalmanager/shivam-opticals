import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { query, getPgPool } from "@/lib/db";
import { normalizePhoneNumber } from "@/lib/phoneUtils";
import { resolvePatronName } from "@/lib/patronUtils";
import { hashPassword } from "@/lib/passwordUtils";

const OTP_PEPPER = process.env.OTP_SECRET_PEPPER || "shivam_optics_super_secure_otp_pepper_2026";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { phone, otp, name, password } = body;

    // 1. Validate and normalize phone number
    const normalized = normalizePhoneNumber(phone);
    if (!normalized.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: normalized.error || "Please enter a valid 10-digit mobile number",
        },
        { status: 400 }
      );
    }

    const canonicalPhone = normalized.e164; // e.g. "+919810012345"
    const rawOtp = String(otp || "").trim();

    // 2. Validate 6-digit numeric OTP format
    if (!/^\d{6}$/.test(rawOtp)) {
      return NextResponse.json(
        {
          success: false,
          error: "Please enter a complete 6-digit verification code",
        },
        { status: 400 }
      );
    }

    // 3. Look up active, unexpired OTP verification record
    const recordRes = await query(
      `SELECT id, phone, otp_hash, channel, attempts, max_attempts, expires_at
       FROM public.otp_verifications
       WHERE phone = $1 AND verified_at IS NULL AND expires_at > NOW()
       ORDER BY created_at DESC
       LIMIT 1;`,
      [canonicalPhone]
    );

    if (recordRes.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Verification code expired or not found. Please request a new code.",
        },
        { status: 400 }
      );
    }

    const record = recordRes.rows[0];

    // 4. Check maximum attempts limit
    if (record.attempts >= record.max_attempts) {
      await query(
        `UPDATE public.otp_verifications SET expires_at = NOW() WHERE id = $1;`,
        [record.id]
      );
      return NextResponse.json(
        {
          success: false,
          error: "Too many failed attempts. Please request a new verification code.",
        },
        { status: 400 }
      );
    }

    // 5. Compute candidate SHA-256 hash using the same salt & pepper
    const candidateHash = crypto
      .createHash("sha256")
      .update(`${canonicalPhone}:${rawOtp}:${OTP_PEPPER}`)
      .digest("hex");

    // Increment attempts counter in database
    await query(
      `UPDATE public.otp_verifications SET attempts = attempts + 1 WHERE id = $1;`,
      [record.id]
    );

    // 6. Timing-safe comparison of OTP hashes
    let isMatch = false;
    try {
      isMatch = crypto.timingSafeEqual(
        Buffer.from(candidateHash, "hex"),
        Buffer.from(record.otp_hash, "hex")
      );
    } catch {
      isMatch = false;
    }

    if (!isMatch) {
      const remainingAttempts = record.max_attempts - (record.attempts + 1);
      const attemptWarning =
        remainingAttempts > 0
          ? ` (${remainingAttempts} attempt${remainingAttempts > 1 ? "s" : ""} remaining)`
          : "";

      if (remainingAttempts <= 0) {
        await query(
          `UPDATE public.otp_verifications SET expires_at = NOW() WHERE id = $1;`,
          [record.id]
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: `Invalid verification code. Please check the code and try again.${attemptWarning}`,
        },
        { status: 400 }
      );
    }

    // 7. Atomic Database Transaction:
    // Create/link auth.users + upsert public.profiles + mark OTP verified
    const resolvedPatronName = resolvePatronName(name, { phone: canonicalPhone });
    let profile: any = null;
    let pastOrders: any[] = [];

    const pool = getPgPool();
    if (!pool) {
      throw new Error("PostgreSQL pool not available");
    }

    const dbClient = await pool.connect();
    try {
      await dbClient.query("BEGIN;");

      // Check if auth.users record already exists by phone
      let userId: string;
      const existingAuthRes = await dbClient.query(
        `SELECT id FROM auth.users WHERE phone = $1 LIMIT 1;`,
        [canonicalPhone]
      );

      if (existingAuthRes.rows.length > 0) {
        userId = existingAuthRes.rows[0].id;
      } else {
        const newAuthRes = await dbClient.query(
          `INSERT INTO auth.users (
            id,
            instance_id,
            aud,
            role,
            phone,
            phone_confirmed_at,
            raw_user_meta_data,
            created_at,
            updated_at
          ) VALUES (
            gen_random_uuid(),
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            $1,
            NOW(),
            jsonb_build_object('full_name', $2::text, 'name', $2::text),
            NOW(),
            NOW()
          ) RETURNING id;`,
          [canonicalPhone, resolvedPatronName]
        );
        userId = newAuthRes.rows[0].id;
      }

      // Hash password if provided during signup
      const passwordHash =
        password && typeof password === "string" && password.trim().length >= 6
          ? hashPassword(password.trim())
          : null;

      // Ensure password_hash column exists in public.profiles
      await dbClient.query(`ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS password_hash TEXT;`);

      // Upsert into public.profiles matching auth.users foreign key
      const profileUpsertRes = await dbClient.query(
        `INSERT INTO public.profiles (
          id, full_name, phone, role, gem_loyalty_points,
          phone_verified, phone_verified_at, phone_verification_channel,
          password_hash,
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, 'customer', 0,
          true, NOW(), $4,
          $5,
          NOW(), NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), public.profiles.full_name),
          phone = EXCLUDED.phone,
          password_hash = COALESCE(EXCLUDED.password_hash, public.profiles.password_hash),
          phone_verified = true,
          phone_verified_at = NOW(),
          phone_verification_channel = EXCLUDED.phone_verification_channel,
          updated_at = NOW()
        RETURNING id, full_name, email, phone, role, gem_loyalty_points, created_at;`,
        [userId, resolvedPatronName, canonicalPhone, record.channel, passwordHash]
      );

      profile = profileUpsertRes.rows[0];

      // Mark OTP record as verified inside transaction
      await dbClient.query(
        `UPDATE public.otp_verifications SET verified_at = NOW() WHERE id = $1;`,
        [record.id]
      );

      await dbClient.query("COMMIT;");
    } catch (txErr: any) {
      await dbClient.query("ROLLBACK;");
      console.error("[SHIVAM-AUTH] Transaction failed, rolled back:", txErr);
      throw txErr;
    } finally {
      dbClient.release();
    }

    // 8. Query past orders associated with this patron
    if (profile) {
      try {
        const ordersRes = await query(
          `SELECT id, order_number, status, payment_status, payment_method,
                  subtotal, discount_amount, shipping_fee, total_amount,
                  shipping_address, tracking_number, courier_partner, estimated_delivery, created_at
           FROM public.orders
           WHERE customer_id = $1 OR guest_phone = $2
           ORDER BY created_at DESC
           LIMIT 10;`,
          [profile.id, canonicalPhone]
        );
        if (ordersRes && ordersRes.rows.length > 0) {
          pastOrders = ordersRes.rows;
        }
      } catch (orderErr) {
        console.warn("[SHIVAM-AUTH] Past orders query warning:", orderErr);
      }
    }

    // Extract saved address from latest past order if present
    const defaultSavedAddresses: any[] = [];
    if (pastOrders.length > 0 && pastOrders[0].shipping_address) {
      try {
        const addr =
          typeof pastOrders[0].shipping_address === "string"
            ? JSON.parse(pastOrders[0].shipping_address)
            : pastOrders[0].shipping_address;
        if (addr && addr.streetAddress) {
          defaultSavedAddresses.push(addr);
        }
      } catch {
        // Ignored
      }
    }

    // Also check saved customer_addresses table
    try {
      const addrRes = await query(
        `SELECT full_name, phone, street_address, city, state, pincode, country 
         FROM public.customer_addresses WHERE user_id = $1;`,
        [profile.id]
      );
      for (const a of addrRes.rows) {
        defaultSavedAddresses.push({
          fullName: a.full_name,
          phone: a.phone,
          streetAddress: a.street_address,
          city: a.city,
          state: a.state,
          pincode: a.pincode,
          country: a.country,
        });
      }
    } catch {}

    const formattedJoinedDate = profile?.created_at
      ? new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
      : "Recently Joined";

    return NextResponse.json({
      success: true,
      message: "Authentication successful",
      user: {
        id: profile?.id || "patron-shivam",
        name: profile?.full_name || resolvedPatronName || "Valued Patron",
        email: profile?.email || undefined,
        phone: canonicalPhone,
        role: profile?.role || "customer",
        joinedDate: formattedJoinedDate,
        gemPoints: Number(profile?.gem_loyalty_points || 0),
        phoneVerified: true,
        savedAddresses: defaultSavedAddresses,
        savedPrescriptions: [],
      },
      orders: pastOrders.map((o) => ({
        id: o.id,
        trackingNumber: o.tracking_number || o.order_number,
        customerId: o.customer_id,
        createdAt: o.created_at,
        items: [],
        shippingAddress:
          typeof o.shipping_address === "string" ? JSON.parse(o.shipping_address) : o.shipping_address,
        paymentMethod: o.payment_method || "razorpay",
        paymentStatus: o.payment_status || "paid",
        subtotal: Number(o.subtotal || 0),
        discount: Number(o.discount_amount || 0),
        totalAmount: Number(o.total_amount || 0),
        status: o.status || "confirmed",
        estimatedDeliveryDate: o.estimated_delivery || "Standard 3-5 Business Days",
      })),
    });
  } catch (error: any) {
    console.error("[SHIVAM-AUTH] verify-otp handler fatal error:", error?.message || error);
    return NextResponse.json(
      { success: false, error: "Unable to verify code at this time" },
      { status: 500 }
    );
  }
}
