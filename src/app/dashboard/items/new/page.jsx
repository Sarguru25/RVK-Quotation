"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { X, Image as ImageIcon, HelpCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function NewItemPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [taxes, setTaxes] = useState([]);
  const [vendors, setVendors] = useState([]);

  const initialFormState = {
    name: "",
    product_type: "goods",
    unit: "",
    sku: "",
    
    // Sales Info
    is_sales: true,
    rate: "",
    account_id: "",
    description: "",
    tax_id: "",
    
    // Purchase Info
    is_purchase: true,
    purchase_rate: "",
    purchase_account_id: "",
    purchase_description: "",
    purchase_tax_id: "",
    vendor_id: "",
    
    // Inventory
    track_inventory: false,
    
    // Tags
    job_number: "",
    market_segment: ""
  };

  const [form, setForm] = useState(initialFormState);

  const unitOptions = [
    "", "box", "cm", "dz", "ft", "g", "in", "kg", "km", "lb",
    "mg", "ml", "m", "nos", "pcs", "qty", "set",
  ];

  useEffect(() => {
    async function fetchData() {
      try {
        const [taxRes, vendorsRes] = await Promise.all([
          fetch("/api/zoho/taxes").catch(() => null),
          fetch("/api/zoho/customers?limit=100").catch(() => null) // vendors might be here
        ]);
        if (taxRes && taxRes.ok) {
          const taxData = await taxRes.json();
          setTaxes(taxData.data || taxData || []);
        }
        if (vendorsRes && vendorsRes.ok) {
          const vendData = await vendorsRes.json();
          // Assuming vendors are stored in same DB or we just use customers list
          setVendors(vendData.data || []);
        }
      } catch (error) {
        console.error("Error fetching dependencies:", error);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (editId) {
      setLoading(true);
      fetch(`/api/zoho/items/${editId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data) {
            setForm((prev) => ({
              ...prev,
              name: data.name || "",
              product_type: data.product_type || "goods",
              unit: data.unit || "",
              sku: data.sku || "",
              rate: data.rate || "",
              description: data.description || "",
              tax_id: data.tax_id || "",
              account_id: data.account_id || "",
              purchase_rate: data.purchase_rate || "",
              purchase_description: data.purchase_description || "",
              purchase_tax_id: data.purchase_tax_id || "",
              purchase_account_id: data.purchase_account_id || "",
              vendor_id: data.vendor_id || "",
              track_inventory: data.is_combo_product || false, // approximated
            }));
          }
        })
        .catch(() => toast.error("Failed to load item details"))
        .finally(() => setLoading(false));
    }
  }, [editId]);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSaveItem() {
    if (!form.name.trim()) {
      toast.error("Item name is required");
      return;
    }
    try {
      setSaving(true);
      const url = editId ? `/api/zoho/items/${editId}` : "/api/zoho/items/create";
      const method = editId ? "PUT" : "POST";
      
      const payload = { ...form };
      // Process custom fields for Job Number and Market Segment if API supports it
      payload.custom_fields = [];
      if (form.job_number) {
        payload.custom_fields.push({ label: "Job Number", value: form.job_number });
      }
      if (form.market_segment) {
        payload.custom_fields.push({ label: "Market Segment", value: form.market_segment });
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        toast.error(typeof data.error === "string" ? data.error : data.error?.message || "Failed to save item");
        return;
      }
      toast.success(`Item ${editId ? "updated" : "created"} successfully!`);
      window.fetch('/api/sync/items', { method: 'POST', keepalive: true }).catch(() => {});
      router.push("/dashboard/items");
    } catch (error) {
      toast.error("An error occurred while saving");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <span className="font-medium text-gray-500">Loading item details...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-[1000px] mx-auto bg-white rounded-lg shadow-sm border border-gray-200">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            {editId ? "Edit Item" : "New Item"}
          </h2>
          <button onClick={() => router.push("/dashboard/items")} className="p-1.5 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-8">
          
          {/* Top Section */}
          <div className="flex flex-col lg:flex-row gap-10 mb-10">
            
            {/* Left Column (Fields) */}
            <div className="flex-1 space-y-6">
              
              <div className="grid grid-cols-[120px_1fr] items-center">
                <label className="text-sm text-red-500 flex items-center gap-1">
                  Name*
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-[120px_1fr] items-center">
                <label className="text-sm text-gray-600 flex items-center gap-1">
                  Type <HelpCircle size={14} className="text-gray-400" />
                </label>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="product_type" value="goods" checked={form.product_type === "goods"} onChange={handleChange} className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-gray-700">Goods</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="product_type" value="service" checked={form.product_type === "service"} onChange={handleChange} className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-gray-700">Service</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-[120px_1fr] items-center">
                <label className="text-sm text-gray-600 flex items-center gap-1">
                  Unit <HelpCircle size={14} className="text-gray-400" />
                </label>
                <select
                  name="unit"
                  value={form.unit}
                  onChange={handleChange}
                  className="w-2/3 max-w-[250px] border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:border-blue-500 outline-none"
                >
                  <option value="">Select or type to add</option>
                  {unitOptions.filter(u => u).map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-[120px_1fr] items-center">
                <label className="text-sm text-gray-600 flex items-center gap-1">
                  SKU <HelpCircle size={14} className="text-gray-400" />
                </label>
                <input
                  type="text"
                  name="sku"
                  value={form.sku}
                  onChange={handleChange}
                  className="w-2/3 max-w-[250px] border border-gray-300 rounded px-3 py-2 text-sm focus:border-blue-500 outline-none"
                />
              </div>

            </div>

            {/* Right Column (Image) */}
            <div className="w-[250px] shrink-0">
              <div className="border border-dashed border-gray-300 rounded-lg aspect-square flex flex-col items-center justify-center p-6 bg-gray-50/50 hover:bg-gray-50 transition-colors cursor-pointer group">
                <ImageIcon className="w-10 h-10 text-gray-300 mb-3 group-hover:text-blue-400 transition-colors" />
                <p className="text-xs text-gray-500 text-center leading-relaxed">
                  Drag image(s) here or <br/>
                  <span className="text-blue-600">Browse images</span>
                </p>
              </div>
            </div>

          </div>

          <hr className="border-gray-200 mb-8" />

          {/* Sales Information */}
          <div className="mb-8">
            <label className="flex items-center gap-2 mb-6 cursor-pointer">
              <input type="checkbox" name="is_sales" checked={form.is_sales} onChange={handleChange} className="w-4 h-4 rounded text-blue-600" />
              <span className="text-base font-medium text-gray-800">Sales Information</span>
            </label>
            
            {form.is_sales && (
              <div className="grid grid-cols-2 gap-x-12 gap-y-6 pl-6">
                <div>
                  <label className="block text-sm text-red-500 mb-1.5">Selling Price*</label>
                  <div className="flex items-center border border-gray-300 rounded overflow-hidden focus-within:border-blue-500">
                    <span className="bg-gray-100 text-gray-500 px-3 py-2 text-sm border-r border-gray-300">SGD</span>
                    <input type="number" name="rate" value={form.rate} onChange={handleChange} className="w-full px-3 py-2 text-sm outline-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-red-500 mb-1.5">Account*</label>
                  <select name="account_id" value={form.account_id} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:border-blue-500 outline-none">
                    <option value="">[ 40-001 ] Sales</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-1.5">Description</label>
                  <textarea name="description" value={form.description} onChange={handleChange} rows="3" className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-blue-500 outline-none resize-none"></textarea>
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-1.5 flex items-center gap-1">Tax <HelpCircle size={14} className="text-gray-400" /></label>
                  <select name="tax_id" value={form.tax_id} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:border-blue-500 outline-none">
                    <option value="">Select a Tax</option>
                    {taxes.map(t => (
                      <option key={t.tax_id || t.zoho_tax_id || t._id} value={t.tax_id || t.zoho_tax_id || t._id}>
                        {t.tax_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          <hr className="border-gray-200 mb-8" />

          {/* Purchase Information */}
          <div className="mb-8">
            <label className="flex items-center gap-2 mb-6 cursor-pointer">
              <input type="checkbox" name="is_purchase" checked={form.is_purchase} onChange={handleChange} className="w-4 h-4 rounded text-blue-600" />
              <span className="text-base font-medium text-gray-800">Purchase Information</span>
            </label>

            {form.is_purchase && (
              <div className="grid grid-cols-2 gap-x-12 gap-y-6 pl-6">
                <div>
                  <label className="block text-sm text-red-500 mb-1.5">Cost Price*</label>
                  <div className="flex items-center border border-gray-300 rounded overflow-hidden focus-within:border-blue-500">
                    <span className="bg-gray-100 text-gray-500 px-3 py-2 text-sm border-r border-gray-300">SGD</span>
                    <input type="number" name="purchase_rate" value={form.purchase_rate} onChange={handleChange} className="w-full px-3 py-2 text-sm outline-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-red-500 mb-1.5">Account*</label>
                  <select name="purchase_account_id" value={form.purchase_account_id} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:border-blue-500 outline-none">
                    <option value="">[ 50-001 ] Direct Materials</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-1.5">Description</label>
                  <textarea name="purchase_description" value={form.purchase_description} onChange={handleChange} rows="3" className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-blue-500 outline-none resize-none"></textarea>
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-1.5 flex items-center gap-1">Tax <HelpCircle size={14} className="text-gray-400" /></label>
                  <select name="purchase_tax_id" value={form.purchase_tax_id} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:border-blue-500 outline-none">
                    <option value="">Select a Tax</option>
                    {taxes.map(t => (
                      <option key={t.tax_id || t.zoho_tax_id || t._id} value={t.tax_id || t.zoho_tax_id || t._id}>
                        {t.tax_name}
                      </option>
                    ))}
                  </select>

                  <div className="mt-6">
                    <label className="block text-sm text-gray-700 mb-1.5">Preferred Vendor</label>
                    <select name="vendor_id" value={form.vendor_id} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:border-blue-500 outline-none">
                      <option value=""></option>
                      {vendors.map(v => (
                        <option key={v.contact_id || v._id} value={v.contact_id || v._id}>{v.contact_name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          <hr className="border-gray-200 mb-8" />

          {/* Track Inventory */}
          <div className="mb-8 pl-1">
            <label className="flex items-center gap-2 cursor-pointer mb-1">
              <input type="checkbox" name="track_inventory" checked={form.track_inventory} onChange={handleChange} className="w-4 h-4 rounded text-blue-600" />
              <span className="text-sm font-medium text-gray-800 flex items-center gap-1">Track Inventory for this item <HelpCircle size={14} className="text-gray-400" /></span>
            </label>
            <p className="text-xs text-gray-500 pl-6">You cannot enable/disable inventory tracking once you've created transactions for this item</p>
          </div>

          <hr className="border-gray-200 mb-8" />

          {/* Associated Tags */}
          <div className="mb-8">
            <h3 className="text-base font-medium text-gray-800 mb-6">Associated Tags</h3>
            <div className="grid grid-cols-2 gap-12 pl-6">
              <div>
                <label className="block text-sm text-gray-700 mb-1.5">Job Number</label>
                <select name="job_number" value={form.job_number} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:border-blue-500 outline-none">
                  <option value=""></option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1.5">Market Segment</label>
                <select name="market_segment" value={form.market_segment} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:border-blue-500 outline-none">
                  <option value=""></option>
                  <option value="Oil & Gas">Oil & Gas</option>
                  <option value="Marine & Offshore">Marine & Offshore</option>
                  <option value="Water & Waste Water Treatment">Water & Waste Water Treatment</option>
                  <option value="General Industry">General Industry</option>
                  <option value="HVAC">HVAC</option>
                  <option value="Chemical & Petrochemical">Chemical & Petrochemical</option>
                  <option value="Pharmaceutical">Pharmaceutical</option>
                  <option value="Mining and Cement / Steel">Mining and Cement / Steel</option>
                  <option value="Energy">Energy</option>
                  <option value="Fire Fighting">Fire Fighting</option>
                  <option value="Food & Pharma">Food & Pharma</option>
                  <option value="Paper / Pulp / Sugar">Paper / Pulp / Sugar</option>
                  <option value="Building Solutions">Building Solutions</option>
                  <option value="Textile">Textile</option>
                </select>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-8 py-4 bg-gray-50 rounded-b-lg border-t border-gray-200 flex gap-3">
          <button
            onClick={handleSaveItem}
            disabled={saving}
            className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 rounded text-sm font-medium transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            onClick={() => router.push("/dashboard/items")}
            className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-5 py-2 rounded text-sm font-medium transition-colors"
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
}
