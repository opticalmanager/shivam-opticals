import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get("phone");
    const email = searchParams.get("email");

    if (!phone && !email) {
      return NextResponse.json(
        { success: false, error: "Identifier (phone or email) is required" },
        { status: 400 }
      );
    }

    try {
      const res = await query(
        `SELECT id, full_name, email, phone, role, gem_loyalty_points, created_at
         FROM public.profiles
         WHERE phone = $1 OR email = $2
         LIMIT 1;`,
        [phone, email]
      );

      if (res.rows.length > 0) {
        return NextResponse.json({ success: true, profile: res.rows[0] });
      }
    } catch (dbErr) {
      console.warn("[USER-PROFILE] DB lookup warning:", dbErr);
    }

    return NextResponse.json({ success: true, profile: null });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, name, email, phone } = body;

    try {
      if (id) {
        await query(
          `UPDATE public.profiles
           SET full_name = COALESCE($1, full_name),
               email = COALESCE($2, email),
               phone = COALESCE($3, phone),
               updated_at = NOW()
           WHERE id = $4;`,
          [name, email, phone, id]
        );
      }
    } catch (dbErr) {
      console.warn("[USER-PROFILE] DB update warning:", dbErr);
    }

    return NextResponse.json({ success: true, message: "Profile updated successfully" });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, name, email, phone } = body;

    try {
      if (id) {
        await query(
          `INSERT INTO public.profiles (id, full_name, email, phone, role, gem_loyalty_points, created_at, updated_at)
           VALUES ($1, $2, $3, $4, 'customer', 0, NOW(), NOW())
           ON CONFLICT (id) DO UPDATE
           SET full_name = COALESCE(NULLIF($2, ''), public.profiles.full_name),
               email = COALESCE(NULLIF($3, ''), public.profiles.email),
               phone = COALESCE(NULLIF($4, ''), public.profiles.phone),
               updated_at = NOW();`,
          [id, name || null, email || null, phone || null]
        );
      } else if (email) {
        await query(
          `UPDATE public.profiles
           SET full_name = COALESCE(NULLIF($1, ''), full_name),
               updated_at = NOW()
           WHERE email = $2;`,
          [name || null, email]
        );
      }
    } catch (dbErr) {
      console.warn("[USER-PROFILE] DB upsert warning:", dbErr);
    }

    return NextResponse.json({ success: true, message: "Profile synchronized successfully" });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

