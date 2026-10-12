"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { X, Image as ImageIcon, HelpCircle } from "lucide-react";
import toast from "react-hot-toast";
import AccountSelectDropdown from "./AccountSelectDropdown";
import {
  DEFAULT_SALES_ACCOUNT_ID,
  DEFAULT_PURCHASE_ACCOUNT_ID,
  FALLBACK_COGS_ACCOUNTS,
  FALLBACK_SALES_ACCOUNTS,
  FALLBACK_JOB_NUMBERS,
  FALLBACK_MARKET_SEGMENTS,
} from "./accountConstants";

export default function NewItemPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

  const [loading, setLoading] = useState(Boolean(editId));
  const [saving, setSaving] = useState(false);
  const [taxes, setTaxes] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [salesAccounts, setSalesAccounts] = useState(FALLBACK_SALES_ACCOUNTS);
  const [cogsAccounts, setCogsAccounts] = useState(FALLBACK_COGS_ACCOUNTS);
  const [expenseAccounts, setExpenseAccounts] = useState([]);
  const [jobNumberOptions, setJobNumberOptions] = useState(FALLBACK_JOB_NUMBERS);
  const [marketSegmentOptions, setMarketSegmentOptions] = useState(FALLBACK_MARKET_SEGMENTS);

  const initialFormState = {
    name: "",
    product_type: "goods",
    unit: "",
    sku: "",

    // Sales Info
    is_sales: true,
    rate: "",
    account_id: DEFAULT_SALES_ACCOUNT_ID,
    description: "",
    tax_id: "",

    // Purchase Info
    is_purchase: true,
    purchase_rate: "",
    purchase_account_id: DEFAULT_PURCHASE_ACCOUNT_ID,
    purchase_description: "",
    purchase_tax_id: "",
    vendor_id: "",

    // Inventory
    track_inventory: false,

    // Associated Tags
    job_number: "",
    market_segment: "",
  };

  const [form, setForm] = useState(initialFormState);

  const unitOptions = [
    "", "box", "cm", "dz", "ft", "g", "in", "kg", "km", "lb",
    "mg", "ml", "m", "nos", "pcs", "qty", "set",
  ];

  useEffect(() => {
    async function fetchData() {
      try {
        const [taxRes, vendorsRes, accountsRes, tagsRes] = await Promise.all([
          fetch("/api/zoho/taxes").catch(() => null),
          fetch("/api/zoho/customers?limit=100").catch(() => null),
          fetch("/api/zoho/accounts").catch(() => null),
          fetch("/api/zoho/tags").catch(() => null),
        ]);
        if (taxRes && taxRes.ok) {
          const taxData = await taxRes.json();
          setTaxes(taxData.data || taxData || []);
        }
        if (vendorsRes && vendorsRes.ok) {
          const vendData = await vendorsRes.json();
          setVendors(vendData.data || []);
        }
        if (accountsRes && accountsRes.ok) {
          const accData = await accountsRes.json();
          if (accData?.data) {
            if (accData.data.salesAccounts?.length > 0) {
              setSalesAccounts(accData.data.salesAccounts);
            }
            if (accData.data.cogsAccounts?.length > 0) {
              setCogsAccounts(accData.data.cogsAccounts);
            }
            if (accData.data.expenseAccounts?.length > 0) {
              setExpenseAccounts(accData.data.expenseAccounts);
            }
          }
        }
        if (tagsRes && tagsRes.ok) {
          const tagsData = await tagsRes.json();
          if (tagsData?.data) {
            if (tagsData.data.jobNumberTag?.tag_options?.length > 0) {
              setJobNumberOptions(
                tagsData.data.jobNumberTag.tag_options.map((o) => o.tag_option_name)
              );
            }
            if (tagsData.data.marketSegmentTag?.tag_options?.length > 0) {
              setMarketSegmentOptions(
                tagsData.data.marketSegmentTag.tag_options.map((o) => o.tag_option_name)
              );
            }
          }
        }
      } catch (error) {
        console.error("Error fetching dependencies:", error);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    let ignore = false;
    if (editId) {
      fetch(`/api/zoho/items/${editId}`)
        .then((res) => res.json())
        .then((data) => {
          if (ignore) return;
          const itemData = data?.rawZohoData || data?.item || data;
          if (itemData) {
            // Check tags from existing item if available
            let itemJobNumber = "";
            let itemMarketSegment = "";
            if (Array.isArray(itemData.tags)) {
              const jobTag = itemData.tags.find((t) => t.tag_name === "Job Number");
              if (jobTag) itemJobNumber = jobTag.tag_option_name || "";
              const marketTag = itemData.tags.find((t) => t.tag_name === "Market Segment");
              if (marketTag) itemMarketSegment = marketTag.tag_option_name || "";
            }

            setForm((prev) => ({
              ...prev,
              name: itemData.name || "",
              product_type: itemData.product_type || "goods",
              unit: itemData.unit || "",
              sku: itemData.sku || "",
              is_sales:
                itemData.can_be_sold !== undefined
                  ? Boolean(itemData.can_be_sold)
                  : itemData.item_type !== "purchases",
              rate: itemData.rate !== undefined && itemData.rate !== null ? itemData.rate : "",
              description: itemData.description || "",
              tax_id: itemData.tax_id || "",
              account_id: itemData.account_id || DEFAULT_SALES_ACCOUNT_ID,
              is_purchase:
                itemData.can_be_purchased !== undefined
                  ? Boolean(itemData.can_be_purchased)
                  : itemData.item_type === "sales_and_purchases" ||
                    itemData.item_type === "purchases" ||
                    Boolean(itemData.purchase_rate || itemData.purchase_account_id),
              purchase_rate:
                itemData.purchase_rate !== undefined && itemData.purchase_rate !== null
                  ? itemData.purchase_rate
                  : "",
              purchase_description: itemData.purchase_description || "",
              purchase_tax_id: itemData.purchase_tax_id || "",
              purchase_account_id: itemData.purchase_account_id || DEFAULT_PURCHASE_ACCOUNT_ID,
              vendor_id: itemData.vendor_id || "",
              track_inventory: itemData.track_inventory || itemData.is_combo_product || false,
              job_number: itemJobNumber,
              market_segment: itemMarketSegment,
            }));
          }
        })
        .catch(() => {
          if (!ignore) toast.error("Failed to load item details");
        })
        .finally(() => {
          if (!ignore) setLoading(false);
        });
    }
    return () => {
      ignore = true;
    };
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
                  <AccountSelectDropdown
                    value={form.account_id}
                    onChange={(id) => setForm((prev) => ({ ...prev, account_id: id }))}
                    groups={[{ label: "Income", accounts: salesAccounts }]}
                    placeholder="[ 40-001 ] Sales"
                  />
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
                  <AccountSelectDropdown
                    value={form.purchase_account_id}
                    onChange={(id) => setForm((prev) => ({ ...prev, purchase_account_id: id }))}
                    groups={[
                      { label: "Cost Of Goods Sold", accounts: cogsAccounts },
                      { label: "Expense", accounts: expenseAccounts },
                    ]}
                    placeholder="[ 50-001 ] Direct Materials"
                  />
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
            <p className="text-xs text-gray-500 pl-6">You cannot enable/disable inventory tracking once you&apos;ve created transactions for this item</p>
          </div>

          <hr className="border-gray-200 mb-8" />

          {/* Associated Tags */}
          <div className="mb-8">
            <h3 className="text-base font-medium text-gray-800 mb-6">Associated Tags</h3>
            <div className="grid grid-cols-2 gap-12 pl-6">
              <div>
                <label className="block text-sm text-gray-700 mb-1.5">Job Number</label>
                <select name="job_number" value={form.job_number} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:border-blue-500 outline-none">
                  <option value="">Select Job Number</option>
                  {jobNumberOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1.5">Market Segment</label>
                <select name="market_segment" value={form.market_segment} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:border-blue-500 outline-none">
                  <option value="">Select Market Segment</option>
                  {marketSegmentOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
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
