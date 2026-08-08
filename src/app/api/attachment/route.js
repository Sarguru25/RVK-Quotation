import { NextResponse } from "next/server";
import { uploadAttachment, getAttachment, deleteAttachment, replaceAttachment, ZohoAttachmentError } from "@/lib/zoho/attachments";

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
 * Retrieves and streams the attachment directly to the client for inline viewing or downloading.
 * Params: ?module=estimates&recordId=12345&action=view|download
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const module = searchParams.get("module");
    const recordId = searchParams.get("recordId");
    const action = searchParams.get("action") || "view"; // "view" or "download"

    if (!module || !recordId) {
      return NextResponse.json({ success: false, error: "Missing module or recordId parameters." }, { status: 400 });
    }

    const zohoResponse = await getAttachment(module, recordId);

    // Get headers from Zoho response
    const contentType = zohoResponse.headers.get("content-type") || "application/octet-stream";
    const rawDisposition = zohoResponse.headers.get("content-disposition") || "";

    // Extract filename from Content-Disposition if present
    let fileName = `attachment-${recordId}`;
    const filenameMatch = rawDisposition.match(/filename="?([^"]+)"?/);
    if (filenameMatch && filenameMatch[1]) {
      fileName = filenameMatch[1];
    }

    // Determine content disposition based on action
    const dispositionType = action === "download" ? "attachment" : "inline";
    const contentDisposition = `${dispositionType}; filename="${fileName}"`;

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
 * Uploads a new attachment to a Zoho Books record using multipart/form-data.
 */
export async function POST(request) {
  try {
    const formData = await request.formData();
    const module = formData.get("module");
    const recordId = formData.get("recordId");
    const file = formData.get("file");

    if (!module || !recordId) {
      return NextResponse.json({ success: false, error: "Missing module or recordId." }, { status: 400 });
    }
    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided in form data." }, { status: 400 });
    }

    const result = await uploadAttachment(module, recordId, file);

    return NextResponse.json({
      success: true,
      message: "Attachment uploaded successfully.",
      data: result
    }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PUT /api/attachment
 * Replaces an existing attachment on a Zoho Books record with a new file using multipart/form-data.
 */
export async function PUT(request) {
  try {
    const formData = await request.formData();
    const module = formData.get("module");
    const recordId = formData.get("recordId");
    const file = formData.get("file");

    if (!module || !recordId) {
      return NextResponse.json({ success: false, error: "Missing module or recordId." }, { status: 400 });
    }
    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided in form data." }, { status: 400 });
    }

    const result = await replaceAttachment(module, recordId, file);

    return NextResponse.json({
      success: true,
      message: "Attachment replaced successfully.",
      data: result
    }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/attachment
 * Deletes an attachment from a Zoho Books record.
 * Supports URL search params (?module=...&recordId=...) or JSON body.
 */
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    let module = searchParams.get("module");
    let recordId = searchParams.get("recordId");

    if (!module || !recordId) {
      try {
        const body = await request.json();
        module = body.module || module;
        recordId = body.recordId || recordId;
      } catch {
        // Fallback to initial values if JSON parse fails
      }
    }

    if (!module || !recordId) {
      return NextResponse.json({ success: false, error: "Missing module or recordId." }, { status: 400 });
    }

    const result = await deleteAttachment(module, recordId);

    return NextResponse.json({
      success: true,
      message: "Attachment deleted successfully.",
      data: result
    }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
