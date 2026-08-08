"use client";

import { useState } from "react";
import { FileText, ExternalLink, Minimize2, Maximize2 } from "lucide-react";

export default function AttachmentPreview({ module, recordId, refreshKey = 0 }) {
  const [isExpanded, setIsExpanded] = useState(true);

  const viewUrl = `/api/attachment?module=${module}&recordId=${recordId}&action=view&t=${refreshKey}`;
  const downloadUrl = `/api/attachment?module=${module}&recordId=${recordId}&action=download&t=${refreshKey}`;

  return (
    <div className="w-full bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-sm transition-all">
      {/* Header Bar */}
      <div className="bg-white px-6 py-4 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              Attachment Preview
              <span className="text-[10px] font-semibold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                Available
              </span>
            </h3>
            <p className="text-xs text-slate-500">Live stream from Zoho Books</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
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

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-1 text-xs font-medium"
            title={isExpanded ? "Collapse preview" : "Expand preview"}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span className="hidden sm:inline">{isExpanded ? "Hide" : "Show"}</span>
          </button>
        </div>
      </div>

      {/* Preview Area / Iframe */}
      {isExpanded && (
        <div className="w-full bg-slate-100/50 p-2 sm:p-4">
          <div className="w-full h-[450px] bg-white rounded-xl overflow-hidden border border-slate-200 shadow-inner relative">
            <iframe
              src={viewUrl}
              title="Attachment Preview"
              className="w-full h-full border-0"
              loading="lazy"
            />
          </div>
        </div>
      )}
    </div>
  );
}
