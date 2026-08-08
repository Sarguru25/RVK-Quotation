"use client";

import { useState, useRef } from "react";
import { UploadCloud, FileText, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";

export default function AttachmentUpload({ onUpload, loading, accept = "*/*", maxSizeMB = 15 }) {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  function handleFileChange(file) {
    setError(null);
    if (!file) return;

    // Validate size
    const sizeInMB = file.size / (1024 * 1024);
    if (sizeInMB > maxSizeMB) {
      setError(`File size (${sizeInMB.toFixed(1)}MB) exceeds the maximum allowed limit of ${maxSizeMB}MB.`);
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  }

  async function handleUploadClick() {
    if (!selectedFile) return;
    try {
      setError(null);
      await onUpload(selectedFile);
      setSelectedFile(null);
    } catch (err) {
      setError(err.message || "Failed to upload attachment.");
    }
  }

  return (
    <div className="w-full">
      <div
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 ${
          dragOver
            ? "border-indigo-500 bg-indigo-50/50 shadow-inner"
            : selectedFile
            ? "border-emerald-300 bg-emerald-50/30"
            : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50/50"
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !selectedFile && !loading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={accept}
          onChange={(e) => handleFileChange(e.target.files?.[0])}
          disabled={loading}
        />

        {loading ? (
          <div className="flex flex-col items-center justify-center py-6">
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
            <h3 className="text-base font-bold text-slate-800 mb-1">Uploading Attachment...</h3>
            <p className="text-xs text-slate-500">Please wait while the file is securely transmitted to Zoho Books.</p>
          </div>
        ) : selectedFile ? (
          <div className="flex flex-col items-center justify-center py-4">
            <div className="w-16 h-16 bg-emerald-100 border border-emerald-200 text-emerald-600 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1">{selectedFile.name}</h3>
            <p className="text-xs text-slate-500 mb-6">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>

            <div className="flex gap-3 w-full max-w-xs">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                className="flex-1 py-2.5 px-4 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleUploadClick(); }}
                className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium shadow-sm shadow-indigo-200 transition-colors flex items-center justify-center gap-2"
              >
                <UploadCloud className="w-4 h-4" />
                Upload
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 cursor-pointer">
            <div className="w-16 h-16 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-105 transition-transform">
              <UploadCloud className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1">Select a file or drag and drop here</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto mb-4">
              Supported formats: PDF, PNG, JPG, DOCX, XLSX. Maximum size: {maxSizeMB}MB.
            </p>
            <span className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 shadow-sm hover:bg-slate-50 transition-colors">
              Browse Files
            </span>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-100 text-red-700 rounded-2xl text-sm flex items-center gap-3 animate-fade-in">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
