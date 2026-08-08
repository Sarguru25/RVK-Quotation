import { ZOHO_BASE_URL, ZOHO_CONFIG } from "./config";
import { getZohoAccessToken } from "./auth";
import dbConnect from "@/lib/db";
import Quotation from "@/models/Quotation";

/**
 * Validates if the module is one of the supported Zoho Books modules for attachments.
 * @param {string} module 
 */
function validateModule(module) {
  const supportedModules = ["estimates"];
  if (!supportedModules.includes(module)) {
    throw new Error(`Unsupported module '${module}'. Supported modules are: ${supportedModules.join(", ")}`);
  }
}

/**
 * Custom Error class for Zoho Attachment operations
 */
export class ZohoAttachmentError extends Error {
  constructor(message, status, details = null) {
    super(message);
    this.name = "ZohoAttachmentError";
    this.status = status;
    this.details = details;
  }
}

/**
 * Helper to execute fetch against Zoho Books API with token retry logic.
 * @param {string} url 
 * @param {RequestInit} options 
 */
async function executeAttachmentFetch(url, options = {}) {
  let accessToken = await getZohoAccessToken();

  // Set up headers with current access token
  const headers = new Headers(options.headers || {});
  headers.set("Authorization", `Zoho-oauthtoken ${accessToken}`);

  // Clean options for fetch
  const fetchOptions = { ...options, headers };

  let response = await fetch(url, fetchOptions);

  // If token is expired (401), force refresh and retry exactly once
  if (response.status === 401) {
    console.log("[ZOHO ATTACHMENTS] Token expired. Retrying with force refreshed token...");
    accessToken = await getZohoAccessToken(true);
    headers.set("Authorization", `Zoho-oauthtoken ${accessToken}`);
    fetchOptions.headers = headers;
    response = await fetch(url, fetchOptions);
  }

  return response;
}

/**
 * Resolves a given record ID (which could be a MongoDB _id, transaction number like ZIS26270061, or Zoho ID)
 * to the actual 18-digit Zoho Books record ID using local MongoDB first, then fallback to live Zoho API search.
 */
async function resolveRecordId(module, recordId) {
  if (!recordId) throw new Error("Record ID is required.");

  await dbConnect();

  // 1. Check if it's already a purely numeric Zoho ID (e.g. 408794000000123456)
  if (/^\d{15,20}$/.test(recordId)) {
    return recordId;
  }

  const isObjectId = /^[0-9a-fA-F]{24}$/.test(recordId);

  // 2. Query local MongoDB cache
  if (module === "estimates") {
    const query = isObjectId ? { _id: recordId } : { $or: [{ zoho_estimate_id: recordId }, { estimate_number: recordId }] };
    const doc = await Quotation.findOne(query).lean();
    if (doc && doc.zoho_estimate_id) return doc.zoho_estimate_id;
  }

  // 3. Fallback to live Zoho Books API search if not found in local MongoDB cache
  if (!isObjectId) {
    try {
      const numberParam = "estimate_number";

      const urlParams = new URLSearchParams({
        organization_id: ZOHO_CONFIG.organizationId,
        [numberParam]: recordId
      });

      const searchUrl = `${ZOHO_BASE_URL}/${module}?${urlParams.toString()}`;
      const res = await executeAttachmentFetch(searchUrl, { method: "GET" });

      if (res.ok) {
        const data = await res.json();
        const list = data[module] || [];
        if (list.length > 0) {
          const idField = "estimate_id";
          if (list[0][idField]) {
            console.log(`[ZOHO ATTACHMENTS] Resolved ${recordId} via live Zoho API to ${list[0][idField]}`);
            return list[0][idField];
          }
        }
      }
    } catch (err) {
      console.warn(`[ZOHO ATTACHMENTS] Live resolution failed for ${recordId}:`, err.message);
    }
  }

  // Fallback to returning the recordId as-is if all resolutions fail
  return recordId;
}

/**
 * Upload an attachment to a Zoho Books record (Estimate, Sales Order, Invoice)
 * @param {string} module - "estimates" | "salesorders" | "invoices"
 * @param {string} recordId - Unique ID or transaction number of the record
 * @param {Blob | File} file - The file object to upload
 * @returns {Promise<object>} JSON response from Zoho Books API
 */
export async function uploadAttachment(module, recordId, file) {
  validateModule(module);
  if (!recordId) throw new Error("Record ID is required.");
  if (!file) throw new Error("File is required for upload.");

  const realRecordId = await resolveRecordId(module, recordId);

  const urlParams = new URLSearchParams({
    organization_id: ZOHO_CONFIG.organizationId
  });

  const url = `${ZOHO_BASE_URL}/${module}/${realRecordId}/attachment?${urlParams.toString()}`;

  const formData = new FormData();
  formData.append("attachment", file);

  const response = await executeAttachmentFetch(url, {
    method: "POST",
    body: formData,
  });

  const data = await response.json();

  if (!response.ok || data.code !== 0) {
    throw new ZohoAttachmentError(
      data.message || "Failed to upload attachment to Zoho Books",
      response.status,
      data
    );
  }

  return data;
}

/**
 * Retrieve an attachment from a Zoho Books record as a raw response stream.
 * @param {string} module - "estimates" | "salesorders" | "invoices"
 * @param {string} recordId - Unique ID or transaction number of the record
 * @returns {Promise<Response>} Raw Fetch Response containing stream and headers
 */
export async function getAttachment(module, recordId) {
  validateModule(module);
  if (!recordId) throw new Error("Record ID is required.");

  const realRecordId = await resolveRecordId(module, recordId);

  const urlParams = new URLSearchParams({
    organization_id: ZOHO_CONFIG.organizationId
  });

  const url = `${ZOHO_BASE_URL}/${module}/${realRecordId}/attachment?${urlParams.toString()}`;

  const response = await executeAttachmentFetch(url, {
    method: "GET",
  });

  if (!response.ok) {
    let errorMsg = `Failed to retrieve attachment for ${module}/${recordId}`;
    try {
      const data = await response.json();
      errorMsg = data.message || errorMsg;
    } catch {
      // Keep default error message if response is not JSON
    }
    throw new ZohoAttachmentError(errorMsg, response.status);
  }

  return response;
}

/**
 * Delete an attachment from a Zoho Books record.
 * @param {string} module - "estimates" | "salesorders" | "invoices"
 * @param {string} recordId - Unique ID or transaction number of the record
 * @returns {Promise<object>} JSON response from Zoho Books API
 */
export async function deleteAttachment(module, recordId) {
  validateModule(module);
  if (!recordId) throw new Error("Record ID is required.");

  const realRecordId = await resolveRecordId(module, recordId);

  const urlParams = new URLSearchParams({
    organization_id: ZOHO_CONFIG.organizationId
  });

  const url = `${ZOHO_BASE_URL}/${module}/${realRecordId}/attachment?${urlParams.toString()}`;

  const response = await executeAttachmentFetch(url, {
    method: "DELETE",
  });

  const data = await response.json();

  if (!response.ok || data.code !== 0) {
    throw new ZohoAttachmentError(
      data.message || "Failed to delete attachment from Zoho Books",
      response.status,
      data
    );
  }

  return data;
}

/**
 * Replace/Update an attachment on a Zoho Books record.
 * Automatically deletes the existing attachment first (if any) and uploads the new one.
 * @param {string} module - "estimates" | "salesorders" | "invoices"
 * @param {string} recordId - Unique ID or transaction number of the record
 * @param {Blob | File} file - The new file object to upload
 * @returns {Promise<object>} JSON response from Zoho Books API
 */
export async function replaceAttachment(module, recordId, file) {
  validateModule(module);
  if (!recordId) throw new Error("Record ID is required.");
  if (!file) throw new Error("File is required for replace operation.");

  const realRecordId = await resolveRecordId(module, recordId);

  // Attempt to delete existing attachment first
  try {
    await deleteAttachment(module, realRecordId);
    console.log(`[ZOHO ATTACHMENTS] Successfully removed previous attachment for ${module}/${realRecordId}`);
  } catch (error) {
    console.warn(`[ZOHO ATTACHMENTS] Pre-replace delete step warning (likely no existing attachment):`, error.message);
  }

  // Upload the new attachment
  return await uploadAttachment(module, realRecordId, file);
}
