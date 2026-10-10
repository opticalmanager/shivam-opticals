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
