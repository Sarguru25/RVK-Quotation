import { NextResponse } from "next/server";
import axios from "axios";
import { getZohoAccessToken } from "@/lib/zoho";
import dbConnect from "@/lib/db";
import Customer from "@/models/Customer";
import { syncCustomers } from "@/lib/zoho-sync/syncCustomers";

const ZOHO_ORGANIZATION_ID = process.env.ZOHO_ORGANIZATION_ID;

export async function GET(req, context) {
  try {
    const { id } = await context.params;
    await dbConnect();

    const dbCustomer = await Customer.findOne({
      $or: [
        { zoho_customer_id: id },
        ...(id.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: id }] : [])
      ]
    }).lean();

    if (!dbCustomer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...(dbCustomer.rawZohoData || {}),
      ...dbCustomer,
    });
  } catch (error) {
    console.error("GET Customer Error:", error.message);
    return NextResponse.json(
      { error: "Failed to fetch customer" },
      { status: 500 }
    );
  }
}

export async function PUT(req, context) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    await dbConnect();

    // 1. Find the customer in DB
    const dbCustomer = await Customer.findOne({
      $or: [
        { zoho_customer_id: id },
        ...(id.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: id }] : [])
      ]
    });

    if (!dbCustomer) {
      return NextResponse.json({ success: false, error: "Customer not found in local DB" }, { status: 404 });
    }

    const realZohoId = dbCustomer.zoho_customer_id;
    let zohoResponseData = body;

    // 2. Try to update in Zoho if it's linked
    if (realZohoId) {
      try {
        const accessToken = await getZohoAccessToken();
        const customerPayload = {
          ...body,
          company_name: body.company_name || body.contact_name,
        };

        const response = await axios.put(
          `https://www.zohoapis.com/books/v3/contacts/${realZohoId}`,
          customerPayload,
          {
            headers: {
              Authorization: `Zoho-oauthtoken ${accessToken}`,
            },
            params: {
              organization_id: ZOHO_ORGANIZATION_ID,
            },
          }
        );
        zohoResponseData = response.data.contact;
      } catch (zohoError) {
        console.warn("Could not sync update with Zoho API:", zohoError.response?.data || zohoError.message);
        // Continue with local update even if Zoho fails, depending on requirements
      }
    }

    // 3. Update MongoDB cache
    const updatedCustomer = await Customer.findByIdAndUpdate(
      dbCustomer._id,
      {
        $set: {
          customer_name: body.contact_name || body.customer_name,
          company_name: body.company_name || body.contact_name,
          email: body.email,
          phone: body.phone,
          mobile: body.mobile,
          billing_address: body.billing_address,
          shipping_address: body.shipping_address,
          rawZohoData: { ...(dbCustomer.rawZohoData || {}), ...zohoResponseData }
        }
      },
      { new: true }
    );

    const response = NextResponse.json({
      success: true,
      data: updatedCustomer,
    });
    
    syncCustomers('auto').catch(e => console.error("Auto-sync error:", e));
    
    return response;
  } catch (error) {
    console.error("PUT Customer Error:", error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req, context) {
  try {
    const { id } = await context.params;
    await dbConnect();

    // 1. Find the customer in DB
    const dbCustomer = await Customer.findOne({
      $or: [
        { zoho_customer_id: id },
        ...(id.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: id }] : [])
      ]
    });

    if (!dbCustomer) {
      return NextResponse.json({ success: false, error: "Customer not found in local DB" }, { status: 404 });
    }

    const realZohoId = dbCustomer.zoho_customer_id;

    // 2. Try to delete from Zoho
    if (realZohoId) {
      try {
        const accessToken = await getZohoAccessToken();
        await axios.delete(
          `https://www.zohoapis.com/books/v3/contacts/${realZohoId}`,
          {
            headers: {
              Authorization: `Zoho-oauthtoken ${accessToken}`,
            },
            params: {
              organization_id: ZOHO_ORGANIZATION_ID,
            },
          }
        );
      } catch (zohoError) {
        console.warn("Could not delete from Zoho API:", zohoError.response?.data || zohoError.message);
      }
    }

    // 3. Delete from MongoDB
    await Customer.findByIdAndDelete(dbCustomer._id);

    const response = NextResponse.json({
      success: true,
      data: { message: "Deleted successfully" },
    });
    
    syncCustomers('auto').catch(e => console.error("Auto-sync error:", e));
    
    return response;
  } catch (error) {
    console.error("DELETE Customer Error:", error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
