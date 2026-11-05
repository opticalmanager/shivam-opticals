import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const phone = searchParams.get("phone");
    const email = searchParams.get("email");

    if (!userId && !phone && !email) {
      return NextResponse.json(
        { success: false, error: "Identifier is required" },
        { status: 400 }
      );
    }

    let resolvedUserId: string | null = userId && userId.length >= 20 ? userId : null;
    const cleanPhone = phone ? phone.replace(/\D/g, "").slice(-10) : null;

    if (!resolvedUserId && (cleanPhone || email)) {
      try {
        const profRes = await query(
          `SELECT id FROM public.profiles 
           WHERE ($1::text IS NOT NULL AND RIGHT(REGEXP_REPLACE(COALESCE(phone, ''), '\D', '', 'g'), 10) = $1)
              OR ($2::text IS NOT NULL AND LOWER(email) = LOWER($2))
           LIMIT 1;`,
          [cleanPhone, email || null]
        );
        if (profRes.rows.length > 0) {
          resolvedUserId = profRes.rows[0].id;
        }
      } catch (e) {
        console.warn("[USER-PRESCRIPTIONS] Profile lookup error:", e);
      }
    }

    const prescriptions: any[] = [];

    // 1. Fetch from prescriptions table
    if (resolvedUserId) {
      try {
        const rxRes = await query(
          `SELECT id, user_id, patient_name, doctor_name, rx_date, right_eye, left_eye, pd, file_url, created_at
           FROM public.prescriptions
           WHERE user_id = $1
           ORDER BY created_at DESC;`,
          [resolvedUserId]
        );
        for (const row of rxRes.rows) {
          prescriptions.push({
            id: row.id,
            title: row.patient_name || "Prescription Record",
            doctor: row.doctor_name || "Certified Optometrist",
            date: row.rx_date ? new Date(row.rx_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Verified Rx",
            rightEye: typeof row.right_eye === "string" ? JSON.parse(row.right_eye) : row.right_eye,
            leftEye: typeof row.left_eye === "string" ? JSON.parse(row.left_eye) : row.left_eye,
            pd: row.pd ? String(row.pd) : "63.0",
            fileUrl: row.file_url,
          });
        }
      } catch (e) {
        console.warn("[USER-PRESCRIPTIONS] Query warning:", e);
      }
    }

    // 2. Also check if the user has past orders where custom lens prescriptions were submitted
    if (cleanPhone || email || resolvedUserId) {
      try {
        const orderRxRes = await query(
          `SELECT 
            o.id as order_id,
            o.order_number,
            o.created_at,
            oi.product_snapshot
           FROM public.orders o
           JOIN public.order_items oi ON oi.order_id = o.id
           WHERE (
             ($1::text IS NOT NULL AND RIGHT(REGEXP_REPLACE(COALESCE(o.guest_phone, ''), '\D', '', 'g'), 10) = $1) OR
             ($2::text IS NOT NULL AND LOWER(o.guest_email) = LOWER($2)) OR
             ($3::uuid IS NOT NULL AND o.customer_id = $3)
           ) AND (oi.product_snapshot->'prescription' IS NOT NULL)
           ORDER BY o.created_at DESC
           LIMIT 10;`,
          [cleanPhone, email || null, resolvedUserId || null]
        );

        for (const r of orderRxRes.rows) {
          const snapshot = typeof r.product_snapshot === "string" ? JSON.parse(r.product_snapshot) : r.product_snapshot;
          const rx = snapshot?.prescription;
          if (rx && (rx.rightEye || rx.odSphere || rx.sph)) {
            prescriptions.push({
              id: `rx-order-${r.order_number}`,
              title: `${snapshot.name || "Custom Frame"} Rx (Order #${r.order_number})`,
              doctor: "Configured at Checkout",
              date: new Date(r.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
              rightEye: {
                sph: rx.rightEye?.sph || rx.odSphere || rx.sphere || "0.00",
                cyl: rx.rightEye?.cyl || rx.odCyl || rx.cylinder || "0.00",
                axis: rx.rightEye?.axis || rx.odAxis || rx.axis || "0",
                add: rx.rightEye?.add || rx.odAdd || null,
              },
              leftEye: {
                sph: rx.leftEye?.sph || rx.osSphere || rx.sphere || "0.00",
                cyl: rx.leftEye?.cyl || rx.osCyl || rx.cylinder || "0.00",
                axis: rx.leftEye?.axis || rx.osAxis || rx.axis || "0",
                add: rx.leftEye?.add || rx.osAdd || null,
              },
              pd: String(rx.pd || rx.pupillaryDistance || "63.0"),
              orderNumber: r.order_number,
            });
          }
        }
      } catch (rxOrderErr) {
        console.warn("[USER-PRESCRIPTIONS] Order Rx lookup warning:", rxOrderErr);
      }
    }

    return NextResponse.json({
      success: true,
      prescriptions,
    });
  } catch (error: any) {
    console.error("[USER-PRESCRIPTIONS] GET error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, phone, email, prescription } = body;

    if (!prescription) {
      return NextResponse.json({ success: false, error: "Prescription data is required" }, { status: 400 });
    }

    let resolvedUserId: string | null = userId && userId.length >= 20 ? userId : null;
    const cleanPhone = phone ? phone.replace(/\D/g, "").slice(-10) : null;

    if (!resolvedUserId && (cleanPhone || email)) {
      try {
        const profRes = await query(
          `SELECT id FROM public.profiles 
           WHERE ($1::text IS NOT NULL AND RIGHT(REGEXP_REPLACE(COALESCE(phone, ''), '\D', '', 'g'), 10) = $1)
              OR ($2::text IS NOT NULL AND LOWER(email) = LOWER($2))
           LIMIT 1;`,
          [cleanPhone, email || null]
        );
        if (profRes.rows.length > 0) {
          resolvedUserId = profRes.rows[0].id;
        }
      } catch (e) {}
    }

    if (!resolvedUserId && cleanPhone) {
      try {
        const newProf = await query(
          `INSERT INTO public.profiles (full_name, phone, role)
           VALUES ($1, $2, 'customer')
           RETURNING id;`,
          [prescription.patientName || "Patron", phone || `+91 ${cleanPhone}`]
        );
        resolvedUserId = newProf.rows[0]?.id || null;
      } catch (e) {}
    }

    if (!resolvedUserId) {
      return NextResponse.json({ success: false, error: "Unable to associate prescription with user profile" }, { status: 400 });
    }

    const rightEye = JSON.stringify(prescription.rightEye || { sph: "0.00", cyl: "0.00", axis: "0" });
    const leftEye = JSON.stringify(prescription.leftEye || { sph: "0.00", cyl: "0.00", axis: "0" });
    const pd = parseFloat(prescription.pd) || 63.0;

    const res = await query(
      `INSERT INTO public.prescriptions (
        user_id, patient_name, doctor_name, rx_date, right_eye, left_eye, pd, file_url, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING id, patient_name, doctor_name, rx_date, right_eye, left_eye, pd;`,
      [
        resolvedUserId,
        prescription.title || prescription.patientName || "Vision Rx",
        prescription.doctor || "Certified Optometrist",
        prescription.date || new Date().toISOString().split("T")[0],
        rightEye,
        leftEye,
        pd,
        prescription.fileUrl || null,
      ]
    );

    return NextResponse.json({
      success: true,
      message: "Prescription record archived successfully",
      prescription: res.rows[0],
    });
  } catch (error: any) {
    console.error("[USER-PRESCRIPTIONS] POST error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Prescription ID required" }, { status: 400 });
    }

    await query(`DELETE FROM public.prescriptions WHERE id = $1;`, [id]);
    return NextResponse.json({ success: true, message: "Prescription deleted" });
  } catch (error: any) {
    console.error("[USER-PRESCRIPTIONS] DELETE error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
