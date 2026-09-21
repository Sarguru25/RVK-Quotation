import { NextResponse } from "next/server";
import {
  uploadAttachment,
  uploadMultipleAttachments,
  listAttachments,
  getAttachment,
  deleteAttachment,
  replaceAttachment,
  ZohoAttachmentError
} from "@/lib/zoho/attachments";

/**
 * Helper to handle errors uniformly in the API route
 */
function handleApiError(error) {
  console.error("[ATTACHMENT API ERROR]", error);
  const status = error instanceof ZohoAttachmentError ? (error.status || 400) : 500;
  return NextResponse.json(
    { success: false, error: error.message || "Internal Server Error" },
    { status }
  );
}

/**
 * GET /api/attachment
 * - action=list: Returns list of attached documents for the record [{ document_id, file_name, file_size, ... }]
 * - action=view|download: Retrieves and streams a specific document (or default attachment) directly.
 * Params: ?module=estimates&recordId=12345&action=list|view|download&documentId=67890
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const moduleName = searchParams.get("module");
    const recordId = searchParams.get("recordId");
    const action = searchParams.get("action") || "list"; // "list" | "view" | "download"
    const documentId = searchParams.get("documentId");

    if (!moduleName || !recordId) {
      return NextResponse.json({ success: false, error: "Missing module or recordId parameters." }, { status: 400 });
    }

    // 1. List all documents
    if (action === "list") {
      const documents = await listAttachments(moduleName, recordId);
      return NextResponse.json({
        success: true,
        documents
      }, { status: 200 });
    }

    // 2. View or Download a specific document
    const zohoResponse = await getAttachment(moduleName, recordId, documentId);

    // Get headers from Zoho response
    const contentType = zohoResponse.headers.get("content-type") || "application/octet-stream";
    const rawDisposition = zohoResponse.headers.get("content-disposition") || "";

    // Extract filename from Content-Disposition if present
    let fileName = `attachment-${documentId || recordId}`;
    const filenameMatch = rawDisposition.match(/filename="?([^"]+)"?/);
    if (filenameMatch && filenameMatch[1]) {
      fileName = decodeURIComponent(filenameMatch[1]);
    }

    // Determine content disposition based on action
    const dispositionType = action === "download" ? "attachment" : "inline";
    const contentDisposition = `${dispositionType}; filename="${encodeURIComponent(fileName)}"`;

    // Stream directly back to browser without third-party storage or CDN
    return new NextResponse(zohoResponse.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": contentDisposition,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/attachment
 * Uploads one or multiple attachments to a Zoho Books record using multipart/form-data.
 * Accepts "files" (multiple) or "file" (single or repeated).
 */
export async function POST(request) {
  try {
    const formData = await request.formData();
    const moduleName = formData.get("module");
    const recordId = formData.get("recordId");

    if (!moduleName || !recordId) {
      return NextResponse.json({ success: false, error: "Missing module or recordId." }, { status: 400 });
    }

    // Collect all files from FormData
    const filesToUpload = [];
    const filesArray = formData.getAll("files");
    const fileSingleArray = formData.getAll("file");

    for (const f of [...filesArray, ...fileSingleArray]) {
      if (f && typeof f === "object" && f.name) {
        filesToUpload.push(f);
      }
    }

    if (filesToUpload.length === 0) {
      return NextResponse.json({ success: false, error: "No files provided in form data." }, { status: 400 });
    }

    // Upload each file
    for (const file of filesToUpload) {
      await uploadAttachment(moduleName, recordId, file);
    }

    // Fetch updated document list
    const updatedDocs = await listAttachments(moduleName, recordId);

    return NextResponse.json({
      success: true,
      message: `${filesToUpload.length} file${filesToUpload.length > 1 ? "s" : ""} uploaded successfully.`,
      documents: updatedDocs
    }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PUT /api/attachment
 * Replaces a specific attachment on a Zoho Books record with a new file using multipart/form-data.
 * Accepts: module, recordId, documentId, file
 */
export async function PUT(request) {
  try {
    const formData = await request.formData();
    const moduleName = formData.get("module");
    const recordId = formData.get("recordId");
    const documentId = formData.get("documentId");
    const file = formData.get("file");

    if (!moduleName || !recordId) {
      return NextResponse.json({ success: false, error: "Missing module or recordId." }, { status: 400 });
    }
    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided in form data." }, { status: 400 });
    }

    await replaceAttachment(moduleName, recordId, documentId, file);

    // Fetch updated document list
    const updatedDocs = await listAttachments(moduleName, recordId);

    return NextResponse.json({
      success: true,
      message: "Document replaced successfully.",
      documents: updatedDocs
    }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/attachment
 * Deletes a specific attachment (via documentId) from a Zoho Books record.
 * Supports URL search params (?module=...&recordId=...&documentId=...) or JSON body.
 */
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    let moduleName = searchParams.get("module");
    let recordId = searchParams.get("recordId");
    let documentId = searchParams.get("documentId");

    if (!moduleName || !recordId) {
      try {
        const body = await request.json();
        moduleName = body.module || moduleName;
        recordId = body.recordId || recordId;
        documentId = body.documentId || documentId;
      } catch {
        // Fallback to initial values if JSON parse fails
      }
    }

    if (!moduleName || !recordId) {
      return NextResponse.json({ success: false, error: "Missing module or recordId." }, { status: 400 });
    }

    await deleteAttachment(moduleName, recordId, documentId);

    // Fetch updated document list
    const updatedDocs = await listAttachments(moduleName, recordId);

    return NextResponse.json({
      success: true,
      message: "Document deleted successfully.",
      documents: updatedDocs
    }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
