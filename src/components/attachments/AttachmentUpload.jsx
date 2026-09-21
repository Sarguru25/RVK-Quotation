"use client";

import { useState, useRef } from "react";
import { UploadCloud, FileText, AlertCircle, Loader2, X, Plus, Files } from "lucide-react";

export default function AttachmentUpload({
  onUpload,
  loading,
  accept = "*/*",
  maxSizeMB = 15,
  onCancel = null
}) {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const fileInputRef = useRef(null);

  function validateAndAddFiles(filesList) {
    setError(null);
    if (!filesList || filesList.length === 0) return;

    const newFiles = [];
    const errors = [];

    for (const file of filesList) {
      const sizeInMB = file.size / (1024 * 1024);
      if (sizeInMB > maxSizeMB) {
        errors.push(`"${file.name}" (${sizeInMB.toFixed(1)}MB) exceeds limit of ${maxSizeMB}MB.`);
        continue;
      }
      // Avoid exact duplicates in current staged list
      if (!selectedFiles.some(f => f.name === file.name && f.size === file.size)) {
        newFiles.push(file);
      }
    }

    if (errors.length > 0) {
      setError(errors.join(" "));
    }

    if (newFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...newFiles]);
    }
  }

  function handleFileChange(e) {
    const files = Array.from(e.target.files || []);
    validateAndAddFiles(files);
    // Reset input value so re-selecting same file works
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      validateAndAddFiles(files);
    }
  }

  function removeFile(index, e) {
    e.stopPropagation();
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  }

  async function handleUploadClick(e) {
    e.stopPropagation();
    if (selectedFiles.length === 0) return;
    try {
      setError(null);
      await onUpload(selectedFiles);
      setSelectedFiles([]);
    } catch (err) {
      setError(err.message || "Failed to upload attachments.");
    }
  }

  const totalBytes = selectedFiles.reduce((acc, f) => acc + f.size, 0);
  const totalMB = (totalBytes / (1024 * 1024)).toFixed(2);

  return (
    <div className="w-full">
      <div
        className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all duration-200 ${
          dragOver
            ? "border-indigo-500 bg-indigo-50/50 shadow-inner"
            : selectedFiles.length > 0
            ? "border-emerald-300 bg-emerald-50/20"
            : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50/50"
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => selectedFiles.length === 0 && !loading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={accept}
          multiple
          onChange={handleFileChange}
          disabled={loading}
        />

        {loading ? (
          <div className="flex flex-col items-center justify-center py-6">
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
            <h3 className="text-base font-bold text-slate-800 mb-1">
              Uploading {selectedFiles.length} {selectedFiles.length === 1 ? "Document" : "Documents"}...
            </h3>
            <p className="text-xs text-slate-500">Please wait while the documents are securely uploaded to Zoho Books.</p>
          </div>
        ) : selectedFiles.length > 0 ? (
          <div className="flex flex-col items-center justify-center py-2" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
                <Files className="w-6 h-6" />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-bold text-slate-800">
                  {selectedFiles.length} {selectedFiles.length === 1 ? "file ready to upload" : "files ready to upload"}
                </h3>
                <p className="text-xs text-slate-500">Total size: {totalMB} MB</p>
              </div>
            </div>

            {/* List of staged files */}
            <div className="w-full max-w-xl max-h-52 overflow-y-auto mb-5 space-y-2 text-left pr-1">
              {selectedFiles.map((file, idx) => (
                <div
                  key={`${file.name}-${idx}`}
                  className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-xl shadow-xs hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <FileText className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                    <span className="text-xs font-medium text-slate-800 truncate" title={file.name}>
                      {file.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-[11px] text-slate-400 font-mono">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </span>
                    <button
                      type="button"
                      onClick={(e) => removeFile(idx, e)}
                      className="p-1 text-slate-400 hover:text-red-500 rounded-md hover:bg-red-50 transition-colors"
                      title="Remove file"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add more files button */}
            <div className="flex items-center justify-center mb-5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:underline"
              >
                <Plus className="w-3.5 h-3.5" />
                Add more files
              </button>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 w-full max-w-sm">
              <button
                type="button"
                onClick={() => {
                  setSelectedFiles([]);
                  if (onCancel) onCancel();
                }}
                className="flex-1 py-2.5 px-4 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUploadClick}
                className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium shadow-sm shadow-indigo-200 transition-colors flex items-center justify-center gap-2"
              >
                <UploadCloud className="w-4 h-4" />
                Upload All ({selectedFiles.length})
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 cursor-pointer">
            <div className="w-16 h-16 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-105 transition-transform">
              <UploadCloud className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1">
              Select documents or drag & drop here
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              Select one or multiple files (PDF, PNG, JPG, DOCX, XLSX). Max {maxSizeMB}MB per file.
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
          <span className="text-xs leading-relaxed">{error}</span>
        </div>
      )}
    </div>
  );
}
