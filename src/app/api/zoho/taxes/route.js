import { NextResponse } from "next/server";
import { getTaxes as getTaxesFromDB } from "@/lib/db-queries/getTaxes";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 200;
    const search = searchParams.get('search') || '';
    
    const result = await getTaxesFromDB({ page, limit, search });
    return NextResponse.json(result);
  } catch (error) {
    console.error("[API] GET Taxes Error:", error.message || error);
    return NextResponse.json({ data: [], meta: { total: 0 } }, { status: 500 });
  }
}