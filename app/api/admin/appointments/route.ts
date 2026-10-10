import { NextRequest, NextResponse } from "next/server";
import { getAppointments, createAppointment, updateAppointmentStatus } from "@/lib/adminDb";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const appointments = getAppointments();
    return NextResponse.json({
      success: true,
      appointments,
    });
  } catch (error: any) {
    console.error("Appointments GET error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to load appointments" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.name || !body.phone) {
      return NextResponse.json({ success: false, error: "Name and phone number are required" }, { status: 400 });
    }

    const apt = createAppointment(body);
    return NextResponse.json({
      success: true,
      message: "Appointment booked successfully",
      appointment: apt,
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

    const ok = updateAppointmentStatus(id, status);
    if (!ok) {
      return NextResponse.json({ success: false, error: "Appointment not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Appointment updated successfully",
    });
  } catch (error: any) {
    console.error("Appointments PATCH error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to update appointment" },
      { status: 500 }
    );
  }
}
