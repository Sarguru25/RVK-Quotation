import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac/auth";
import { PERMISSIONS } from "@/lib/rbac/permissions";
import { zohoFetch } from "@/lib/zoho/client";
import { syncQuotations } from "@/lib/zoho-sync/syncQuotations";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/db";
import ActivityLog from "@/models/ActivityLog";

export async function POST(req, context) {
  try {
    await requirePermission(PERMISSIONS.QUOTATION.EDIT);
    const { id } = await context.params;
    const body = await req.json();
    const reason = body.reason || "Status reverted to draft.";

    // 1. Mark as draft in Zoho
    const draftData = await zohoFetch(`/estimates/${id}/status/draft`, {
      method: "POST"
    });

    // 2. Add comment in Zoho
    await zohoFetch(`/estimates/${id}/comments`, {
      method: "POST",
      body: {
        description: `Status changed to Draft. Reason: ${reason}`
      }
    });

    // 3. Log activity
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      await dbConnect();
      await ActivityLog.create({
        user: session.user.id,
        action: "converted_to_draft",
        module: "quotation",
        description: `Reverted quotation to draft. Reason: ${reason}`,
        metadata: { quotationId: id, reason }
      });
    }

    // 4. Sync
    syncQuotations('incremental').catch(e => console.error("Auto-sync error:", e));

    return NextResponse.json({
      success: true,
      message: "Quotation successfully converted to draft",
      data: draftData
    });
  } catch (error) {
    if (error.message?.includes("Forbidden") || error.message?.includes("Unauthorized")) {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error("[API] Mark Draft Error:", error.message || error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to mark as draft" },
      { status: error.status || 500 }
    );
  }
}
