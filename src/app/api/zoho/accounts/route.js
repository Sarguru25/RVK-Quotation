import { NextResponse } from "next/server";
import { getAccounts } from "@/lib/zoho/accounts";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const refresh = searchParams.get("refresh") === "true";
    const accounts = await getAccounts(refresh);
    return NextResponse.json({
      success: true,
      data: accounts,
    });
  } catch (error) {
    console.error("[API] GET Accounts Error:", error.message || error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch accounts" },
      { status: 500 }
    );
  }
}
