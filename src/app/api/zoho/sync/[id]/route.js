import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/db";
import Quotation from "@/models/Quotation";
import axios from "axios";

export async function POST(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    await dbConnect();
    const quotation = await Quotation.findById(params.id);
    if (!quotation) return NextResponse.json({ message: "Not found" }, { status: 404 });

    // Validate if it's already synced
    if (quotation.zohoQuoteId) {
      return NextResponse.json({ message: "Already synced" }, { status: 400 });
    }

    const ACCESS_TOKEN = process.env.ZOHO_ACCESS_TOKEN;
    const ORG_ID = process.env.ZOHO_ORGANIZATION_ID;

    // Prepare Zoho Payload
    const zohoPayload = {
      customer_id: "1148895000000085023", // In a real app, this should be dynamically linked or created
      date: new Date().toISOString().split("T")[0],
      notes: quotation.notes || "Synced from QuotFlow",
      line_items: quotation.items.map(item => ({
        name: item.itemName,
        rate: item.rate,
        quantity: item.quantity
      }))
    };

    const zohoRes = await axios.post(
      "https://www.zohoapis.com/books/v3/estimates",
      zohoPayload,
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${ACCESS_TOKEN}`,
          "Content-Type": "application/json"
        },
        params: {
          organization_id: ORG_ID,
        },
      }
    );

    const estimate = zohoRes.data.estimate;

    // Update the quotation in MongoDB
    quotation.zohoQuoteId = estimate.estimate_id;
    quotation.status = "Sent";
    await quotation.save();

    return NextResponse.json({ message: "Successfully synced to Zoho", estimate });
  } catch (error) {
    console.error("Zoho Sync Error:", error.response?.data || error.message);
    return NextResponse.json(
      { message: "Failed to sync with Zoho", details: error.response?.data || error.message },
      { status: 500 }
    );
  }
}
