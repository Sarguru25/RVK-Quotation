import { NextResponse } from "next/server";

export async function GET() {
  const zohoURL =
    `https://accounts.zoho.com/oauth/v2/auth` +
    `?response_type=code` +
    `&client_id=${process.env.ZOHO_CLIENT_ID}` +
    `&scope=ZohoBooks.fullaccess.all` +
    `&redirect_uri=${process.env.ZOHO_REDIRECT_URI}` +
    `&access_type=offline` +
    `&prompt=consent`;

  return NextResponse.redirect(zohoURL);
}