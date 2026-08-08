// let cachedAccessToken = null;
// let tokenExpiry = 0;

// async function refreshAccessToken() {
//   const response = await fetch("https://accounts.zoho.com/oauth/v2/token", {
//     method: "POST",
//     headers: { "Content-Type": "application/x-www-form-urlencoded" },
//     body: new URLSearchParams({
//       refresh_token: process.env.ZOHO_REFRESH_TOKEN,
//       client_id: process.env.ZOHO_CLIENT_ID,
//       client_secret: process.env.ZOHO_CLIENT_SECRET,
//       grant_type: "refresh_token",
//     }),
//   });

//   if (!response.ok) {
//     throw new Error("Failed to refresh Zoho token");
//   }

//   const data = await response.json();
//   cachedAccessToken = data.access_token;
//   tokenExpiry = Date.now() + data.expires_in * 1000;
//   return cachedAccessToken;
// }

// async function getAccessToken() {
//   if (cachedAccessToken && Date.now() < tokenExpiry - 60000) {
//     return cachedAccessToken;
//   }
//   return await refreshAccessToken();
// }

// // Find or create a Zoho customer by name
// async function getOrCreateCustomer(customerName, accessToken, orgId) {
//   // Search for customer by name
//   const searchUrl = `https://www.zohoapis.com/books/v3/contacts?organization_id=${orgId}&contact_name=${encodeURIComponent(customerName)}`;
//   const searchRes = await fetch(searchUrl, {
//     headers: { Authorization: `Zoho-oauthtoken ${accessToken}` },
//   });
//   const searchData = await searchRes.json();
//   if (searchData.contacts && searchData.contacts.length > 0) {
//     return searchData.contacts[0].contact_id;
//   }

//   // Create new customer
//   const createUrl = `https://www.zohoapis.com/books/v3/contacts?organization_id=${orgId}`;
//   const createRes = await fetch(createUrl, {
//     method: "POST",
//     headers: {
//       Authorization: `Zoho-oauthtoken ${accessToken}`,
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify({
//       contact_name: customerName,
//     }),
//   });
//   const createData = await createRes.json();
//   if (!createRes.ok || !createData.contact) {
//     throw new Error(`Failed to create customer: ${JSON.stringify(createData)}`);
//   }
//   return createData.contact.contact_id;
// }

// export async function createZohoQuote(quotation) {
//   const accessToken = await getAccessToken();
//   const orgId = process.env.ZOHO_ORGANIZATION_ID;

//   // 1. get customer id
//   const customerId = await getOrCreateCustomer(
//     quotation.customerName,
//     accessToken,
//     orgId
//   );

//   // 2. Create quote
//   const url = `https://www.zohoapis.com/books/v3/estimates?organization_id=${orgId}`;
//   const line_items = quotation.items.map((item) => ({
//     name: item.name,
//     quantity: item.quantity,
//     rate: item.rate,
//     item_total: item.total,
//   }));

//   const body = {
//     customer_id: customerId,
//     line_items: line_items,
//     notes: quotation.notes || "",
//     reference_number: quotation._id?.toString() || "", // optional
//     date: new Date().toISOString().split("T")[0],
//     exchange_rate: 1,
//     is_inclusive_tax: false,
//     estimate_number: `QUOTE-${Date.now()}`, // unique
//   };

//   const response = await fetch(url, {
//     method: "POST",
//     headers: {
//       Authorization: `Zoho-oauthtoken ${accessToken}`,
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify(body),
//   });

//   if (!response.ok) {
//     const err = await response.text();
//     throw new Error(`Zoho API error: ${err}`);
//   }

//   const data = await response.json();
//   return data.estimate.estimate_id;
// }



// export async function getZohoAccessToken() {
//   const res = await fetch("https://accounts.zoho.in/oauth/v2/token", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/x-www-form-urlencoded",
//     },
//     body: new URLSearchParams({
//       refresh_token: process.env.ZOHO_REFRESH_TOKEN,
//       client_id: process.env.ZOHO_CLIENT_ID,
//       client_secret: process.env.ZOHO_CLIENT_SECRET,
//       grant_type: "refresh_token",
//     }),
//   });

//   const data = await res.json();

//   if (!data.access_token) {
//     console.error(data);
//     throw new Error("Zoho token failed");
//   }

//   return data.access_token;
// }

export { getZohoAccessToken } from "./zoho/auth";