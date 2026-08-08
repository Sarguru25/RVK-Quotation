import { ZOHO_AUTH_URL, ZOHO_CONFIG } from "./config";

let cachedToken = null;
let tokenExpiry = null;

/**
 * Custom Error class for Zoho Auth failures
 */
export class ZohoAuthError extends Error {
  constructor(message, details = null) {
    super(message);
    this.name = "ZohoAuthError";
    this.details = details;
  }
}

/**
 * Gets a valid Zoho Access Token.
 * Utilizes in-memory caching to prevent redundant API calls.
 */
export async function getZohoAccessToken(forceRefresh = false) {
  // Use cached token if valid and not explicitly refreshing
  if (!forceRefresh && cachedToken && tokenExpiry && tokenExpiry > Date.now() + 60000) {
    return cachedToken;
  }

  try {
    const params = new URLSearchParams({
      refresh_token: ZOHO_CONFIG.refreshToken,
      client_id: ZOHO_CONFIG.clientId,
      client_secret: ZOHO_CONFIG.clientSecret,
      grant_type: "refresh_token",
    });

    let response;
    let lastError;
    
    // Try up to 3 times
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        response = await fetch(ZOHO_AUTH_URL, {
          method: "POST",
          cache: "no-store",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: params,
          signal: AbortSignal.timeout(30000) // Increase timeout to 30s
        });
        
        // If we got a response, break out of retry loop
        break;
      } catch (err) {
        lastError = err;
        console.warn(`[ZOHO AUTH] Attempt ${attempt} failed: ${err.message}`);
        if (attempt < 3) {
          // Wait 1 second before retrying
          await new Promise(res => setTimeout(res, 1000));
        }
      }
    }

    if (!response) {
      throw lastError || new Error("Failed to connect to Zoho Auth after 3 attempts");
    }

    const data = await response.json();

    if (!response.ok || data.error) {
      throw new ZohoAuthError(`Token request failed: ${data.error || response.statusText}`, data);
    }

    cachedToken = data.access_token;
    // expires_in is in seconds. Add it to Date.now()
    tokenExpiry = Date.now() + data.expires_in * 1000;

    console.log("[ZOHO AUTH] New access token generated successfully.");

    return cachedToken;
  } catch (error) {
    console.error("[ZOHO AUTH ERROR]", error);
    throw new ZohoAuthError("Failed to authenticate with Zoho", error.message);
  }
}
