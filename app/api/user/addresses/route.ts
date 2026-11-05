import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const phone = searchParams.get("phone");
    const email = searchParams.get("email");

    if (!userId && !phone && !email) {
      return NextResponse.json(
        { success: false, error: "Identifier (userId, phone, or email) is required" },
        { status: 400 }
      );
    }

    // Resolve user ID from profiles if not given directly
    let resolvedUserId: string | null = userId && userId.length >= 20 ? userId : null;
    const cleanPhone = phone ? phone.replace(/\D/g, "").slice(-10) : null;

    if (!resolvedUserId && (cleanPhone || email)) {
      try {
        const profRes = await query(
          `SELECT id FROM public.profiles 
           WHERE ($1::text IS NOT NULL AND RIGHT(REGEXP_REPLACE(COALESCE(phone, ''), '\D', '', 'g'), 10) = $1)
              OR ($2::text IS NOT NULL AND LOWER(email) = LOWER($2))
           LIMIT 1;`,
          [cleanPhone, email || null]
        );
        if (profRes.rows.length > 0) {
          resolvedUserId = profRes.rows[0].id;
        }
      } catch (e) {
        console.warn("[USER-ADDRESSES] Profile lookup warning:", e);
      }
    }

    const addresses: any[] = [];

    // 1. Fetch saved addresses from customer_addresses table
    if (resolvedUserId) {
      try {
        const addrRes = await query(
          `SELECT id, user_id, full_name, phone, street_address, city, state, pincode, country, is_default, created_at
           FROM public.customer_addresses
           WHERE user_id = $1
           ORDER BY is_default DESC, created_at DESC;`,
          [resolvedUserId]
        );
        for (const row of addrRes.rows) {
          addresses.push({
            id: row.id,
            fullName: row.full_name,
            phone: row.phone,
            streetAddress: row.street_address,
            city: row.city,
            state: row.state,
            pincode: row.pincode,
            country: row.country || "India",
            isDefault: Boolean(row.is_default),
          });
        }
      } catch (e) {
        console.warn("[USER-ADDRESSES] customer_addresses query error:", e);
      }
    }

    // 2. If no saved addresses exist yet, check past orders placed by this user
    if (addresses.length === 0 && (cleanPhone || email || resolvedUserId)) {
      try {
        const pastOrdersRes = await query(
          `SELECT shipping_address FROM public.orders
           WHERE ($1::text IS NOT NULL AND RIGHT(REGEXP_REPLACE(COALESCE(guest_phone, ''), '\D', '', 'g'), 10) = $1)
              OR ($2::text IS NOT NULL AND LOWER(guest_email) = LOWER($2))
              OR ($3::uuid IS NOT NULL AND customer_id = $3)
           ORDER BY created_at DESC
           LIMIT 5;`,
          [cleanPhone, email || null, resolvedUserId || null]
        );

        const seenAddresses = new Set<string>();

        for (const o of pastOrdersRes.rows) {
          if (!o.shipping_address) continue;
          try {
            const parsed =
              typeof o.shipping_address === "string"
                ? JSON.parse(o.shipping_address)
                : o.shipping_address;

            if (parsed && parsed.streetAddress && parsed.streetAddress.trim().length > 3) {
              const key = `${parsed.streetAddress.toLowerCase().trim()}_${parsed.pincode}`;
              if (!seenAddresses.has(key)) {
                seenAddresses.add(key);
                addresses.push({
                  id: `order-addr-${addresses.length}`,
                  fullName: parsed.fullName || parsed.firstName ? `${parsed.firstName || ""} ${parsed.lastName || ""}`.trim() : "",
                  phone: parsed.phone || phone || "",
                  streetAddress: parsed.streetAddress,
                  city: parsed.city || "Delhi",
                  state: parsed.state || "Delhi",
                  pincode: parsed.pincode || "",
                  country: parsed.country || "India",
                  isDefault: addresses.length === 0,
                  fromOrder: true,
                });
              }
            }
          } catch {}
        }
      } catch (orderErr) {
        console.warn("[USER-ADDRESSES] Order addresses lookup warning:", orderErr);
      }
    }

    return NextResponse.json({
      success: true,
      addresses,
    });
  } catch (error: any) {
    console.error("[USER-ADDRESSES] GET error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, phone, email, address } = body;

    if (!address || !address.streetAddress || !address.pincode) {
      return NextResponse.json(
        { success: false, error: "Street address and pincode are required" },
        { status: 400 }
      );
    }

    // Resolve user ID
    let resolvedUserId: string | null = userId && userId.length >= 20 ? userId : null;
    const cleanPhone = phone ? phone.replace(/\D/g, "").slice(-10) : null;

    if (!resolvedUserId && (cleanPhone || email)) {
      try {
        const profRes = await query(
          `SELECT id FROM public.profiles 
           WHERE ($1::text IS NOT NULL AND RIGHT(REGEXP_REPLACE(COALESCE(phone, ''), '\D', '', 'g'), 10) = $1)
              OR ($2::text IS NOT NULL AND LOWER(email) = LOWER($2))
           LIMIT 1;`,
          [cleanPhone, email || null]
        );
        if (profRes.rows.length > 0) {
          resolvedUserId = profRes.rows[0].id;
        }
      } catch (e) {
        console.warn("[USER-ADDRESSES] Profile lookup error:", e);
      }
    }

    // If profile still doesn't exist, create one so address foreign key is valid
    if (!resolvedUserId && cleanPhone) {
      try {
        const newProf = await query(
          `INSERT INTO public.profiles (full_name, phone, role)
           VALUES ($1, $2, 'customer')
           RETURNING id;`,
          [address.fullName || "Patron", phone || `+91 ${cleanPhone}`]
        );
        resolvedUserId = newProf.rows[0]?.id || null;
      } catch (e) {
        console.warn("[USER-ADDRESSES] Profile auto-creation error:", e);
      }
    }

    if (!resolvedUserId) {
      return NextResponse.json(
        { success: false, error: "Could not link address to user profile" },
        { status: 400 }
      );
    }

    const isDefault = Boolean(address.isDefault);

    if (isDefault) {
      // Clear previous default
      await query(
        `UPDATE public.customer_addresses SET is_default = false WHERE user_id = $1;`,
        [resolvedUserId]
      );
    }

    const insertRes = await query(
      `INSERT INTO public.customer_addresses (
        user_id, full_name, phone, street_address, city, state, pincode, country, is_default, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      RETURNING id, full_name, phone, street_address, city, state, pincode, country, is_default;`,
      [
        resolvedUserId,
        address.fullName || "Valued Patron",
        address.phone || phone || "",
        address.streetAddress,
        address.city || "Delhi",
        address.state || "Delhi",
        address.pincode,
        address.country || "India",
        isDefault,
      ]
    );

    return NextResponse.json({
      success: true,
      message: "Address saved successfully",
      address: insertRes.rows[0],
    });
  } catch (error: any) {
    console.error("[USER-ADDRESSES] POST error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const userId = searchParams.get("userId");

    if (!id) {
      return NextResponse.json({ success: false, error: "Address ID is required" }, { status: 400 });
    }

    if (userId && userId.length >= 20) {
      await query(`DELETE FROM public.customer_addresses WHERE id = $1 AND user_id = $2;`, [id, userId]);
    } else {
      await query(`DELETE FROM public.customer_addresses WHERE id = $1;`, [id]);
    }

    return NextResponse.json({ success: true, message: "Address removed successfully" });
  } catch (error: any) {
    console.error("[USER-ADDRESSES] DELETE error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
