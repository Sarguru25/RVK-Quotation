"use client";

import { useState } from "react";
import { FileText, ExternalLink, Minimize2, Maximize2, X, DownloadCloud, FileSpreadsheet, FileCode, Image as ImageIcon } from "lucide-react";

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

export default function AttachmentPreview({
  module,
  recordId,
  document: doc,
  onClose,
  refreshKey = 0
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!doc) return null;

  const docId = doc.document_id || "";
  const fileType = (doc.file_type || doc.file_name?.split(".").pop() || "").toLowerCase();
  const isPreviewable = ["pdf", "png", "jpg", "jpeg", "webp", "svg", "txt"].includes(fileType);

  const viewUrl = `/api/attachment?module=${module}&recordId=${recordId}&action=view&documentId=${docId}&t=${refreshKey}`;
  const downloadUrl = `/api/attachment?module=${module}&recordId=${recordId}&action=download&documentId=${docId}&t=${refreshKey}`;

  return (
    <div className="w-full bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-sm transition-all animate-fade-in">
      {/* Header Bar */}
      <div className="bg-white px-5 py-3.5 border-b border-slate-200 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-xl flex-shrink-0">
            {getFileIcon(fileType)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-800 truncate" title={doc.file_name}>
                {doc.file_name}
              </h3>
              <span className="text-[10px] font-semibold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-100 flex-shrink-0">
                {fileType || "doc"}
              </span>
            </div>
            <p className="text-xs text-slate-500 truncate">
              {doc.file_size_formatted || "Document Preview"} {doc.uploaded_on ? `• Uploaded ${doc.uploaded_on}` : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Open in new tab */}
          <a
            href={viewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-1 text-xs font-medium"
            title="Open in new tab"
          >
            <ExternalLink className="w-4 h-4" />
            <span className="hidden sm:inline">Open</span>
          </a>

          {/* Download */}
          <a
            href={downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-1 text-xs font-medium"
            title="Download document"
          >
            <DownloadCloud className="w-4 h-4" />
            <span className="hidden sm:inline">Download</span>
          </a>

          {/* Collapse/Expand */}
          {isPreviewable && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-1 text-xs font-medium"
              title={isExpanded ? "Collapse preview" : "Expand preview"}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              <span className="hidden sm:inline">{isExpanded ? "Hide" : "Show"}</span>
            </button>
          )}

          {/* Close preview */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors ml-1"
              title="Close Preview"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Preview Area */}
      {isExpanded && (
        <div className="w-full bg-slate-100/60 p-3 sm:p-4">
          {isPreviewable ? (
            <div className="w-full h-[500px] bg-white rounded-xl overflow-hidden border border-slate-200 shadow-inner relative">
              <iframe
                src={viewUrl}
                title={doc.file_name}
                className="w-full h-full border-0"
                loading="lazy"
              />
            </div>
          ) : (
            <div className="w-full py-12 px-4 bg-white rounded-xl border border-slate-200 flex flex-col items-center justify-center text-center">
              <div className="p-4 bg-slate-100 text-slate-500 rounded-2xl mb-3">
                {getFileIcon(fileType)}
              </div>
              <h4 className="text-sm font-semibold text-slate-800 mb-1">
                Preview Not Supported In-Browser for .{fileType.toUpperCase()}
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mb-4">
                Office documents and spreadsheets cannot be embedded inline by web browsers. Please download the file to view it in its native application.
              </p>
              <a
                href={downloadUrl}
                className="py-2 px-5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-xl shadow-xs transition-colors flex items-center gap-2"
              >
                <DownloadCloud className="w-4 h-4" />
                Download {doc.file_name}
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
