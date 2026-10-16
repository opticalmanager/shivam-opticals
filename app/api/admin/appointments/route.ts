import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
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
      ORDER BY appointment_date ASC, time_slot ASC, created_at DESC;`
    );

    return NextResponse.json({
      success: true,
      appointments: res.rows,
    });
  } catch (error: any) {
    console.error("Appointments GET error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to load appointments from database" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const patientName = body.name?.trim() || body.patient_name?.trim();
    const patientPhone = body.phone?.trim() || body.patient_phone?.trim();

    if (!patientName || !patientPhone) {
      return NextResponse.json({ success: false, error: "Patient name and phone number are required" }, { status: 400 });
    }

    const bookingRef = body.booking_reference || `APT-${Date.now().toString().slice(-6)}`;
    const patientEmail = body.email?.trim() || body.patient_email?.trim() || null;
    const service = body.service || "Comprehensive Eye Test & Lens Fitting";
    const storeLocation = body.store_location || "Mayur Vihar Phase 1 Atelier";
    const appointmentDate = body.date || body.appointment_date || new Date().toISOString().split("T")[0];
    const timeSlot = body.time || body.time_slot || "11:30 AM";
    const status = body.status || "confirmed";
    const notes = body.notes || "";

    const res = await query(
      `INSERT INTO public.appointments (
        booking_reference, patient_name, patient_phone, patient_email, service,
        store_location, appointment_date, time_slot, status, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *;`,
      [bookingRef, patientName, patientPhone, patientEmail, service, storeLocation, appointmentDate, timeSlot, status, notes]
    );

    return NextResponse.json({
      success: true,
      message: "Eye examination appointment confirmed in PostgreSQL",
      appointment: res.rows[0],
    });
  } catch (error: any) {
    console.error("Appointments POST error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to book appointment" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status } = body;
    if (!id || !status) {
      return NextResponse.json({ success: false, error: "Appointment ID and status are required" }, { status: 400 });
    }

    const allowedStatuses = ["pending", "confirmed", "completed", "cancelled"];
    if (!allowedStatuses.includes(status)) {
      return NextResponse.json({ success: false, error: "Invalid appointment status" }, { status: 400 });
    }

    const res = await query(
      `UPDATE public.appointments
       SET status = $1, updated_at = NOW()
       WHERE id::text = $2 OR booking_reference = $2
       RETURNING *;`,
      [status, id]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ success: false, error: "Appointment record not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Appointment marked as ${status}`,
      appointment: res.rows[0],
    });
  } catch (error: any) {
    console.error("Appointments PATCH error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to update appointment" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, error: "Appointment ID is required" }, { status: 400 });
    }

    const res = await query(`DELETE FROM public.appointments WHERE id::text = $1 OR booking_reference = $1 RETURNING id;`, [id]);
    if (res.rows.length === 0) {
      return NextResponse.json({ success: false, error: "Appointment not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Appointment removed successfully",
    });
  } catch (error: any) {
    console.error("Appointments DELETE error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to delete appointment" },
      { status: 500 }
    );
  }
}
