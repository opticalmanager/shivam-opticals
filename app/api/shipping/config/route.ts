import { NextResponse } from "next/server";
import { getShippingConfig } from "@/lib/shippingSettings";

export async function GET() {
  try {
    const config = await getShippingConfig();
    return NextResponse.json({
      isFreeShippingEnabled: config.isFreeShippingEnabled !== false,
      freeShippingThreshold: config.freeShippingThreshold ?? 1999,
      useDynamicLiveRates: config.useDynamicLiveRates !== false,
      standardShippingFee: config.standardShippingFee ?? 75,
      expressShippingFee: config.expressShippingFee ?? 135,
      defaultCarrier: config.defaultCarrier || "BlueDart Express",
      supportedCarriers: config.supportedCarriers || ["BlueDart Express", "Delhivery Air", "Xpressbees Surface", "DTDC Air"],
      pickupPincode: config.shiprocketPickupPincode || "110091",
    });
  } catch (err: any) {
    return NextResponse.json({
      isFreeShippingEnabled: true,
      freeShippingThreshold: 1999,
      useDynamicLiveRates: true,
      standardShippingFee: 75,
      expressShippingFee: 135,
      defaultCarrier: "BlueDart Express",
      supportedCarriers: ["BlueDart Express"],
      pickupPincode: "110091",
    });
  }
}
