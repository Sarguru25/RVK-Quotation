import { NextResponse } from "next/server";
import axios from "axios";
import { getZohoAccessToken } from "@/lib/zoho";
import dbConnect from "@/lib/db";
import Item from "@/models/Item";

const ZOHO_ORGANIZATION_ID = process.env.ZOHO_ORGANIZATION_ID;
const DEFAULT_SALES_ACCOUNT_ID = "2315070000000000388";
const DEFAULT_PURCHASE_ACCOUNT_ID = "2315070000000034003";

export async function POST(req) {
  try {
    await dbConnect();
    const accessToken = await getZohoAccessToken();
    const body = await req.json().catch(() => ({}));

    let filter = {
      $or: [
        { "rawZohoData.can_be_purchased": false },
        { "rawZohoData.item_type": "sales" },
        { can_be_purchased: false },
        { item_type: "sales" },
      ],
    };

    if (body.itemId) {
      filter = {
        $or: [{ zoho_item_id: body.itemId }, { _id: body.itemId }],
      };
    }

    const itemsToRecover = await Item.find(filter);

    const results = [];
    for (const item of itemsToRecover) {
      const zohoId = item.zoho_item_id;
      if (!zohoId) continue;

      try {
        const payload = {
          name: item.name,
          rate: Number(item.rate) || 0,
          description: item.description || "",
          sku: item.sku || "",
          product_type: item.rawZohoData?.product_type || "goods",
          unit: item.unit || "",
          item_type: "sales_and_purchases",
          can_be_sold: true,
          can_be_purchased: true,
          purchase_rate: Number(item.purchase_rate) || 0,
          purchase_description:
            item.rawZohoData?.purchase_description || item.description || "",
          purchase_account_id:
            item.rawZohoData?.purchase_account_id || DEFAULT_PURCHASE_ACCOUNT_ID,
          account_id:
            item.rawZohoData?.account_id || DEFAULT_SALES_ACCOUNT_ID,
        };

        const zohoRes = await axios.put(
          `https://www.zohoapis.com/books/v3/items/${zohoId}`,
          payload,
          {
            headers: {
              Authorization: `Zoho-oauthtoken ${accessToken}`,
            },
            params: {
              organization_id: ZOHO_ORGANIZATION_ID,
            },
          }
        );

        const updated = zohoRes.data?.item;
        if (updated) {
          await Item.updateOne(
            { zoho_item_id: zohoId },
            {
              $set: {
                item_type: updated.item_type,
                purchase_rate: updated.purchase_rate,
                syncedAt: new Date(),
                rawZohoData: updated,
              },
            }
          );
        }

        results.push({
          id: zohoId,
          name: item.name,
          status: "success",
          can_be_purchased: updated?.can_be_purchased,
          item_type: updated?.item_type,
        });
      } catch (itemErr) {
        results.push({
          id: zohoId,
          name: item.name,
          status: "error",
          error: itemErr.response?.data?.message || itemErr.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      recoveredCount: results.filter((r) => r.status === "success").length,
      totalChecked: itemsToRecover.length,
      results,
    });
  } catch (error) {
    console.error("[RECOVER ITEMS ERROR]:", error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
