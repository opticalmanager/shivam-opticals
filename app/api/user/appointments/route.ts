import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get("phone");
    const email = searchParams.get("email");

    if (!phone && !email) {
      return NextResponse.json(
        { success: false, error: "Phone or email identifier is required" },
        { status: 400 }
      );
    }

    const cleanPhone = phone ? phone.replace(/\D/g, "").slice(-10) : null;
    const cleanEmail = email ? email.trim().toLowerCase() : null;

    const res = await query(
      `SELECT 
        id,
        booking_reference,
        patient_name as name,
        patient_phone as phone,
        patient_email as email,
        service,
        store_location,
        to_char(appointment_date, 'YYYY-MM-DD') as date,
        time_slot as time,
        status,
        notes,
        created_at
       FROM public.appointments
       WHERE 
         ($1::text IS NOT NULL AND (
           patient_phone ILIKE '%' || $1 || '%' OR
           RIGHT(REGEXP_REPLACE(COALESCE(patient_phone, ''), '\D', '', 'g'), 10) = $2
         )) OR
         ($3::text IS NOT NULL AND LOWER(COALESCE(patient_email, '')) = $3)
       ORDER BY appointment_date DESC, created_at DESC;`,
      [phone || null, cleanPhone || null, cleanEmail || null]
    );

    return NextResponse.json({
      success: true,
      appointments: res.rows,
    });
  } catch (error: any) {
    console.error("[USER-APPOINTMENTS] GET error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { appointmentId, status } = body;

    if (!appointmentId || !status) {
      return NextResponse.json(
        { success: false, error: "Appointment ID and status are required" },
        { status: 400 }
      );
    }

    await query(
      `UPDATE public.appointments 
       SET status = $1, updated_at = NOW() 
       WHERE id = $2;`,
      [status, appointmentId]
    );

    return NextResponse.json({
      success: true,
      message: `Appointment ${status} successfully`,
    });
  } catch (error: any) {
    console.error("[USER-APPOINTMENTS] PATCH error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
