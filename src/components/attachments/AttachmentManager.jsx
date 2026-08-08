"use client";

import { useState, useEffect } from "react";
import { Paperclip, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import AttachmentUpload from "./AttachmentUpload";
import AttachmentPreview from "./AttachmentPreview";
import AttachmentActions from "./AttachmentActions";

export default function AttachmentManager({
  module,
  recordId,
  title = "Record Attachment",
  subtext = "Manage documentation attached directly to this Zoho Books record.",
  className = ""
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasAttachment, setHasAttachment] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Check if attachment exists only after user clicks Load Attachments
  useEffect(() => {
    if (!isLoaded || !module || !recordId) return;

    async function checkAttachment() {
      try {
        setInitialLoading(true);
        const res = await fetch(`/api/attachment?module=${module}&recordId=${recordId}&action=view`);
        if (res.ok) {
          setHasAttachment(true);
        } else {
          setHasAttachment(false);
        }
      } catch (err) {
        console.error("Error checking attachment status:", err);
        setHasAttachment(false);
      } finally {
        setInitialLoading(false);
      }
    }

    checkAttachment();
  }, [module, recordId, isLoaded]);

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

  async function handleUpload(file) {
    try {
      setActionLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append("module", module);
      formData.append("recordId", recordId);
      formData.append("file", file);

      const res = await fetch("/api/attachment", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to upload attachment.");
      }

      setHasAttachment(true);
      setRefreshKey((prev) => prev + 1);
      showMessage("Attachment uploaded successfully to Zoho Books!");
    } catch (err) {
      showMessage(err.message || "Failed to upload attachment.", true);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReplace(file) {
    try {
      setActionLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append("module", module);
      formData.append("recordId", recordId);
      formData.append("file", file);

      const res = await fetch("/api/attachment", {
        method: "PUT",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to replace attachment.");
      }

      setHasAttachment(true);
      setRefreshKey((prev) => prev + 1);
      showMessage("Attachment replaced successfully in Zoho Books!");
    } catch (err) {
      showMessage(err.message || "Failed to replace attachment.", true);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDelete() {
    try {
      setActionLoading(true);
      setError(null);

      const res = await fetch(`/api/attachment?module=${module}&recordId=${recordId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to delete attachment.");
      }

      setHasAttachment(false);
      showMessage("Attachment deleted successfully from Zoho Books!");
    } catch (err) {
      showMessage(err.message || "Failed to delete attachment.", true);
    } finally {
      setActionLoading(false);
    }
  }

  if (!module || !recordId) {
    return null;
  }

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
          className="w-full sm:w-auto py-2.5 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-xl shadow-sm shadow-indigo-200 transition-all flex items-center justify-center gap-2"
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
      <div className="flex items-center gap-4 mb-6 border-b border-slate-100 pb-5">
        <div className="p-3 bg-gradient-to-tr from-indigo-500 to-blue-600 text-white rounded-2xl shadow-md shadow-indigo-100 flex items-center justify-center">
          <Paperclip className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <p className="text-xs text-slate-500 mt-0.5">{subtext}</p>
        </div>
      </div>

      {/* Status Messages */}
      {success && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-2xl text-sm flex items-center gap-3 animate-fade-in shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span className="font-medium">{success}</span>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-700 rounded-2xl text-sm flex items-center gap-3 animate-fade-in shadow-sm">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Main Area */}
      {initialLoading ? (
        <div className="flex flex-col items-center justify-center py-12 border-2 border-slate-100 border-dashed rounded-2xl">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-3" />
          <p className="text-sm font-medium text-slate-600">Verifying attachment status with Zoho Books...</p>
        </div>
      ) : hasAttachment ? (
        <div className="space-y-6">
          <AttachmentPreview module={module} recordId={recordId} refreshKey={refreshKey} />
          <AttachmentActions
            module={module}
            recordId={recordId}
            onReplace={handleReplace}
            onDelete={handleDelete}
            loading={actionLoading}
          />
        </div>
      ) : (
        <AttachmentUpload onUpload={handleUpload} loading={actionLoading} />
      )}
    </div>
  );
}
