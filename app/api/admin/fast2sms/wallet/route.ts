import { NextResponse } from "next/server";
import { checkFast2SmsWallet } from "@/lib/smsClient";

/**
 * Shivam Opticals Admin API - Fast2SMS Wallet Balance Query
 * GET /api/admin/fast2sms/wallet
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const customKey = searchParams.get("key")?.trim();

    const result = await checkFast2SmsWallet(customKey || undefined);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Unable to check Fast2SMS wallet balance" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      wallet: result.wallet,
      smsCount: result.smsCount,
    });
  } catch (error: any) {
    console.error("[ADMIN-FAST2SMS-WALLET] Error checking wallet balance:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
