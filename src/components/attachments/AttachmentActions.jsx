"use client";

import { useState, useRef } from "react";
import { DownloadCloud, RefreshCw, Trash2, Loader2, AlertTriangle, X, Check } from "lucide-react";

export default function AttachmentActions({ module, recordId, onReplace, onDelete, loading }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const fileInputRef = useRef(null);

  const downloadUrl = `/api/attachment?module=${module}&recordId=${recordId}&action=download`;

  function handleFileChange(file) {
    if (!file) return;
    onReplace(file);
  }

  return (
    <div className="w-full bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 transition-all">
      <div>
        <h4 className="text-sm font-bold text-slate-800">Attachment Actions</h4>
        <p className="text-xs text-slate-500 mt-0.5">Download, replace with a new file, or permanently delete.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
        {/* Hidden file input for Replace */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => handleFileChange(e.target.files?.[0])}
          disabled={loading}
        />

        {/* Download Button */}
        <a
          href={downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 sm:flex-none py-2.5 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 shadow-sm"
        >
          <DownloadCloud className="w-4 h-4 text-slate-600" />
          Download
        </a>

        {/* Replace Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          className="flex-1 sm:flex-none py-2.5 px-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4 text-indigo-600" />}
          Replace
        </button>

        {/* Delete Button / Confirmation */}
        {confirmDelete ? (
          <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl p-1 shadow-sm animate-fade-in">
            <span className="text-xs font-semibold text-red-700 pl-3 pr-1 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-red-600" /> Confirm?
            </span>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              disabled={loading}
              className="p-1.5 bg-white hover:bg-slate-100 text-slate-600 rounded-lg border border-slate-200 transition-colors"
              title="Cancel"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirmDelete(false);
                onDelete();
              }}
              disabled={loading}
              className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors shadow-sm"
              title="Yes, Delete"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            disabled={loading}
            className="flex-1 sm:flex-none py-2.5 px-4 bg-red-50 hover:bg-red-100 text-red-700 border border-red-100 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
