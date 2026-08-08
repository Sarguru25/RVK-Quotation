export const ZOHO_BASE_URL = "https://www.zohoapis.com/books/v3";
export const ZOHO_AUTH_URL = "https://accounts.zoho.com/oauth/v2/token";

export const ZOHO_CONFIG = {
  get organizationId() {
    return process.env.ZOHO_ORGANIZATION_ID;
  },
  get clientId() {
    return process.env.ZOHO_CLIENT_ID;
  },
  get clientSecret() {
    return process.env.ZOHO_CLIENT_SECRET;
  },
  get refreshToken() {
    return process.env.ZOHO_REFRESH_TOKEN;
  }
};
