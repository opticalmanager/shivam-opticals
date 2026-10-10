import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSettings as getFallbackSettings, updateSettings as updateFallbackSettings } from "@/lib/adminDb";

export const dynamic = "force-dynamic";

function parseSettingValue(rawVal: any) {
  if (rawVal === null || rawVal === undefined) return null;
  if (typeof rawVal === "string") {
    try {
      const parsed = JSON.parse(rawVal);
      if (typeof parsed === "string") {
        try {
          return JSON.parse(parsed);
        } catch {
          return parsed;
        }
      }
      return parsed;
    } catch {
      return rawVal;
    }
  }
  return rawVal;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");

    if (key) {
      try {
        const res = await query(`SELECT value FROM public.admin_settings WHERE key = $1;`, [key]);
        if (res.rows.length > 0) {
          const parsed = parseSettingValue(res.rows[0].value);
          return NextResponse.json(
            { success: true, key, value: parsed },
            { headers: { "Cache-Control": "no-store, no-cache, max-age=0, must-revalidate" } }
          );
        }
      } catch (dbErr) {
        console.warn("[ADMIN-SETTINGS] DB query error:", dbErr);
      }

      // Fallback
      const val = getFallbackSettings(key);
      return NextResponse.json({ success: true, key, value: val });
    }

    try {
      const allRes = await query(`SELECT key, value, updated_at FROM public.admin_settings;`);
      if (allRes.rows.length > 0) {
        const settingsMap: Record<string, any> = {};
        for (const r of allRes.rows) {
          settingsMap[r.key] = parseSettingValue(r.value);
        }
        return NextResponse.json(
          { success: true, settings: settingsMap },
          { headers: { "Cache-Control": "no-store, no-cache, max-age=0, must-revalidate" } }
        );
      }
    } catch (dbErr) {
      console.warn("[ADMIN-SETTINGS] DB query error for all:", dbErr);
    }

    const all = getFallbackSettings();
    return NextResponse.json({ success: true, settings: all });
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
      return NextResponse.json(
        { success: false, error: "key and value are required" },
        { status: 400 }
      );
    }

    let savedValue = value;

    try {
      const jsonValue = JSON.stringify(value);
      await query(
        `INSERT INTO public.admin_settings (key, value, updated_at)
         VALUES ($1, $2::jsonb, NOW())
         ON CONFLICT (key) 
         DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();`,
        [key, jsonValue]
      );
      savedValue = value;
    } catch (dbErr) {
      console.warn("[ADMIN-SETTINGS] PostgreSQL upsert fallback:", dbErr);
      updateFallbackSettings(key, value);
      savedValue = getFallbackSettings(key);
    }

    return NextResponse.json({
      success: true,
      message: `Settings for '${key}' updated successfully in PostgreSQL`,
      key,
      value: savedValue,
    });
  } catch (error: any) {
    console.error("Settings PUT error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to update settings" },
      { status: 500 }
    );
  }
}
