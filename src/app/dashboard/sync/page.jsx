"use client";

import { useState } from "react";
import { RefreshCcw, CheckCircle2, AlertCircle, Database, Users, Box, FileText, Percent } from "lucide-react";

export default function SyncPage() {
  const [syncStatus, setSyncStatus] = useState({});
  const [loading, setLoading] = useState({});

  async function handleSync(module, type = 'manual') {
    setLoading(prev => ({ ...prev, [module]: true }));
    setSyncStatus(prev => ({ ...prev, [module]: null }));

    try {
      const res = await fetch(`/api/sync/${module}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setSyncStatus(prev => ({
          ...prev,
          [module]: { success: true, message: `Successfully synced ${data.processed} records.` }
        }));
      } else {
        setSyncStatus(prev => ({
          ...prev,
          [module]: { success: false, message: data.error || "Sync failed." }
        }));
      }
    } catch (err) {
      setSyncStatus(prev => ({
        ...prev,
        [module]: { success: false, message: err.message || "An error occurred." }
      }));
    } finally {
      setLoading(prev => ({ ...prev, [module]: false }));
    }
  }

  const modules = [
    { id: "customers", name: "Customers", icon: Users, description: "Sync contacts and companies from Zoho Books." },
    { id: "items", name: "Items", icon: Box, description: "Sync products, services, and inventory levels." },
    { id: "taxes", name: "Taxes", icon: Percent, description: "Sync tax rates and groups." },
    { id: "quotations", name: "Quotations", icon: FileText, description: "Sync estimates and quotes history." },
    // { id: "invoices", name: "Invoices", icon: FileText, description: "Sync invoices history." },
    // { id: "sales-orders", name: "Sales Orders", icon: FileText, description: "Sync sales orders history." }
  ];

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="mb-8 border-b border-slate-200 pb-4 flex items-center gap-3">
        <Database className="text-indigo-600" size={28} />
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Data Synchronization</h1>
          <p className="text-sm text-slate-500 mt-1">Manage data sync between Zoho Books and local MongoDB cache.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {modules.map(mod => (
          <div key={mod.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                <mod.icon size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">{mod.name}</h3>
                <p className="text-sm text-slate-500 mt-1">{mod.description}</p>
              </div>
            </div>

            {syncStatus[mod.id] && (
              <div className={`mb-4 p-3 rounded-lg text-sm flex items-start gap-2 ${syncStatus[mod.id].success ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-red-50 text-red-700 border border-red-100"}`}>
                {syncStatus[mod.id].success ? <CheckCircle2 size={18} className="mt-0.5" /> : <AlertCircle size={18} className="mt-0.5" />}
                {syncStatus[mod.id].message}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => handleSync(mod.id, 'incremental')}
                disabled={loading[mod.id]}
                className="flex-1 py-2 px-4 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Sync Recent
              </button>
              <button
                onClick={() => handleSync(mod.id, 'manual')}
                disabled={loading[mod.id]}
                className="flex-1 py-2 px-4 bg-indigo-600 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {loading[mod.id] ? (
                  <RefreshCcw size={16} className="animate-spin" />
                ) : (
                  <RefreshCcw size={16} />
                )}
                Full Sync
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
