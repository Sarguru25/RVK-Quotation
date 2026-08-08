import { NextResponse } from "next/server";
import axios from "axios";
import { getZohoAccessToken } from "@/lib/zoho";
import dbConnect from "@/lib/db";
import Item from "@/models/Item";
import mongoose from "mongoose";

const ZOHO_ORGANIZATION_ID = process.env.ZOHO_ORGANIZATION_ID;

// Helper to resolve zoho_item_id from either MongoDB _id or zoho_item_id
async function getZohoItemId(id) {
  await dbConnect();
  if (mongoose.Types.ObjectId.isValid(id)) {
    const item = await Item.findById(id);
    if (item && item.zoho_item_id) {
      return { zohoItemId: item.zoho_item_id, localItem: item };
    }
  }
  const item = await Item.findOne({ zoho_item_id: id });
  return { zohoItemId: id, localItem: item };
}

// GET single item
export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const { zohoItemId, localItem } = await getZohoItemId(id);
    const accessToken = await getZohoAccessToken();

    try {
      const zohoItem = response.data.item;
      if (localItem) {
        const localObj = localItem.toObject ? localItem.toObject() : localItem;
        const mergedRaw = { ...(localObj.rawZohoData || {}), ...zohoItem };
        // Ensure available_for_sale and actual_available_stock are preserved from local rawZohoData if Zoho single item API omitted them
        if (zohoItem.available_for_sale === undefined && localObj.rawZohoData?.available_for_sale !== undefined) {
          mergedRaw.available_for_sale = localObj.rawZohoData.available_for_sale;
        }
        if (zohoItem.actual_available_stock === undefined && localObj.rawZohoData?.actual_available_stock !== undefined) {
          mergedRaw.actual_available_stock = localObj.rawZohoData.actual_available_stock;
        }
        return NextResponse.json({ ...localObj, rawZohoData: mergedRaw });
      }
      return NextResponse.json(zohoItem);
    } catch (zohoErr) {
      console.warn("Zoho GET failed, falling back to local item:", zohoErr.response?.data || zohoErr.message);
      if (localItem) {
        return NextResponse.json(localItem.rawZohoData || localItem);
      }
      throw zohoErr;
    }
  } catch (error) {
    console.error("GET ITEM ERROR:", error.response?.data || error.message);
    return NextResponse.json(null, { status: 500 });
  }
}

// UPDATE item
export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const { zohoItemId } = await getZohoItemId(id);
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

    const response = await axios.put(
      `https://www.zohoapis.com/books/v3/items/${zohoItemId}`,
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
    console.error("UPDATE ITEM ERROR:", error.response?.data || error.message);
    return NextResponse.json(
      { success: false, error: error.response?.data || error.message },
      { status: 500 }
    );
  }
}

// DELETE item
export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    const { zohoItemId } = await getZohoItemId(id);
    const accessToken = await getZohoAccessToken();

    await axios.delete(
      `https://www.zohoapis.com/books/v3/items/${zohoItemId}`,
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
        },
        params: {
          organization_id: ZOHO_ORGANIZATION_ID,
        },
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE ITEM ERROR:", error.response?.data || error.message);
    return NextResponse.json(
      { success: false, error: error.response?.data || error.message },
      { status: 500 }
    );
  }
}
