import { NextRequest, NextResponse } from "next/server";
import { getSettings, updateSettings } from "@/lib/adminDb";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");

    if (key) {
      const val = getSettings(key);
      return NextResponse.json({
        success: true,
        key,
        value: val,
      });
    }

    const all = getSettings();
    return NextResponse.json({
      success: true,
      settings: all,
    });
  } catch (error: any) {
    console.error("Settings GET error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to load settings" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { key, value } = body;

    if (!key || value === undefined) {
      return NextResponse.json({ success: false, error: "key and value are required" }, { status: 400 });
    }

    updateSettings(key, value);
    const updatedVal = getSettings(key);

    return NextResponse.json({
      success: true,
      message: `Settings for '${key}' updated successfully`,
      key,
      value: updatedVal,
    });
  } catch (error: any) {
    console.error("Settings PUT error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to update settings" },
      { status: 500 }
    );
  }
}
