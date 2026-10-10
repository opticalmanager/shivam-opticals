import { NextRequest, NextResponse } from "next/server";
import { checkCourierServiceability } from "@/lib/shiprocketClient";
import { getShippingConfig } from "@/lib/shippingSettings";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawPincode = searchParams.get("pincode") || "";
    const pincode = rawPincode.trim();
    const isRx = searchParams.get("isRx") === "true";

    // Edge case 1: Validate 6-digit Indian PIN code format
    if (!pincode || !/^\d{6}$/.test(pincode)) {
      return NextResponse.json(
        { success: false, message: "Please provide a valid 6-digit Indian postal PIN code" },
        { status: 400 }
      );
    }

    const config = await getShippingConfig();
    const result = await checkCourierServiceability({
      deliveryPincode: pincode,
      pickupPincode: config.shiprocketPickupPincode || "110091", // Mayur Vihar Phase 1 Ext pickup
      weightKg: config.defaultWeightKg || 0.35,
    });

    if (!result.serviceable || !result.recommendedCourier) {
      return NextResponse.json({
        success: true,
        serviceable: false,
        message: "This location is currently outside our direct express courier coverage.",
      });
    }

    const baseDays = result.recommendedCourier.estimatedDays || 3;
    // Add 2 business days for robotic prescription lens surfacing & clinical QC if Rx is present
    const labBufferDays = isRx ? 2 : 0;
    const totalDays = baseDays + labBufferDays;

    const finalDeliveryDate = new Date();
    finalDeliveryDate.setDate(finalDeliveryDate.getDate() + totalDays);

    const formattedFinalDate = finalDeliveryDate.toLocaleDateString("en-IN", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });

    return NextResponse.json({
      success: true,
      serviceable: true,
      pincode,
      carrier: result.recommendedCourier.courierName,
      baseDeliveryDays: baseDays,
      labBufferDays,
      totalDays,
      estimatedDeliveryDate: formattedFinalDate,
      freeShipping: true,
      couriers: result.couriers,
      isSimulation: result.isSimulation || false,
    });
  } catch (error: any) {
    console.error("[ESTIMATE-DELIVERY] API Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to calculate delivery estimate" },
      { status: 500 }
    );
  }
}
