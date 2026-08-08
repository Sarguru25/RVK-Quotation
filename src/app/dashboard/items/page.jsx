"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  MoreHorizontal,
  List,
  Image as ImageIcon,
  ArrowUpDown,
  X,
  Search,
  RefreshCcw,
  Edit2,
  Trash2,
  Package,
  CheckCircle,
  AlertCircle,
  ChevronDown,
} from "lucide-react";

// Toast Component
function Toast({ message, type = "success", onClose }) {
  return (
    <div
      className={`fixed bottom-6 right-6 z-[200] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl text-sm font-medium transition-all animate-slide-up ${
        type === "success"
          ? "bg-emerald-600 text-white"
          : "bg-red-600 text-white"
      }`}
    >
      {type === "success" ? (
        <CheckCircle size={18} />
      ) : (
        <AlertCircle size={18} />
      )}
      {message}
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">
        <X size={14} />
      </button>
    </div>
  );
}

export default function ItemsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Form state
  const initialFormState = {
    name: "",
    product_type: "goods",
    unit: "",
    sku: "",
    rate: "",
    description: "",
    purchase_rate: "",
    purchase_description: "",
  };
  const [form, setForm] = useState(initialFormState);

  // Unit options
  const unitOptions = [
    "", "box", "cm", "dz", "ft", "g", "in", "kg", "km", "lb",
    "mg", "ml", "m", "nos", "pcs", "qty", "set",
  ];

  function showToast(message, type = "success") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/zoho/items");
      const response = await res.json();
      if (response.data && Array.isArray(response.data)) {
        setItems(response.data);
      } else {
        setItems(Array.isArray(response) ? response : []);
      }
    } catch (error) {
      console.error("Failed to fetch items:", error);
      showToast("Failed to fetch items", "error");
    } finally {
      setLoading(false);
    }
  };

  // Open create modal
  function openCreateModal() {
    setEditingItemId(null);
    setForm(initialFormState);
    setModalOpen(true);
  }

  // Open edit modal
  async function openEditModal(item) {
    setEditingItemId(item.item_id);
    try {
      const res = await fetch(`/api/zoho/items/${item.item_id}`);
      const fullItem = await res.json();
      if (fullItem) {
        setForm({
          name: fullItem.name || "",
          product_type: fullItem.product_type || "goods",
          unit: fullItem.unit || "",
          sku: fullItem.sku || "",
          rate: fullItem.rate || "",
          description: fullItem.description || "",
          purchase_rate: fullItem.purchase_rate || "",
          purchase_description: fullItem.purchase_description || "",
        });
      }
    } catch (e) {
      // Fallback to the list data
      setForm({
        name: item.name || "",
        product_type: item.product_type || "goods",
        unit: item.unit || "",
        sku: item.sku || "",
        rate: item.rate || "",
        description: item.description || "",
        purchase_rate: item.purchase_rate || "",
        purchase_description: item.purchase_description || "",
      });
    }
    setModalOpen(true);
  }

  // Save (create or update)
  async function handleSaveItem() {
    if (!form.name.trim()) {
      showToast("Item name is required", "error");
      return;
    }
    try {
      setSaving(true);
      const url = editingItemId
        ? `/api/zoho/items/${editingItemId}`
        : "/api/zoho/items/create";
      const method = editingItemId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        showToast(
          typeof data.error === "string"
            ? data.error
            : data.error?.message || "Failed to save item",
          "error"
        );
        return;
      }
      showToast(
        `Item ${editingItemId ? "updated" : "created"} successfully!`
      );
      setModalOpen(false);
      setEditingItemId(null);
      setForm(initialFormState);
      fetchItems();
    } catch (error) {
      showToast("An error occurred while saving", "error");
    } finally {
      setSaving(false);
    }
  }

  // Delete
  async function handleDeleteItem(itemId) {
    try {
      const res = await fetch(`/api/zoho/items/${itemId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        showToast(
          typeof data.error === "string"
            ? data.error
            : data.error?.message || "Failed to delete item",
          "error"
        );
        return;
      }
      showToast("Item deleted successfully!");
      setDeleteConfirm(null);
      fetchItems();
    } catch (error) {
      showToast("An error occurred while deleting", "error");
    }
  }

  // Handle form changes
  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  // Filtered items
  const filteredItems = items.filter((item) => {
    const q = search.toLowerCase();
    return (
      (item.name || "").toLowerCase().includes(q) ||
      (item.sku || "").toLowerCase().includes(q) ||
      (item.description || "").toLowerCase().includes(q)
    );
  });

  const formatCurrency = (amount) => {
    const num = parseFloat(amount);
    if (isNaN(num)) return "0.00";
    return num.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div className="bg-white min-h-screen">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Package className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-800">Items</h1>
            <p className="text-xs text-gray-500">
              {items.length} items synced with Zoho Books
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={openCreateModal}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center text-sm font-medium transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4 mr-1.5" /> New Item
          </button>
          <button
            onClick={fetchItems}
            className="flex items-center gap-1.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <RefreshCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="px-6 py-3 border-b border-gray-100">
        <div className="relative max-w-sm">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <th className="px-4 py-3 w-16"></th>
              <th className="px-4 py-3">
                <div className="flex items-center gap-1 cursor-pointer hover:text-gray-700">
                  NAME <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="px-4 py-3">TYPE</th>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">DESCRIPTION</th>
              <th className="px-4 py-3 text-right">SELLING PRICE</th>
              <th className="px-4 py-3 text-right">PURCHASE RATE</th>
              <th className="px-4 py-3 text-center w-28">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan="8" className="text-center py-16 text-gray-500">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <span className="font-medium">
                      Fetching items from Zoho Books...
                    </span>
                  </div>
                </td>
              </tr>
            ) : filteredItems.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center py-16 text-gray-500">
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                      <Package className="w-6 h-6 text-gray-400" />
                    </div>
                    <span className="font-medium">
                      {search
                        ? "No items match your search."
                        : "No items found."}
                    </span>
                    {!search && (
                      <p className="text-sm text-gray-400 mt-1">
                        Click "New Item" to create your first item.
                      </p>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredItems.map((item, index) => (
                <tr
                  key={item.item_id || index}
                  className="hover:bg-blue-50/30 transition-colors group"
                >
                  <td className="px-4 py-4">
                    <div className="w-10 h-10 bg-gray-50 border border-gray-200 rounded flex items-center justify-center text-gray-400">
                      <ImageIcon className="w-5 h-5 opacity-50" />
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm">
                    <button
                      onClick={() => window.location.href = `/dashboard/items/${item.item_id || item._id}`}
                      className="text-blue-600 hover:text-blue-800 font-medium hover:underline text-left"
                    >
                      {item.name}
                    </button>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600 capitalize">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        item.product_type === "service"
                          ? "bg-purple-50 text-purple-700"
                          : "bg-sky-50 text-sky-700"
                      }`}
                    >
                      {item.product_type || "goods"}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700">
                    {item.sku || "—"}
                  </td>
                  <td
                    className="px-4 py-4 text-sm text-gray-600 truncate max-w-[200px]"
                    title={item.description}
                  >
                    {item.description || "—"}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-800 text-right font-medium whitespace-nowrap">
                    ₹{formatCurrency(item.rate)}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-800 text-right font-medium whitespace-nowrap">
                    ₹{formatCurrency(item.purchase_rate)}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEditModal(item)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(item)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-start overflow-auto z-[100] pt-8 pb-8">
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl relative animate-fade-in mx-4">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">
                {editingItemId ? "Edit Item" : "New Item"}
              </h2>
              <button
                onClick={() => {
                  setModalOpen(false);
                  setEditingItemId(null);
                  setForm(initialFormState);
                }}
                className="p-1.5 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-red-500 mb-1.5">
                    Name*
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Item name"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Type
                  </label>
                  <div className="flex items-center gap-4 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="product_type"
                        value="goods"
                        checked={form.product_type === "goods"}
                        onChange={handleChange}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm text-gray-700">Goods</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="product_type"
                        value="service"
                        checked={form.product_type === "service"}
                        onChange={handleChange}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm text-gray-700">Service</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Unit
                  </label>
                  <div className="relative">
                    <select
                      name="unit"
                      value={form.unit}
                      onChange={handleChange}
                      className="appearance-none w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 pr-8 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
                    >
                      <option value="">Select or type to add</option>
                      {unitOptions
                        .filter((u) => u)
                        .map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    SKU
                  </label>
                  <input
                    type="text"
                    name="sku"
                    value={form.sku}
                    onChange={handleChange}
                    placeholder="Stock Keeping Unit"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-5 py-3 border-b border-gray-200 flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-600 rounded flex items-center justify-center">
                    <CheckCircle className="w-3 h-3 text-white" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-800">
                    Sales Information
                  </h3>
                </div>
                <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-red-500 mb-1.5">
                      Selling Price*
                    </label>
                    <div className="flex items-center gap-0">
                      <span className="bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg px-3 py-2.5 text-sm text-gray-500 font-medium">
                        INR
                      </span>
                      <input
                        type="number"
                        name="rate"
                        value={form.rate}
                        onChange={handleChange}
                        step="any"
                        placeholder="0.00"
                        className="w-full border border-gray-300 rounded-r-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div></div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={form.description}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Sales description..."
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 resize-none"
                    />
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-5 py-3 border-b border-gray-200 flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-600 rounded flex items-center justify-center">
                    <CheckCircle className="w-3 h-3 text-white" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-800">
                    Purchase Information
                  </h3>
                </div>
                <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-red-500 mb-1.5">
                      Cost Price*
                    </label>
                    <div className="flex items-center gap-0">
                      <span className="bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg px-3 py-2.5 text-sm text-gray-500 font-medium">
                        INR
                      </span>
                      <input
                        type="number"
                        name="purchase_rate"
                        value={form.purchase_rate}
                        onChange={handleChange}
                        step="any"
                        placeholder="0.00"
                        className="w-full border border-gray-300 rounded-r-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div></div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Description
                    </label>
                    <textarea
                      name="purchase_description"
                      value={form.purchase_description}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Purchase description..."
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex items-center gap-3 bg-gray-50 rounded-b-xl">
              <button
                onClick={handleSaveItem}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save"
                )}
              </button>
              <button
                onClick={() => {
                  setModalOpen(false);
                  setEditingItemId(null);
                  setForm(initialFormState);
                }}
                className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-5 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-[100]">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 animate-fade-in">
            <div className="px-6 py-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-800">
                    Delete Item
                  </h3>
                  <p className="text-sm text-gray-500">
                    This action cannot be undone.
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-700 mb-1">
                Are you sure you want to delete{" "}
                <strong>"{deleteConfirm.name}"</strong>?
              </p>
              <p className="text-xs text-gray-500">
                This will permanently remove the item from your Zoho Books
                account.
              </p>
            </div>
            <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-end gap-3 bg-gray-50 rounded-b-xl">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteItem(deleteConfirm.item_id)}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
