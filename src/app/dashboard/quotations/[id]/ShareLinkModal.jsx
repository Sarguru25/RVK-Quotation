"use client";

import { useState, useEffect } from "react";
import { Copy, Link as LinkIcon, RefreshCw, Trash2, X, Globe, CheckCircle2 } from "lucide-react";

export default function ShareLinkModal({ isOpen, onClose, quoteId }) {
  const [linkData, setLinkData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expiresInDays, setExpiresInDays] = useState("30");

  useEffect(() => {
    if (isOpen) {
      fetchLink();
    }
  }, [isOpen]);

  const fetchLink = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/zoho/quotations/${quoteId}/share`);
      const data = await res.json();
      if (data.link) {
        setLinkData(data.link);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const generateLink = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/zoho/quotations/${quoteId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expiresInDays })
      });
      const data = await res.json();
      if (data.success) {
        setLinkData(data.link);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/zoho/quotations/${quoteId}/share`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !linkData.isActive })
      });
      const data = await res.json();
      if (data.success) {
        setLinkData(data.link);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!linkData) return;
    const url = `${window.location.origin}/view/${linkData.publicToken}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <Globe className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Share Quotation</h2>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-gray-600 mb-6">
            Generate a secure, public link to share this quotation with your customer. They will be able to view, download, accept, or request revisions without logging in.
          </p>

          {loading && !linkData ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : linkData ? (
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Public Link</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    readOnly 
                    value={`${window.location.origin}/view/${linkData.publicToken}`}
                    className={`flex-1 bg-gray-50 border ${linkData.isActive ? 'border-gray-200 text-gray-800' : 'border-red-200 text-gray-400'} py-3 px-4 rounded-xl text-sm font-medium focus:outline-none`}
                  />
                  <button 
                    onClick={copyToClipboard}
                    disabled={!linkData.isActive}
                    className="flex items-center justify-center p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Copy Link"
                  >
                    {copied ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-semibold text-gray-700">Status:</span>
                  {linkData.isActive ? (
                    <span className="px-2.5 py-1 bg-green-100 text-green-700 font-medium rounded-md text-xs">Active</span>
                  ) : (
                    <span className="px-2.5 py-1 bg-red-100 text-red-700 font-medium rounded-md text-xs">Disabled</span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <span className="font-semibold text-gray-700">Views:</span>
                  <span className="text-gray-600">{linkData.viewCount}</span>
                </div>

                {linkData.expiresAt && (
                  <div className="flex items-center gap-2 text-sm w-full mt-1">
                    <span className="font-semibold text-gray-700">Expires:</span>
                    <span className="text-gray-600">{new Date(linkData.expiresAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-6">
                <button 
                  onClick={toggleActive}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  {linkData.isActive ? "Disable Link" : "Enable Link"}
                </button>
                <button 
                  onClick={generateLink}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  Regenerate
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Expiry Option</label>
                <select 
                  value={expiresInDays} 
                  onChange={(e) => setExpiresInDays(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-700 py-3 px-4 rounded-xl focus:outline-none focus:border-blue-500 text-sm"
                >
                  <option value="7">7 Days</option>
                  <option value="15">15 Days</option>
                  <option value="30">30 Days</option>
                  <option value="90">90 Days</option>
                </select>
              </div>

              <button 
                onClick={generateLink}
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 bg-blue-600 text-white font-semibold py-3 px-4 rounded-xl hover:bg-blue-700 shadow-md shadow-blue-600/20 transition-all text-sm mt-4"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <LinkIcon className="w-5 h-5" />
                )}
                Generate Shareable Link
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
