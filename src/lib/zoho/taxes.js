import { zohoFetch } from "./client";

/**
 * Get all taxes
 */
export async function getTaxes(params = {}) {
  const data = await zohoFetch("/settings/taxes", { params });
  return data.taxes || [];
}
