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
 * List all attachments/documents associated with a Zoho Books record.
 * @param {string} module - "estimates" | "salesorders" | "invoices"
 * @param {string} recordId - Unique ID or transaction number of the record
 * @returns {Promise<Array<object>>} List of document objects
 */
export async function listAttachments(module, recordId) {
  validateModule(module);
  if (!recordId) throw new Error("Record ID is required.");

  const realRecordId = await resolveRecordId(module, recordId);

  const urlParams = new URLSearchParams({
    organization_id: ZOHO_CONFIG.organizationId
  });

  const url = `${ZOHO_BASE_URL}/${module}/${realRecordId}?${urlParams.toString()}`;
  const response = await executeAttachmentFetch(url, { method: "GET" });

  if (!response.ok) {
    let errorMsg = `Failed to list attachments for ${module}/${recordId}`;
    try {
      const data = await response.json();
      errorMsg = data.message || errorMsg;
    } catch {
      // Keep default
    }
    throw new ZohoAttachmentError(errorMsg, response.status);
  }

  const data = await response.json();
  const singularKey = module.endsWith("s") ? module.slice(0, -1) : module;
  const record = data[singularKey] || data[module] || data;
  const docs = record.documents || [];

  return docs.map(doc => ({
    document_id: String(doc.document_id || ""),
    file_name: doc.file_name || "attachment",
    file_size: Number(doc.file_size || 0),
    file_size_formatted: doc.file_size_formatted || (doc.file_size ? `${(doc.file_size / (1024 * 1024)).toFixed(2)} MB` : "-"),
    file_type: doc.file_type || (doc.file_name ? doc.file_name.split(".").pop().toLowerCase() : ""),
    uploaded_on: doc.uploaded_on || doc.uploaded_on_date_formatted || "",
    uploaded_by: doc.uploaded_by || "",
    can_send_in_mail: Boolean(doc.can_send_in_mail)
  }));
}

/**
 * Upload an attachment to a Zoho Books record (Estimate, Sales Order, Invoice).
 * Appends the file to the record's documents list.
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

  // Sanitize filename to alphanumeric, dots, hyphens, and underscores.
  // Zoho Books rejects filenames containing spaces, parentheses, or special characters.
  const rawName = file.name || "attachment.pdf";
  const safeName = rawName.replace(/[^a-zA-Z0-9._-]/g, "_");

  // Read buffer from incoming File/Blob stream to ensure valid in-memory payload for fetch
  let uploadBlob = file;
  if (typeof file.arrayBuffer === "function") {
    const arrayBuffer = await file.arrayBuffer();
    uploadBlob = new Blob([arrayBuffer]);
  }

  const formData = new FormData();
  formData.append("attachment", uploadBlob, safeName);

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
 * Upload multiple attachments sequentially to a Zoho Books record.
 * @param {string} module - "estimates" | "salesorders" | "invoices"
 * @param {string} recordId - Unique ID or transaction number of the record
 * @param {Array<Blob | File>} files - Array of files to upload
 * @returns {Promise<Array<object>>} Upload results
 */
export async function uploadMultipleAttachments(module, recordId, files) {
  validateModule(module);
  if (!recordId) throw new Error("Record ID is required.");
  if (!files || !files.length) throw new Error("At least one file is required.");

  const realRecordId = await resolveRecordId(module, recordId);
  const results = [];

  for (const file of files) {
    const res = await uploadAttachment(module, realRecordId, file);
    results.push(res);
  }

  return results;
}

/**
 * Retrieve an attachment from a Zoho Books record as a raw response stream.
 * If documentId is provided, retrieves that specific document.
 * Otherwise retrieves the primary/default attachment stream.
 * @param {string} module - "estimates" | "salesorders" | "invoices"
 * @param {string} recordId - Unique ID or transaction number of the record
 * @param {string|null} documentId - Optional document ID to target a specific file
 * @returns {Promise<Response>} Raw Fetch Response containing stream and headers
 */
export async function getAttachment(module, recordId, documentId = null) {
  validateModule(module);
  if (!recordId) throw new Error("Record ID is required.");

  const realRecordId = await resolveRecordId(module, recordId);

  const urlParams = new URLSearchParams({
    organization_id: ZOHO_CONFIG.organizationId
  });

  let url;
  if (documentId) {
    url = `${ZOHO_BASE_URL}/${module}/${realRecordId}/documents/${documentId}?${urlParams.toString()}`;
  } else {
    url = `${ZOHO_BASE_URL}/${module}/${realRecordId}/attachment?${urlParams.toString()}`;
  }

  const response = await executeAttachmentFetch(url, {
    method: "GET",
  });

  if (!response.ok) {
    let errorMsg = `Failed to retrieve attachment for ${module}/${recordId}${documentId ? ` (doc: ${documentId})` : ""}`;
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
 * If documentId is provided, deletes only that specific document.
 * Otherwise deletes using the singular /attachment endpoint.
 * @param {string} module - "estimates" | "salesorders" | "invoices"
 * @param {string} recordId - Unique ID or transaction number of the record
 * @param {string|null} documentId - Optional document ID to target a specific file
 * @returns {Promise<object>} JSON response from Zoho Books API
 */
export async function deleteAttachment(module, recordId, documentId = null) {
  validateModule(module);
  if (!recordId) throw new Error("Record ID is required.");

  const realRecordId = await resolveRecordId(module, recordId);

  const urlParams = new URLSearchParams({
    organization_id: ZOHO_CONFIG.organizationId
  });

  let url;
  if (documentId) {
    url = `${ZOHO_BASE_URL}/${module}/${realRecordId}/documents/${documentId}?${urlParams.toString()}`;
  } else {
    url = `${ZOHO_BASE_URL}/${module}/${realRecordId}/attachment?${urlParams.toString()}`;
  }

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
 * Replace/Update a specific document or default attachment on a Zoho Books record.
 * Deletes the specified document (if documentId provided) and uploads the new file.
 * @param {string} module - "estimates" | "salesorders" | "invoices"
 * @param {string} recordId - Unique ID or transaction number of the record
 * @param {string|null} documentId - Specific document ID to replace
 * @param {Blob | File} file - The new file object to upload
 * @returns {Promise<object>} JSON response from Zoho Books API
 */
export async function replaceAttachment(module, recordId, documentId, file) {
  validateModule(module);
  if (!recordId) throw new Error("Record ID is required.");
  if (!file) throw new Error("File is required for replace operation.");

  const realRecordId = await resolveRecordId(module, recordId);

  // Attempt to delete specific or existing attachment first
  try {
    await deleteAttachment(module, realRecordId, documentId);
    console.log(`[ZOHO ATTACHMENTS] Successfully removed previous document (${documentId || "default"}) for ${module}/${realRecordId}`);
  } catch (error) {
    console.warn(`[ZOHO ATTACHMENTS] Pre-replace delete step warning:`, error.message);
  }

  // Upload the new attachment
  return await uploadAttachment(module, realRecordId, file);
}
