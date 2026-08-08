import { getZohoAccessToken } from "@/lib/zoho";
import dbConnect from "@/lib/db";
import Customer from "@/models/Customer";
import CustomerView from "./CustomerView";

async function getCustomer(id) {
  try {
    await dbConnect();
    const dbCustomer = await Customer.findOne({
      $or: [
        { zoho_customer_id: id },
        ...(id.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: id }] : [])
      ]
    }).lean();

    if (!dbCustomer) {
      throw new Error("Customer not found in database");
    }

    // Always prefer rawZohoData to maintain compatibility with existing Zoho-based frontend components,
    // but merge with the main document so we have the MongoDB _id and other local fields
    const merged = {
      ...(dbCustomer.rawZohoData || {}),
      ...dbCustomer,
    };
    
    // Serialize to remove ObjectIds and Dates for Next.js Client Components
    return JSON.parse(JSON.stringify(merged));
  } catch (error) {
    console.error("Customer Fetch Error:", error);
    throw new Error("Failed to fetch customer");
  }
}

export default async function CustomerDetailsPage({ params }) {
  const { id } = await params;
  const customer = await getCustomer(id);

  return <CustomerView customer={customer} customerId={id} />;
}