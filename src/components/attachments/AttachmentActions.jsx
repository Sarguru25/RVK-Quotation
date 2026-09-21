"use client";

import { useState, useRef } from "react";
import { DownloadCloud, RefreshCw, Trash2, Loader2, AlertTriangle, X, Check, Eye } from "lucide-react";

export default function AttachmentActions({
  module,
  recordId,
  document: doc,
  onPreview,
  onReplace,
  onDelete,
  loading = false,
  isPreviewing = false
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const fileInputRef = useRef(null);

  if (!doc) return null;

  const docId = doc.document_id || "";
  const downloadUrl = `/api/attachment?module=${module}&recordId=${recordId}&action=download&documentId=${docId}`;

  function handleFileChange(file) {
    if (!file) return;
    onReplace(file, docId);
  }

  return (
    <div className="flex items-center gap-1.5 justify-end">
      {/* Hidden file input for Replace */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={(e) => handleFileChange(e.target.files?.[0])}
        disabled={loading}
      />

      {/* Preview Button */}
      {onPreview && (
        <button
          type="button"
          onClick={onPreview}
          className={`p-2 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 ${
            isPreviewing
              ? "bg-indigo-600 text-white shadow-xs"
              : "text-slate-600 hover:text-indigo-600 hover:bg-slate-100"
          }`}
          title={isPreviewing ? "Viewing Preview" : "Preview Document"}
        >
          <Eye className="w-3.5 h-3.5" />
          <span className="hidden md:inline">{isPreviewing ? "Viewing" : "Preview"}</span>
        </button>
      )}

      {/* Download Button */}
      <a
        href={downloadUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5"
        title="Download"
      >
        <DownloadCloud className="w-3.5 h-3.5 text-slate-500" />
        <span className="hidden md:inline">Download</span>
      </a>

      {/* Replace Button */}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={loading}
        className="p-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50"
        title="Replace with new version"
      >
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
        <span className="hidden md:inline">Replace</span>
      </button>

      {/* Delete Button / Inline Confirmation */}
      {confirmDelete ? (
        <div className="flex items-center gap-1 bg-red-50 border border-red-100 rounded-xl p-1 shadow-xs animate-fade-in">
          <span className="text-[11px] font-semibold text-red-700 pl-2 pr-1 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-red-600" /> Delete?
          </span>
          <button
            type="button"
            onClick={() => setConfirmDelete(false)}
            disabled={loading}
            className="p-1 bg-white hover:bg-slate-100 text-slate-600 rounded-lg border border-slate-200 transition-colors"
            title="Cancel"
          >
            <X className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={() => {
              setConfirmDelete(false);
              onDelete(docId);
            }}
            disabled={loading}
            className="p-1 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors shadow-xs"
            title="Confirm Delete"
          >
            <Check className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirmDelete(true)}
          disabled={loading}
          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50"
          title="Delete document"
        >
          <Trash2 className="w-3.5 h-3.5 text-slate-500 hover:text-red-600" />
          <span className="hidden md:inline">Delete</span>
        </button>
      )}
    </div>
  );
}
