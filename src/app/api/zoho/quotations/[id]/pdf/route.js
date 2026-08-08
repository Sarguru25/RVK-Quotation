import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac/auth";
import { PERMISSIONS } from "@/lib/rbac/permissions";
import { downloadQuotationPDF } from "@/lib/zoho/quotations";

export async function GET(request, context) {
  try {
    await requirePermission(PERMISSIONS.QUOTATION.VIEW);
    const { id } = await context.params;

    const response = await downloadQuotationPDF(id);
    const pdfBuffer = await response.arrayBuffer();

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="QT-${id}.pdf"`,
      },
    });
  } catch (error) {
    if (error.message?.includes("Forbidden") || error.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("[API] PDF Download Error:", error.message || error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: error.status || 500 }
    );
  }
}
