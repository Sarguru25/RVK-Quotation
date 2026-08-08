import { NextResponse } from "next/server";
import { requirePermission, logActivity } from "@/lib/rbac/auth";
import { PERMISSIONS } from "@/lib/rbac/permissions";
import { sendQuotationEmail } from "@/lib/zoho/quotations";
import { syncQuotations } from "@/lib/zoho-sync/syncQuotations";

export async function POST(request, context) {
  try {
    const session = await requirePermission(PERMISSIONS.QUOTATION.SEND);
    const { id } = await context.params;

    const body = await request.json();
    
    const payload = {
      send_from_org_email_id: true,
      to_mail_ids: [body.to],
      cc_mail_ids: body.cc ? body.cc.split(",").map(e => e.trim()).filter(Boolean) : [],
      subject: body.subject,
      body: body.message,
    };

    const data = await sendQuotationEmail(id, payload);

    // Log the activity
    await logActivity({
      userId: session.user.id,
      action: "SEND_EMAIL",
      module: "QUOTATION",
      description: `Sent quotation email to ${body.to}`,
      metadata: { quotationId: id },
      req: request
    });

    const response = NextResponse.json({
      success: true,
      message: "Email sent successfully",
      data
    });
    
    syncQuotations('incremental').catch(e => console.error("Auto-sync error:", e));
    
    return response;
  } catch (error) {
    if (error.message?.includes("Forbidden") || error.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("[API] Send Email Error:", error.message || error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: error.status || 500 }
    );
  }
}
