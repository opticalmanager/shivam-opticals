import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { supabase } from "@/lib/supabase";
import { normalizePhoneNumber } from "@/lib/phoneUtils";
import { verifyPassword } from "@/lib/passwordUtils";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { identifier, password, rememberMe = true } = body;

    const rawId = String(identifier || "").trim();
    const rawPwd = String(password || "").trim();

    if (!rawId || !rawPwd) {
      return NextResponse.json(
        { success: false, error: "Please enter both your ID (email or mobile) and password." },
        { status: 400 }
      );
    }

    const isEmail = rawId.includes("@");

    if (isEmail) {
      const cleanEmail = rawId.toLowerCase();

      // 1. Try Supabase Auth password authentication
      try {
        const { data: supaData, error: supaErr } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: rawPwd,
        });

        if (supaData?.user && !supaErr) {
          // Fetch or ensure profile in public.profiles
          const profileRes = await query(
            `SELECT id, full_name, email, phone, role, gem_loyalty_points
             FROM public.profiles
             WHERE id = $1 OR LOWER(email) = $2
             LIMIT 1;`,
            [supaData.user.id, cleanEmail]
          );

          const userProfile = profileRes.rows[0] || {
            id: supaData.user.id,
            name: supaData.user.user_metadata?.full_name || supaData.user.user_metadata?.name || cleanEmail.split("@")[0],
            email: cleanEmail,
            role: "customer",
          };

          return NextResponse.json({
            success: true,
            user: userProfile,
            session: supaData.session,
          });
        }
      } catch (supaEx) {
        console.warn("[AUTH-LOGIN] Supabase direct login warning:", supaEx);
      }

      // 2. Database fallback lookup for email
      try {
        const dbRes = await query(
          `SELECT id, full_name, email, phone, role, gem_loyalty_points, password_hash
           FROM public.profiles
           WHERE LOWER(email) = $1
           LIMIT 1;`,
          [cleanEmail]
        );

        if (dbRes.rows.length > 0) {
          const row = dbRes.rows[0];
          if (row.password_hash && verifyPassword(rawPwd, row.password_hash)) {
            return NextResponse.json({
              success: true,
              user: {
                id: row.id,
                name: row.full_name || cleanEmail.split("@")[0],
                email: row.email,
                phone: row.phone,
                role: row.role || "customer",
              },
            });
          }
        }
      } catch (dbErr) {
        console.warn("[AUTH-LOGIN] DB email fallback lookup warning:", dbErr);
      }

      return NextResponse.json(
        { success: false, error: "Incorrect email or password. Please try again or log in with OTP." },
        { status: 401 }
      );
    } else {
      // Mobile Number Authentication
      const normalized = normalizePhoneNumber(rawId);
      if (!normalized.isValid) {
        return NextResponse.json(
          { success: false, error: "Please enter a valid 10-digit mobile number or email address." },
          { status: 400 }
        );
      }

      const canonicalPhone = normalized.e164; // e.g. "+919810012345"

      try {
        const dbRes = await query(
          `SELECT id, full_name, email, phone, role, gem_loyalty_points, password_hash
           FROM public.profiles
           WHERE phone = $1
           LIMIT 1;`,
          [canonicalPhone]
        );

        if (dbRes.rows.length === 0) {
          return NextResponse.json(
            { success: false, error: "No account found with this mobile number. Please sign up first." },
            { status: 404 }
          );
        }

        const row = dbRes.rows[0];
        if (!row.password_hash) {
          return NextResponse.json(
            {
              success: false,
              error: "No password has been set for this mobile number yet. Please log in with OTP.",
            },
            { status: 400 }
          );
        }

        if (!verifyPassword(rawPwd, row.password_hash)) {
          return NextResponse.json(
            { success: false, error: "Incorrect password. Please try again or log in with OTP." },
            { status: 401 }
          );
        }

        return NextResponse.json({
          success: true,
          user: {
            id: row.id,
            name: row.full_name || "Valued Customer",
            email: row.email,
            phone: row.phone,
            role: row.role || "customer",
          },
        });
      } catch (dbErr) {
        console.error("[AUTH-LOGIN] Mobile login DB error:", dbErr);
        return NextResponse.json(
          { success: false, error: "Database error during login. Please try again or log in with OTP." },
          { status: 500 }
        );
      }
    }
  } catch (err: any) {
    console.error("[AUTH-LOGIN] Server error:", err);
    return NextResponse.json(
      { success: false, error: "Server error during login. Please try again." },
      { status: 500 }
    );
  }
}
