import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    // Probe database connectivity
    const dbRes = await query("SELECT NOW() as current_time;");
    const dbConnected = Boolean(dbRes.rows && dbRes.rows.length > 0);

    return NextResponse.json({
      status: "ok",
      brand: "Shivam Optical",
      service: "Shivam Optical Atelier & Clinical Eyewear System",
      timestamp: new Date().toISOString(),
      database: {
        connected: dbConnected,
        serverTime: dbRes.rows[0]?.current_time,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "degraded",
        brand: "Shivam Optical",
        service: "Shivam Optical Atelier & Clinical Eyewear System",
        timestamp: new Date().toISOString(),
        database: {
          connected: false,
          error: error?.message || "Database connection error",
        },
      },
      { status: 500 }
    );
  }
}
