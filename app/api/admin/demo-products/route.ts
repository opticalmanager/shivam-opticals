import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    success: true,
    message: "Demo product seeding is disabled. Catalog operates on live boutique inventory.",
    count: 0,
    items: [],
  });
}

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: "Demo products seeding has been permanently disabled. Use Add New Frame in the Admin Catalog to register inventory.",
    },
    { status: 403 }
  );
}

export async function DELETE() {
  return NextResponse.json({
    success: true,
    deletedCount: 0,
    message: "No demo products active in catalog.",
  });
}
