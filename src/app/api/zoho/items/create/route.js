import { NextResponse } from "next/server";
import axios from "axios";
import { getZohoAccessToken } from "@/lib/zoho";

const ZOHO_ORGANIZATION_ID = process.env.ZOHO_ORGANIZATION_ID;

export async function POST(req) {
  try {
    const body = await req.json();
    const accessToken = await getZohoAccessToken();

    const itemPayload = {
      name: body.name,
      rate: Number(body.rate) || 0,
      description: body.description || "",
      sku: body.sku || "",
      product_type: body.product_type || "goods",
      unit: body.unit || "",
      purchase_rate: Number(body.purchase_rate) || 0,
      purchase_description: body.purchase_description || "",
    };

    if (body.tax_id) itemPayload.tax_id = body.tax_id;
    if (body.account_id) itemPayload.account_id = body.account_id;
    if (body.purchase_account_id) itemPayload.purchase_account_id = body.purchase_account_id;

    const response = await axios.post(
      `https://www.zohoapis.com/books/v3/items`,
      itemPayload,
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
        },
        params: {
          organization_id: ZOHO_ORGANIZATION_ID,
        },
      }
    );

    return NextResponse.json({
      success: true,
      data: response.data,
    });
  } catch (error) {
    console.error("CREATE ITEM ERROR:", error.response?.data || error.message);
    return NextResponse.json(
      { success: false, error: error.response?.data || error.message },
      { status: 500 }
    );
  }
}
