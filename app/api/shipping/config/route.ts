import { NextResponse } from "next/server";
import { getShippingConfig } from "@/lib/shippingSettings";

export async function GET() {
  try {
    const config = await getShippingConfig();
    return NextResponse.json({
      freeShippingThreshold: config.freeShippingThreshold || 1999,
      standardShippingFee: config.standardShippingFee || 150,
      expressShippingFee: config.expressShippingFee || 350,
      defaultCarrier: config.defaultCarrier || "BlueDart Express",
      supportedCarriers: config.supportedCarriers || ["BlueDart Express", "Delhivery Air"],
    });
  } catch (err: any) {
    return NextResponse.json({
      freeShippingThreshold: 1999,
      standardShippingFee: 150,
      expressShippingFee: 350,
      defaultCarrier: "BlueDart Express",
      supportedCarriers: ["BlueDart Express"],
    });
  }
}
