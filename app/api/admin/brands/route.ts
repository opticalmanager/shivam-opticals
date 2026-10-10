import { NextRequest, NextResponse } from "next/server";
import { getBrands, createBrand, updateBrand, deleteBrand } from "@/lib/adminDb";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const brands = getBrands();
    return NextResponse.json({
      success: true,
      brands,
    });
  } catch (error: any) {
    console.error("Brands GET error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to load brands" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.name) {
      return NextResponse.json({ success: false, error: "Brand name is required" }, { status: 400 });
    }

    const brand = createBrand(body);
    return NextResponse.json({
      success: true,
      message: "Brand created successfully",
      brand,
    });
  } catch (error: any) {
    console.error("Brands POST error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to create brand" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ success: false, error: "Brand ID is required" }, { status: 400 });
    }

    const updated = updateBrand(body.id, body);
    if (!updated) {
      return NextResponse.json({ success: false, error: "Brand not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Brand updated successfully",
      brand: updated,
    });
  } catch (error: any) {
    console.error("Brands PATCH error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to update brand" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, error: "Brand ID is required" }, { status: 400 });
    }

    const ok = deleteBrand(id);
    if (!ok) {
      return NextResponse.json({ success: false, error: "Brand not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Brand deleted successfully",
    });
  } catch (error: any) {
    console.error("Brands DELETE error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to delete brand" },
      { status: 500 }
    );
  }
}
