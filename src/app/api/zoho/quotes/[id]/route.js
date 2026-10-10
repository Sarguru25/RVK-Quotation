import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac/auth";
import { PERMISSIONS } from "@/lib/rbac/permissions";
import { updateQuotation, deleteQuotation, getQuotationById, submitQuotationForApproval, markQuotationAsSent } from "@/lib/zoho/quotations";
import { syncQuotations } from "@/lib/zoho-sync/syncQuotations";

export async function GET(req, context) {
  try {
    // await requirePermission(PERMISSIONS.QUOTATION.VIEW);
    const { id } = await context.params;
    
    const estimate = await getQuotationById(id);
    return NextResponse.json(estimate);
  } catch (error) {
    if (error.message?.includes("Forbidden") || error.message?.includes("Unauthorized")) {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error("[API] GET Quote Error:", error.message || error);
    return NextResponse.json(
      { error: "Failed to fetch quotation" },
      { status: error.status || 500 }
    );
  }
}

export async function PUT(req, context) {
  try {
    await requirePermission(PERMISSIONS.QUOTATION.EDIT);
    const { id } = await context.params;
    const body = await req.json();

    let customerId = body.customer_id;
    if (customerId && customerId.match(/^[0-9a-fA-F]{24}$/)) {
      const dbConnect = (await import('@/lib/db')).default;
      await dbConnect();
      const Customer = (await import('@/models/Customer')).default;
      const cust = await Customer.findById(customerId).lean();
      if (cust && cust.zoho_customer_id) {
        customerId = cust.zoho_customer_id;
      }
    }

    const rawLineItems = Array.isArray(body.line_items) ? body.line_items : [];
    const validItems = rawLineItems.filter((item) => {
      const hasId = Boolean(item.item_id && String(item.item_id).trim());
      const hasName = Boolean(item.name && String(item.name).trim());
      const hasDesc = Boolean(item.description && String(item.description).trim());
      const hasRate = Number(item.rate) > 0;
      return hasId || hasName || hasDesc || hasRate;
    });

    if (validItems.length === 0) {
      return NextResponse.json(
        { success: false, error: "Select an item or give a description to update the quotation." },
        { status: 400 }
      );
    }

    const line_items = validItems.map((item) => {
      const payloadItem = {
        name: item.name || "Item",
        quantity: Number(item.quantity) || 1,
        rate: Number(item.rate) || 0,
      };
      if (item.item_id) payloadItem.item_id = item.item_id;
      if (item.line_item_id) payloadItem.line_item_id = item.line_item_id;
      if (item.description && String(item.description).trim()) {
        payloadItem.description = String(item.description).trim();
      } else if (!item.item_id && item.name && String(item.name).trim()) {
        payloadItem.description = String(item.name).trim();
      }
      payloadItem.tax_id = item.tax_id || "";
      return payloadItem;
    });

    for (let i = 0; i < line_items.length; i++) {
      const it = line_items[i];
      if (!it.item_id && !it.description) {
        return NextResponse.json(
          { success: false, error: `Row #${i + 1}: Select an item or give a description to update the quotation.` },
          { status: 400 }
        );
      }
    }

    const quotePayload = {
      customer_id: customerId,
      reference_number: body.reference_number,
      date: body.date,
      expiry_date: body.expiry_date,
      subject: body.subject,
      subject_content: body.subject,
      notes: body.notes,
      terms: body.terms,
      discount: body.discount_type === "amount" ? (Number(body.discount_value) || 0) : `${Number(body.discount_value) || 0}%`,
      discount_type: "entity_level",
      is_discount_before_tax: true,
      shipping_charge: Number(body.shipping_charges) || 0,
      adjustment: Number(body.adjustment) || 0,
      line_items,
      custom_fields: []
    };

    if (body.salesperson) {
      quotePayload.salesperson_name = body.salesperson;
    }

    const customFieldsMapping = {
      cf_quotation_creater: "cf_quotation_creater",
      project_name: "cf_project_name",
      offer_status: "cf_offer_status",
      estimated_margin: "cf_estimated_margin",
      epc_customer: "cf_epc_customer",
      project: "cf_project",
      end_user: "cf_end_user",
      market_segment: "cf_market_segment"
    };

    for (const [bodyKey, apiName] of Object.entries(customFieldsMapping)) {
      if (body[bodyKey] !== undefined && body[bodyKey] !== "") {
        quotePayload.custom_fields.push({
          api_name: apiName,
          value: body[bodyKey]
        });
      }
    }

    const data = await updateQuotation(id, quotePayload);

    if (body.actionType === 'approve') {
      await requirePermission(PERMISSIONS.QUOTATION.APPROVE);
      try {
        const { approveQuotation, submitQuotationForApproval, markQuotationAsAccepted } = require("@/lib/zoho/quotations");
        try {
          await approveQuotation(id);
        } catch (e) {
          try {
            await submitQuotationForApproval(id);
            await approveQuotation(id);
          } catch (e2) {
            try {
              await markQuotationAsAccepted(id);
            } catch (e3) {
              console.error("Failed to approve quotation:", e3);
            }
          }
        }
      } catch (err) {
        console.error("Failed to approve quotation:", err);
      }
    } else if (body.isSubmit) {
      await requirePermission(PERMISSIONS.QUOTATION.SUBMIT);
      try {
        const { submitQuotationForApproval, markQuotationAsSent, getQuotationById } = require("@/lib/zoho/quotations");
        let currentStatus = data?.estimate?.status;
        if (!currentStatus) {
          try {
            const fetched = await getQuotationById(id);
            currentStatus = fetched?.status;
          } catch(e) {}
        }

        if (currentStatus !== 'pending_approval' && currentStatus !== 'approved') {
          try {
            await submitQuotationForApproval(id);
          } catch (e) {
            const errMsg = (e.message || "").toLowerCase();
            if (!errMsg.includes("already") && !errMsg.includes("pending") && !errMsg.includes("submitted")) {
              try {
                const latest = await getQuotationById(id);
                if (latest?.status !== 'pending_approval' && latest?.status !== 'approved') {
                  await markQuotationAsSent(id);
                }
              } catch(errSent) {
                console.error("Failed to mark quotation as sent:", errSent);
              }
            }
          }
        }
      } catch (err) {
        console.error("Failed to submit quotation:", err);
      }
    }

    const response = NextResponse.json({
      success: true,
      data,
    });
    
    syncQuotations('incremental').catch(e => console.error("Auto-sync error:", e));
    
    return response;
  } catch (error) {
    if (error.message?.includes("Forbidden") || error.message?.includes("Unauthorized")) {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error("[API] PUT Quote Error:", error.message || error);
    const status = (typeof error.status === 'number' && error.status >= 400 && error.status < 600) ? error.status : 400;
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update quotation" },
      { status }
    );
  }
}

export async function DELETE(req, context) {
  try {
    await requirePermission(PERMISSIONS.QUOTATION.DELETE);
    const { id } = await context.params;
    
    const data = await deleteQuotation(id);
    
    const response = NextResponse.json({
      success: true,
      data,
    });
    
    syncQuotations('incremental').catch(e => console.error("Auto-sync error:", e));
    
    return response;
  } catch (error) {
    if (error.message?.includes("Forbidden") || error.message?.includes("Unauthorized")) {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error("[API] DELETE Quote Error:", error.message || error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete quotation" },
      { status: error.status || 500 }
    );
  }
}