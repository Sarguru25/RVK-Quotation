import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac/auth";
import { PERMISSIONS } from "@/lib/rbac/permissions";
import { getItems as getItemsFromDB } from "@/lib/db-queries/getItems";

export async function GET(req) {
  try {
    await requirePermission(PERMISSIONS.PRODUCT.VIEW);
    
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10000;
    const search = searchParams.get('search') || '';
    
    const result = await getItemsFromDB({ page, limit, search });
    return NextResponse.json(result);
  } catch (error) {
    if (error.message?.includes("Forbidden") || error.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("[API] GET Items Error:", error.message || error);
    return NextResponse.json({ data: [], meta: { total: 0 } }, { status: 500 });
  }
}