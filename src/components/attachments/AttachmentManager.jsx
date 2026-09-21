"use client";

import { useState, useEffect } from "react";
import {
  Paperclip,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Plus,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  FolderOpen
} from "lucide-react";
import AttachmentUpload from "./AttachmentUpload";
import AttachmentPreview from "./AttachmentPreview";
import AttachmentActions from "./AttachmentActions";

function getFileIcon(type) {
  const t = (type || "").toLowerCase();
  if (t === "xlsx" || t === "xls" || t === "csv") {
    return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
  }
  if (["png", "jpg", "jpeg", "webp", "svg"].includes(t)) {
    return <ImageIcon className="w-5 h-5 text-purple-600" />;
  }
  return <FileText className="w-5 h-5 text-indigo-600" />;
}

export default function AttachmentManager({
  module,
  recordId,
  title = "Record Attachments",
  subtext = "Manage documentation attached directly to this Zoho Books record.",
  className = ""
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [loadingDocId, setLoadingDocId] = useState(null);
  const [activePreviewDoc, setActivePreviewDoc] = useState(null);
  const [showUploadArea, setShowUploadArea] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  function showMessage(msg, isError = false) {
    if (isError) {
      setError(msg);
      setSuccess(null);
    } else {
      setSuccess(msg);
      setError(null);
      setTimeout(() => setSuccess(null), 5000);
    }
  }

  // Fetch attachments after user clicks "Load Attachments"
  useEffect(() => {
    if (!isLoaded || !module || !recordId) return;
    let isCancelled = false;

    async function loadAttachments() {
      try {
        const res = await fetch(`/api/attachment?module=${module}&recordId=${recordId}&action=list`);
        const data = await res.json();

        if (isCancelled) return;

        if (!res.ok || !data.success) {
          throw new Error(data.error || "Failed to load attachments from Zoho Books.");
        }

        const docs = data.documents || [];
        setDocuments(docs);
        setActivePreviewDoc(prev => (prev ? docs.find(d => d.document_id === prev.document_id) || null : null));
      } catch (err) {
        if (!isCancelled) {
          console.error("Error fetching documents:", err);
          showMessage(err.message || "Failed to load attachments.", true);
        }
      } finally {
        if (!isCancelled) {
          setInitialLoading(false);
        }
      }
    }

    loadAttachments();

    return () => {
      isCancelled = true;
    };
  }, [isLoaded, module, recordId]);

  // Upload one or multiple files
  async function handleUpload(files) {
    if (!files || files.length === 0) return;
    try {
      setActionLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append("module", module);
      formData.append("recordId", recordId);

      for (const file of files) {
        formData.append("files", file);
      }

      const res = await fetch("/api/attachment", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to upload files.");
      }

      const updatedDocs = data.documents || [];
      setDocuments(updatedDocs);
      setShowUploadArea(false);
      setRefreshKey(prev => prev + 1);
      showMessage(`${files.length} document${files.length > 1 ? "s" : ""} uploaded successfully to Zoho Books!`);
    } catch (err) {
      showMessage(err.message || "Failed to upload files.", true);
    } finally {
      setActionLoading(false);
    }
  }

  // Replace a specific document
  async function handleReplace(file, documentId) {
    try {
      setLoadingDocId(documentId);
      setActionLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append("module", module);
      formData.append("recordId", recordId);
      formData.append("documentId", documentId);
      formData.append("file", file);

      const res = await fetch("/api/attachment", {
        method: "PUT",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to replace document.");
      }

      const updatedDocs = data.documents || [];
      setDocuments(updatedDocs);
      setRefreshKey(prev => prev + 1);

      if (activePreviewDoc?.document_id === documentId) {
        const replaced = updatedDocs.find(d => d.file_name === file.name) || updatedDocs[0];
        setActivePreviewDoc(replaced || null);
      }

      showMessage("Document replaced successfully in Zoho Books!");
    } catch (err) {
      showMessage(err.message || "Failed to replace document.", true);
    } finally {
      setActionLoading(false);
      setLoadingDocId(null);
    }
  }

  // Delete a specific document
  async function handleDelete(documentId) {
    try {
      setLoadingDocId(documentId);
      setActionLoading(true);
      setError(null);

      const res = await fetch(
        `/api/attachment?module=${module}&recordId=${recordId}&documentId=${documentId}`,
        { method: "DELETE" }
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to delete document.");
      }

      const updatedDocs = data.documents || [];
      setDocuments(updatedDocs);
      setRefreshKey(prev => prev + 1);

      if (activePreviewDoc?.document_id === documentId) {
        setActivePreviewDoc(null);
      }

      showMessage("Document deleted successfully from Zoho Books!");
    } catch (err) {
      showMessage(err.message || "Failed to delete document.", true);
    } finally {
      setActionLoading(false);
      setLoadingDocId(null);
    }
  }

  if (!module || !recordId) {
    return null;
  }

  // Pre-load CTA button to conserve Zoho API requests
  if (!isLoaded) {
    return (
      <div className={`w-full bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 ${className}`}>
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-tr from-indigo-500 to-blue-600 text-white rounded-2xl shadow-md shadow-indigo-100 flex items-center justify-center">
            <Paperclip className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">{title}</h3>
            <p className="text-xs text-slate-500 mt-0.5">Click to check or manage attachments (conserves API usage).</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsLoaded(true)}
          className="w-full sm:w-auto py-2.5 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-xl shadow-sm shadow-indigo-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Paperclip className="w-4 h-4" />
          Load Attachments
        </button>
      </div>
    );
  }

  return (
    <div className={`w-full bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-tr from-indigo-500 to-blue-600 text-white rounded-2xl shadow-md shadow-indigo-100 flex items-center justify-center flex-shrink-0">
            <Paperclip className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-bold text-slate-900">{title}</h2>
              {!initialLoading && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                  {documents.length} {documents.length === 1 ? "File" : "Files"}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{subtext}</p>
          </div>
        </div>

        {/* Action Button: Add Documents */}
        {!initialLoading && documents.length > 0 && (
          <button
            type="button"
            onClick={() => setShowUploadArea(!showUploadArea)}
            className={`py-2 px-4 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer ${
              showUploadArea
                ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200"
            }`}
          >
            <Plus className={`w-4 h-4 transition-transform ${showUploadArea ? "rotate-45" : ""}`} />
            {showUploadArea ? "Close Uploader" : "Add Documents"}
          </button>
        )}
      </div>

      {/* Success Notification */}
      {success && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-2xl text-sm flex items-center gap-3 animate-fade-in shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span className="font-medium">{success}</span>
        </div>
      )}

      {/* Error Notification */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-700 rounded-2xl text-sm flex items-center gap-3 animate-fade-in shadow-xs">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Loading State */}
      {initialLoading ? (
        <div className="flex flex-col items-center justify-center py-12 border-2 border-slate-100 border-dashed rounded-2xl">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-3" />
          <p className="text-sm font-medium text-slate-600">Retrieving attachments from Zoho Books...</p>
        </div>
      ) : documents.length === 0 ? (
        /* Empty State: Direct Uploader */
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
            <FolderOpen className="w-5 h-5 text-slate-400" />
            <p className="text-xs text-slate-600">
              No documents are currently attached to this quotation. You can upload one or multiple files below.
            </p>
          </div>
          <AttachmentUpload onUpload={handleUpload} loading={actionLoading} />
        </div>
      ) : (
        /* Multi-Document List & Views */
        <div className="space-y-6">
          {/* Upload Area (Expandable if documents already exist) */}
          {showUploadArea && (
            <div className="mb-6 p-4 sm:p-6 bg-slate-50 border border-indigo-100 rounded-2xl animate-fade-in">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-indigo-600" />
                  Attach Additional Documents
                </h3>
                <button
                  type="button"
                  onClick={() => setShowUploadArea(false)}
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
              </div>
              <AttachmentUpload
                onUpload={handleUpload}
                loading={actionLoading}
                onCancel={() => setShowUploadArea(false)}
              />
            </div>
          )}

          {/* Documents Table/Card List */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <span>Attached Documents ({documents.length})</span>
              <span>Actions</span>
            </div>

            <div className="divide-y divide-slate-100 bg-white">
              {documents.map((doc, idx) => {
                const isPreviewing = activePreviewDoc?.document_id === doc.document_id;
                const isItemLoading = actionLoading && loadingDocId === doc.document_id;

                return (
                  <div
                    key={doc.document_id || idx}
                    className={`p-4 sm:px-5 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                      isPreviewing ? "bg-indigo-50/40" : "hover:bg-slate-50/60"
                    }`}
                  >
                    {/* File Meta */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="p-2.5 bg-slate-100 border border-slate-200 rounded-xl flex-shrink-0">
                        {getFileIcon(doc.file_type || doc.file_name?.split(".").pop())}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4
                            className="text-sm font-bold text-slate-900 truncate hover:text-indigo-600 cursor-pointer"
                            title={doc.file_name}
                            onClick={() => setActivePreviewDoc(isPreviewing ? null : doc)}
                          >
                            {doc.file_name}
                          </h4>
                          <span className="text-[10px] font-semibold uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full flex-shrink-0">
                            {doc.file_type || "file"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                          <span>{doc.file_size_formatted || "-"}</span>
                          {doc.uploaded_on && (
                            <>
                              <span>•</span>
                              <span>Uploaded {doc.uploaded_on}</span>
                            </>
                          )}
                          {doc.uploaded_by && (
                            <>
                              <span>•</span>
                              <span>by {doc.uploaded_by}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <AttachmentActions
                      module={module}
                      recordId={recordId}
                      document={doc}
                      onPreview={() => setActivePreviewDoc(isPreviewing ? null : doc)}
                      onReplace={handleReplace}
                      onDelete={handleDelete}
                      loading={isItemLoading}
                      isPreviewing={isPreviewing}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Preview Panel */}
          {activePreviewDoc && (
            <div className="pt-2">
              <AttachmentPreview
                module={module}
                recordId={recordId}
                document={activePreviewDoc}
                onClose={() => setActivePreviewDoc(null)}
                refreshKey={refreshKey}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
