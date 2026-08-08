import { getZohoAccessToken } from "@/lib/zoho";
import dbConnect from "@/lib/db";
import Quotation from "@/models/Quotation";
import axios from "axios";

const ZOHO_ORGANIZATION_ID = process.env.ZOHO_ORGANIZATION_ID;

export async function GET() {
  try {
    await dbConnect();

    const accessToken = await getZohoAccessToken();

    const response = await axios.get(
      "https://www.zohoapis.com/books/v3/estimates",
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
        },
        params: {
          organization_id: ZOHO_ORGANIZATION_ID,
        },
      }
    );

    const quotes = response.data.estimates || [];

    for (const q of quotes) {
      await Quotation.updateOne(
        { zohoId: q.estimate_id },
        {
          zohoId: q.estimate_id,
          customerName: q.customer_name,
          status: q.status,
          totalAmount: q.total,
          lastSyncedAt: new Date(),
        },
        { upsert: true }
      );
    }

    return Response.json({
      success: true,
      count: quotes.length,
    });
  } catch (error) {
    console.error("Sync Error:", error);
    return Response.json({ error: "Sync failed" }, { status: 500 });
  }
}