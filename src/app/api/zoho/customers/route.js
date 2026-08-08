import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac/auth";
import { PERMISSIONS } from "@/lib/rbac/permissions";
import { getCustomers as getCustomersFromDB } from "@/lib/db-queries/getCustomers";
import { createCustomer } from "@/lib/zoho/customers";
import { syncCustomers } from "@/lib/zoho-sync/syncCustomers";

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
      pan_no: body.pan_no,
      language_code: body.language_code || "en",
      currency_code: body.currency_code || "INR",
      payment_terms: parseInt(body.payment_terms) || 15,
      payment_terms_label: body.payment_terms == "15" ? "Due on Receipt" : `Net ${body.payment_terms}`,
      billing_address: body.billing_address,
      shipping_address: body.shipping_address,
    };

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
