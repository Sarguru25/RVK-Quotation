import { NextResponse } from "next/server";
import axios from "axios";
import { getZohoAccessToken } from "@/lib/zoho";
import dbConnect from "@/lib/db";
import Item from "@/models/Item";
import mongoose from "mongoose";

const ZOHO_ORGANIZATION_ID = process.env.ZOHO_ORGANIZATION_ID;

// Default account IDs for RVK_Quotation (Singapore Zoho Books)
const DEFAULT_SALES_ACCOUNT_ID = "2315070000000000388"; // Sales
const DEFAULT_PURCHASE_ACCOUNT_ID = "2315070000000034003"; // Direct Materials

// Reporting Tag IDs and options in Zoho Books
const JOB_NUMBER_TAG_ID = "2315070000000000333";
const MARKET_SEGMENT_TAG_ID = "2315070000000000335";

const JOB_NUMBER_OPTIONS = [
  { tag_option_id: "2315070000000236277", tag_option_name: "SGS190010" },
  { tag_option_id: "2315070000000236279", tag_option_name: "SGS190011" },
  { tag_option_id: "2315070000000236281", tag_option_name: "SGS190014" },
  { tag_option_id: "2315070000000236283", tag_option_name: "SGS190015" },
  { tag_option_id: "2315070000000230261", tag_option_name: "SGS190016" },
  { tag_option_id: "2315070000000230281", tag_option_name: "SGS190017" },
  { tag_option_id: "2315070000000230279", tag_option_name: "SGS190018" },
  { tag_option_id: "2315070000000253003", tag_option_name: "SGS190019" },
  { tag_option_id: "2315070000001611283", tag_option_name: "SGS190040" },
];

const MARKET_SEGMENT_OPTIONS = [
  { tag_option_id: "2315070000006075019", tag_option_name: "Building Services", aliases: ["building solutions", "building"] },
  { tag_option_id: "2315070000006075011", tag_option_name: "Chemical & Petrochemical", aliases: ["chemical", "petrochemical"] },
  { tag_option_id: "2315070000006075017", tag_option_name: "Energy", aliases: ["power"] },
  { tag_option_id: "2315070000006075009", tag_option_name: "General Industry", aliases: ["general"] },
  { tag_option_id: "2315070000006075013", tag_option_name: "Marine Offshore", aliases: ["marine & offshore", "marine"] },
  { tag_option_id: "2315070000006075015", tag_option_name: "Water & Waste Water", aliases: ["water & waste water treatment", "water"] },
];

function buildReportingTags(body) {
  const tags = [];
  if (Array.isArray(body.tags)) {
    tags.push(...body.tags);
  }

  if (body.job_number && !tags.some((t) => t.tag_id === JOB_NUMBER_TAG_ID)) {
    const val = String(body.job_number).trim();
    const match = JOB_NUMBER_OPTIONS.find(
      (o) => o.tag_option_id === val || o.tag_option_name.toLowerCase() === val.toLowerCase()
    );
    if (match) {
      tags.push({ tag_id: JOB_NUMBER_TAG_ID, tag_option_id: match.tag_option_id });
    }
  }

  if (body.market_segment && !tags.some((t) => t.tag_id === MARKET_SEGMENT_TAG_ID)) {
    const val = String(body.market_segment).trim().toLowerCase();
    const match = MARKET_SEGMENT_OPTIONS.find(
      (o) =>
        o.tag_option_id === body.market_segment ||
        o.tag_option_name.toLowerCase() === val ||
        o.aliases.some((a) => val.includes(a) || a.includes(val))
    );
    if (match) {
      tags.push({ tag_id: MARKET_SEGMENT_TAG_ID, tag_option_id: match.tag_option_id });
    }
  }

  return tags;
}

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
      const response = await axios.get(
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
      const zohoItem = response.data.item;
      if (localItem) {
        const localObj = localItem.toObject ? localItem.toObject() : localItem;
        const mergedRaw = { ...(localObj.rawZohoData || {}), ...zohoItem };
        if (zohoItem.available_for_sale === undefined && localObj.rawZohoData?.available_for_sale !== undefined) {
          mergedRaw.available_for_sale = localObj.rawZohoData.available_for_sale;
        }
        if (zohoItem.actual_available_stock === undefined && localObj.rawZohoData?.actual_available_stock !== undefined) {
          mergedRaw.actual_available_stock = localObj.rawZohoData.actual_available_stock;
        }
        return NextResponse.json({ ...localObj, ...zohoItem, rawZohoData: mergedRaw });
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

    // Determine sales and purchase eligibility
    const isSales =
      body.is_sales !== undefined
        ? Boolean(body.is_sales)
        : body.can_be_sold !== undefined
        ? Boolean(body.can_be_sold)
        : true;

    const isPurchase =
      body.is_purchase !== undefined
        ? Boolean(body.is_purchase)
        : body.can_be_purchased !== undefined
        ? Boolean(body.can_be_purchased)
        : Boolean(body.purchase_rate || body.purchase_account_id);

    let itemType = "sales_and_purchases";
    if (isSales && isPurchase) {
      itemType = "sales_and_purchases";
    } else if (isPurchase && !isSales) {
      itemType = "purchases";
    } else if (isSales && !isPurchase) {
      itemType = "sales";
    }

    const itemPayload = {
      name: body.name,
      rate: Number(body.rate) || 0,
      description: body.description || "",
      sku: body.sku || "",
      product_type: body.product_type || "goods",
      unit: body.unit || "",
      item_type: itemType,
      can_be_sold: isSales,
      can_be_purchased: isPurchase,
    };

    if (isPurchase) {
      itemPayload.purchase_rate = Number(body.purchase_rate) || 0;
      itemPayload.purchase_description = body.purchase_description || "";
      itemPayload.purchase_account_id =
        body.purchase_account_id || DEFAULT_PURCHASE_ACCOUNT_ID;
      if (body.purchase_tax_id) itemPayload.purchase_tax_id = body.purchase_tax_id;
      if (body.vendor_id) itemPayload.vendor_id = body.vendor_id;
    }

    if (isSales) {
      itemPayload.account_id = body.account_id || DEFAULT_SALES_ACCOUNT_ID;
      if (body.tax_id) itemPayload.tax_id = body.tax_id;
    }

    // Attach reporting tags (Job Number, Market Segment)
    const tags = buildReportingTags(body);
    if (tags.length > 0) {
      itemPayload.tags = tags;
    }

    // Filter out invalid custom_fields (e.g. Market Segment and Job Number are tags, not custom_fields)
    if (Array.isArray(body.custom_fields) && body.custom_fields.length > 0) {
      const validCustomFields = body.custom_fields.filter((cf) => {
        const label = String(cf.label || "").toLowerCase();
        return label !== "market segment" && label !== "job number";
      });
      if (validCustomFields.length > 0) {
        itemPayload.custom_fields = validCustomFields;
      }
    }

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

    const updatedItem = response.data?.item;
    if (updatedItem) {
      try {
        await dbConnect();
        await Item.findOneAndUpdate(
          { zoho_item_id: zohoItemId },
          {
            $set: {
              name: updatedItem.name,
              sku: updatedItem.sku,
              description: updatedItem.description,
              rate: updatedItem.rate,
              purchase_rate: updatedItem.purchase_rate,
              tax_id: updatedItem.tax_id,
              tax_name: updatedItem.tax_name,
              tax_percentage: updatedItem.tax_percentage,
              item_type: updatedItem.item_type,
              unit: updatedItem.unit,
              status: updatedItem.status,
              stock_on_hand: updatedItem.stock_on_hand,
              available_stock: updatedItem.available_stock,
              last_modified_time: updatedItem.last_modified_time
                ? new Date(updatedItem.last_modified_time)
                : new Date(),
              syncedAt: new Date(),
              rawZohoData: updatedItem,
            },
          }
        );
      } catch (dbErr) {
        console.warn("Failed to update local Item collection after PUT:", dbErr.message);
      }
    }

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

    try {
      await dbConnect();
      await Item.deleteOne({ zoho_item_id: zohoItemId });
    } catch (dbErr) {
      console.warn("Failed to delete local Item document:", dbErr.message);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE ITEM ERROR:", error.response?.data || error.message);
    return NextResponse.json(
      { success: false, error: error.response?.data || error.message },
      { status: 500 }
    );
  }
}
