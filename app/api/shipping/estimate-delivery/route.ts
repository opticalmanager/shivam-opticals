import { NextRequest, NextResponse } from "next/server";
import { checkCourierServiceability, fetchBenchmarkShiprocketRates } from "@/lib/shiprocketClient";
import { getShippingConfig } from "@/lib/shippingSettings";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // 1. Support benchmark mode for admin command center
    if (searchParams.get("mode") === "benchmark") {
      const config = await getShippingConfig();
      const benchmarkData = await fetchBenchmarkShiprocketRates(
        config.shiprocketPickupPincode || "110091"
      );
      return NextResponse.json(benchmarkData);
    }

    const rawPincode = searchParams.get("pincode") || "";
    const pincode = rawPincode.trim();
    const isRx = searchParams.get("isRx") === "true";
    const amount = Number(searchParams.get("amount") || 0);

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
      pickupPincode: config.shiprocketPickupPincode || "110091",
      weightKg: config.defaultWeightKg || 0.35,
    });

    if (!result.serviceable || (!result.recommendedCourier && !result.standardCourier)) {
      return NextResponse.json({
        success: true,
        serviceable: false,
        message: "This location is currently outside our direct express courier coverage.",
      });
    }

    const standardCourier = result.standardCourier || result.recommendedCourier!;
    const expressCourier = result.expressCourier || result.recommendedCourier!;

    // Free delivery calculation
    const isEligibleForFree = Boolean(
      config.isFreeShippingEnabled !== false &&
      config.freeShippingThreshold > 0 &&
      amount >= config.freeShippingThreshold
    );

    const labBufferDays = isRx ? 2 : 0;

    const stdTotalDays = (standardCourier.estimatedDays || 3) + labBufferDays;
    const expTotalDays = (expressCourier.estimatedDays || 2) + labBufferDays;

    const formatEtd = (days: number) => {
      const d = new Date();
      d.setDate(d.getDate() + days);
      return d.toLocaleDateString("en-IN", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    };

    const standardRate = Number(standardCourier.rate) || config.standardShippingFee || 75;
    const expressRate = Number(expressCourier.rate) || config.expressShippingFee || 135;

    return NextResponse.json({
      success: true,
      serviceable: true,
      pincode,
      carrier: standardCourier.courierName,
      baseDeliveryDays: standardCourier.estimatedDays,
      labBufferDays,
      totalDays: stdTotalDays,
      estimatedDeliveryDate: formatEtd(stdTotalDays),
      freeShipping: isEligibleForFree,
      isSimulation: result.isSimulation || false,
      isLiveRate: !result.isSimulation,

      // Smart live rates for checkout
      standard: {
        rate: standardRate,
        finalFee: isEligibleForFree ? 0 : standardRate,
        carrier: standardCourier.courierName,
        estimatedDays: stdTotalDays,
        etd: formatEtd(stdTotalDays),
        isFree: isEligibleForFree,
      },
      express: {
        rate: expressRate,
        finalFee: expressRate,
        carrier: expressCourier.courierName,
        estimatedDays: expTotalDays,
        etd: formatEtd(expTotalDays),
      },

      couriers: result.couriers,
      pickupOrigin: `${config.shiprocketPickupCity || "Delhi"} (${config.shiprocketPickupPincode || "110091"})`,
    });
  } catch (error: any) {
    console.error("[ESTIMATE-DELIVERY] API Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to calculate delivery estimate" },
      { status: 500 }
    );
  }
}
