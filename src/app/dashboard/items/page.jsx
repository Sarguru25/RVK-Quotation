"use client";

import { useEffect, useState } from "react";
import { Plus, Image as ImageIcon, CheckCircle, AlertCircle, Edit2, Trash2, Package, RefreshCcw } from "lucide-react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import toast from "react-hot-toast";
import DataTable from "@/app/components/DataTable";

export default function ItemsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const page = Number(searchParams.get("page")) || 1;
  const limit = Number(searchParams.get("limit")) || 20;
  const search = searchParams.get("search") || "";

  const [searchInput, setSearchInput] = useState(search);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== search) {
        updateUrlParams({ search: searchInput, page: 1 });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput, pathname, router, searchParams, search]);

  const updateUrlParams = (updates) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const { data: queryData, isLoading: loading, refetch: fetchItems } = useQuery({
    queryKey: ['items', page, limit, search],
    queryFn: async () => {
      const res = await fetch(`/api/zoho/items?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    placeholderData: keepPreviousData
  });

  const items = queryData?.data || [];
  const pagination = queryData?.pagination || { total: 0, page: 1, limit: 20 };

  async function handleDeleteItem(itemId) {
    try {
      const res = await fetch(`/api/zoho/items/${itemId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        toast.error(typeof data.error === "string" ? data.error : data.error?.message || "Failed to delete item");
        return;
      }
      toast.success("Item deleted successfully!");
      window.fetch('/api/sync/items', { method: 'POST', keepalive: true }).catch(() => {});
      setDeleteConfirm(null);
      fetchItems();
    } catch (error) {
      toast.error("An error occurred while deleting");
    }
  }

  const formatCurrency = (amount) => {
    const num = parseFloat(amount);
    if (isNaN(num)) return "0.00";
    return num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  if (loading && items.length === 0) {
    return (
      <div className="p-8 bg-white min-h-screen">
        <div className="flex items-center gap-3 mb-8">
          <div className="shimmer h-8 w-48 rounded-lg" />
          <div className="shimmer h-8 w-24 rounded-lg ml-auto" />
        </div>
        <div className="shimmer h-12 w-full rounded-xl mb-4" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="shimmer h-14 w-full rounded-xl mb-2" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto bg-white min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Package className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Items</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {pagination.total} item{pagination.total !== 1 ? "s" : ""} synced with Zoho Books
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => router.push('/dashboard/items/new')}
            className="btn-press flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium shadow-sm transition-colors"
          >
            <Plus size={16} />
            New Item
          </button>
          <button
            onClick={() => fetchItems()}
            className="btn-press flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
          >
            <RefreshCcw size={16} />
            Refresh
          </button>
        </div>
      </div>

      <div className="h-[600px]">
        <DataTable
          columns={[
            { label: "", className: "w-16" },
            { label: "Name" },
            { label: "Type" },
            { label: "SKU" },
            { label: "Description" },
            { label: "Selling Price", className: "text-right" },
            { label: "Purchase Rate", className: "text-right" },
            { label: "Actions", className: "text-center w-28" }
          ]}
          data={items}
          loading={loading}
          page={page}
          limit={limit}
          total={pagination.total}
          onPageChange={(p) => updateUrlParams({ page: p })}
          onLimitChange={(l) => updateUrlParams({ limit: l, page: 1 })}
          onSearch={(v) => setSearchInput(v)}
          searchValue={searchInput}
          emptyStateText="No items found"
          emptyStateSubtext="Try adjusting your search or create a new item"
          renderRow={(item) => (
            <tr key={item.item_id || item._id} className="table-row-hover hover:bg-slate-50/70 group">
              <td className="px-5 py-4">
                <div className="w-10 h-10 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center text-slate-400">
                  <ImageIcon className="w-5 h-5 opacity-50" />
                </div>
              </td>
              <td className="px-5 py-4">
                <button
                  onClick={() => router.push(`/dashboard/items/${item.item_id || item._id}`)}
                  className="text-blue-600 hover:text-blue-800 font-medium hover:underline text-left text-sm"
                >
                  {item.name}
                </button>
              </td>
              <td className="px-5 py-4">
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                  item.product_type === "service" ? "bg-purple-100 text-purple-700" : "bg-sky-100 text-sky-700"
                }`}>
                  {item.product_type || "goods"}
                </span>
              </td>
              <td className="px-5 py-4 text-sm text-slate-700">{item.sku || "—"}</td>
              <td className="px-5 py-4 text-sm text-slate-600 truncate max-w-[200px]" title={item.description}>
                {item.description || "—"}
              </td>
              <td className="px-5 py-4 text-sm text-slate-800 font-medium text-right whitespace-nowrap">
                ₹{formatCurrency(item.rate)}
              </td>
              <td className="px-5 py-4 text-sm text-slate-800 font-medium text-right whitespace-nowrap">
                ₹{formatCurrency(item.purchase_rate)}
              </td>
              <td className="px-5 py-4">
                <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => router.push(`/dashboard/items/new?edit=${item.item_id || item._id}`)}
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
          )}
        />
      </div>

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-[100]">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 animate-fade-in">
            <div className="px-6 py-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-800">Delete Item</h3>
                  <p className="text-sm text-gray-500">This action cannot be undone.</p>
                </div>
              </div>
              <p className="text-sm text-gray-700 mb-1">
                Are you sure you want to delete <strong>"{deleteConfirm.name}"</strong>?
              </p>
              <p className="text-xs text-gray-500">
                This will permanently remove the item from your Zoho Books account.
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
                onClick={() => handleDeleteItem(deleteConfirm.item_id || deleteConfirm._id)}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
