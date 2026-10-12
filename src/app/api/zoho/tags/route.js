import { NextResponse } from "next/server";
import { getReportingTags } from "@/lib/zoho/tags";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const refresh = searchParams.get("refresh") === "true";
    const tags = await getReportingTags(refresh);
    return NextResponse.json({
      success: true,
      data: tags,
    });
  } catch (error) {
    console.error("[API] GET Tags Error:", error.message || error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch tags" },
      { status: 500 }
    );
  }
}
