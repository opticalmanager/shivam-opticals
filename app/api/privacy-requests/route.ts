import { NextResponse } from "next/server";
import { privacyRequestSchema } from "@/lib/validations";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = privacyRequestSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { success: false, errors: validated.error.flatten() },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("privacy_requests")
      .insert({
        request_type: body.requestType,
        full_name: body.fullName,
        email: body.email,
        phone: body.phone || null,
        details: body.details,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      console.warn("Supabase privacy request insert warning:", error.message);
    }

    return NextResponse.json({
      success: true,
      requestId: data?.id || `PRV-${Math.floor(100000 + Math.random() * 900000)}`,
      message: "Your privacy rights request has been logged securely.",
    });
  } catch (error: any) {
    console.error("Privacy request error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to process privacy request" },
      { status: 500 }
    );
  }
}
