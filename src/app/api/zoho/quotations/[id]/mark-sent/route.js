import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac/auth";
import { PERMISSIONS } from "@/lib/rbac/permissions";
import { markQuotationAsSent } from "@/lib/zoho/quotations";
import { syncQuotations } from "@/lib/zoho-sync/syncQuotations";

export async function POST(req, context) {
  try {
    await requirePermission(PERMISSIONS.QUOTATION.EDIT);
    const { id } = await context.params;

    const data = await markQuotationAsSent(id);
    syncQuotations('incremental').catch(e => console.error(e));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    if (error.message?.includes("Forbidden") || error.message?.includes("Unauthorized")) {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { success: false, error: error.message || "Failed to mark as sent" },
      { status: error.status || 500 }
    );
  }
}
