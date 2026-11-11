import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac/auth";
import { PERMISSIONS } from "@/lib/rbac/permissions";
import { getCustomers as getCustomersFromDB } from "@/lib/db-queries/getCustomers";
import { createCustomer } from "@/lib/zoho/customers";
import { syncCustomers } from "@/lib/zoho-sync/syncCustomers";
import dbConnect from "@/lib/db";
import Tax from "@/models/Tax";

export async function GET(req) {
  try {
    await requirePermission(PERMISSIONS.CUSTOMER.VIEW);
    
    // Parse query params for search, pagination, etc
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const search = searchParams.get('search') || '';
    
    const result = await getCustomersFromDB({ page, limit, search });
    return NextResponse.json(result);
  } catch (error) {
    if (error.message?.includes("Forbidden") || error.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("[API] GET Customers Error:", error.message || error);
    return NextResponse.json({ data: [], meta: { total: 0 } }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await requirePermission(PERMISSIONS.CUSTOMER.CREATE);
    
    const body = await req.json();

    // Resolve tax_id if Mongo ObjectId was sent
    let taxId = body.tax_id || undefined;
    if (taxId && /^[0-9a-fA-F]{24}$/.test(taxId)) {
      await dbConnect();
      const taxDoc = await Tax.findById(taxId).lean();
      if (taxDoc?.zoho_tax_id) {
        taxId = taxDoc.zoho_tax_id;
      }
    }

    // Process reporting tags
    let tags = [];
    if (Array.isArray(body.tags) && body.tags.length > 0) {
      tags = body.tags.filter(t => t && t.tag_id && t.tag_option_id);
    }
    if (body.job_number_tag_option_id && !tags.some(t => t.tag_id === "2315070000000000333")) {
      tags.push({
        tag_id: body.job_number_tag_id || "2315070000000000333",
        tag_option_id: body.job_number_tag_option_id,
      });
    }
    if (body.market_segment_tag_option_id && !tags.some(t => t.tag_id === "2315070000000000335")) {
      tags.push({
        tag_id: body.market_segment_tag_id || "2315070000000000335",
        tag_option_id: body.market_segment_tag_option_id,
      });
    }

    const customerPayload = {
      contact_name: body.contact_name,
      company_name: body.company_name,
      customer_sub_type: body.customer_sub_type || "business",
      contact_type: "customer",
      email: body.email,
      phone: body.phone,
      mobile: body.mobile,
      salutation: body.salutation,
      first_name: body.first_name,
      last_name: body.last_name,
      notes: body.remarks || "",
      language_code: body.language_code || "en",
      currency_code: body.currency_code || "SGD",
      payment_terms: parseInt(body.payment_terms) || 15,
      payment_terms_label: body.payment_terms == "100" ? "100% Advance" : body.payment_terms == "15" ? "Due on Receipt" : `Net ${body.payment_terms}`,
      is_portal_enabled: body.enable_portal || false,
      billing_address: body.billing_address,
      shipping_address: body.shipping_address,
      tax_id: taxId || undefined,
      company_id: body.company_id || undefined,
      contact_persons: (body.contact_persons || []).filter(cp => cp.email || cp.first_name || cp.last_name),
      custom_fields: [
        {
          customfield_id: "2315070000000071093",
          value: body.registration_no || ""
        }
      ]
    };

    if (tags.length > 0) {
      customerPayload.tags = tags;
    }

    const data = await createCustomer(customerPayload);

    const response = NextResponse.json({
      success: true,
      data: data.contact,
    });
    
    syncCustomers('auto').catch(e => console.error("Auto-sync error:", e));
    
    return response;
  } catch (error) {
    if (error.message?.includes("Forbidden") || error.message?.includes("Unauthorized")) {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error("[API] POST Customer Error:", error.message || error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create customer" },
      { status: error.status || 500 }
    );
  }
}
