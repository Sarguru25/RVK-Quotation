import axios from "axios";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json({
        success: false,
        message: "No code found",
      });
    }

    console.log("CODE:", code);

    const response = await axios.post(
      "https://accounts.zoho.com/oauth/v2/token",
      null,
      {
        params: {
          code,
          client_id: process.env.ZOHO_CLIENT_ID,
          client_secret: process.env.ZOHO_CLIENT_SECRET,
          redirect_uri: process.env.ZOHO_REDIRECT_URI,
          grant_type: "authorization_code",
        },
      }
    );

    console.log("TOKEN RESPONSE:", response.data);

    const refreshToken = response.data.refresh_token;

    // OPTIONAL
    // Save token locally

    if (refreshToken) {
      const envPath = path.join(process.cwd(), ".env.local");

      let envContent = fs.readFileSync(envPath, "utf8");

      if (envContent.includes("ZOHO_REFRESH_TOKEN=")) {
        envContent = envContent.replace(
          /ZOHO_REFRESH_TOKEN=.*/,
          `ZOHO_REFRESH_TOKEN=${refreshToken}`
        );
      } else {
        envContent += `\nZOHO_REFRESH_TOKEN=${refreshToken}`;
      }

      fs.writeFileSync(envPath, envContent);

      console.log("Refresh token saved to .env.local: " + refreshToken);
    }

    return NextResponse.json({
      success: true,
      data: response.data,
    });
  } catch (error) {
    console.log(error.response?.data || error.message);

    return NextResponse.json({
      success: false,
      error: error.response?.data || error.message,
    });
  }
}