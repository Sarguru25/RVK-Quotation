"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import toast from "react-hot-toast";
import DataTable from "@/app/components/DataTable";
import { RefreshCcw, Plus, X, Trash2, Edit, Users, Search, AlertCircle, Mail, Phone, Building2, Eye } from "lucide-react";
import { useSession } from "next-auth/react";
import { PERMISSIONS, hasPermission } from "@/lib/rbac/permissions";

function InputField({ label, ...props }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      <input
        {...props}
        className="input-field w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 bg-slate-50 focus:bg-white"
      />
    </div>
  );
}

export default function CustomersPage() {
  const { data: session } = useSession();
  const userPermissions = session?.user?.permissions || [];
  const canCreate = hasPermission(userPermissions, PERMISSIONS.CUSTOMER.CREATE);
  const canEdit = hasPermission(userPermissions, PERMISSIONS.CUSTOMER.EDIT);
  const canDelete = hasPermission(userPermissions, PERMISSIONS.CUSTOMER.DELETE);

  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const page = Number(searchParams.get("page")) || 1;
  const limit = Number(searchParams.get("limit")) || 20;
  const search = searchParams.get("search") || "";

  const [searchInput, setSearchInput] = useState(search);

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      if (searchInput !== search) {
        if (searchInput) params.set("search", searchInput);
        else params.delete("search");
        params.set("page", "1");
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, pathname, router, searchParams, search]);

  const updateUrlParams = (updates) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "" || value === "all") params.delete(key);
      else params.set(key, value);
    });
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const { data: queryData, isLoading: loading, refetch: fetchCustomers } = useQuery({
    queryKey: ['customers', page, limit, search],
    queryFn: async () => {
      const res = await fetch(`/api/zoho/customers?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    placeholderData: keepPreviousData
  });

  const customers = queryData?.data || [];
  const pagination = queryData?.pagination || { total: 0, page: 1, limit: 20 };

  function showToast(message, type = "success") {
    if (type === "error") {
      toast.error(message);
    } else {
      toast.success(message);
    }
  }
  async function deleteCustomer(id) {
    if (!window.confirm("Delete this customer? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/zoho/customers/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || data.success === false) { showToast(data.error || "Failed to delete", "error"); return; }
      showToast("Customer deleted successfully");
      fetchCustomers();
    } catch { showToast("Something went wrong", "error"); }
  }


  function getInitials(name) {
    return (name || "?").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  }

  const AVATAR_COLORS = [
    "bg-violet-500", "bg-blue-500", "bg-emerald-500", "bg-amber-500",
    "bg-rose-500", "bg-indigo-500", "bg-teal-500", "bg-orange-500",
  ];
  function avatarColor(name) {
    const idx = (name?.charCodeAt(0) || 0) % AVATAR_COLORS.length;
    return AVATAR_COLORS[idx];
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Customers</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {customers.length} customer{customers.length !== 1 ? "s" : ""} from Zoho
          </p>
        </div>
        <div className="flex gap-2">
          {canCreate && (
            <Link
              href="/dashboard/customers/new"
              className="btn-press flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium shadow-sm shadow-indigo-200 transition-colors"
            >
              <Plus size={16} /> New Customer
            </Link>
          )}
          <button
            onClick={fetchCustomers}
            className="btn-press flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
          >
            <RefreshCcw size={16} /> Refresh
          </button>
        </div>
      </div>

      <div className="h-[600px]">
        <DataTable
          columns={[
            { label: "Customer" },
            { label: "Company" },
            { label: "Email" },
            { label: "Phone" },
            { label: "Actions", className: "text-center" }
          ]}
          data={customers}
          loading={loading}
          page={page}
          limit={limit}
          total={pagination.total}
          onPageChange={(p) => updateUrlParams({ page: p })}
          onLimitChange={(l) => updateUrlParams({ limit: l, page: 1 })}
          onSearch={(v) => setSearchInput(v)}
          searchValue={searchInput}
          emptyStateText="No customers found"
          emptyStateSubtext="Try adjusting your search or add a new customer"
          renderRow={(c) => {
            const id = c._id || c.zoho_customer_id || c.contact_id;
            const name = c.customer_name || c.contact_name || "";
            return (
              <tr
                key={id}
                className="table-row-hover hover:bg-indigo-50/50 cursor-pointer transition-colors"
                onClick={(e) => {
                  if (e.target.closest("button") || e.target.closest("a")) return;
                  router.push(`/dashboard/customers/${id}`);
                }}
              >
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full ${avatarColor(name)} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                      {getInitials(name)}
                    </div>
                    <span className="font-medium text-slate-800">{name}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  {c.company_name ? (
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <Building2 size={13} className="text-slate-400" />
                      {c.company_name}
                    </span>
                  ) : <span className="text-slate-300">—</span>}
                </td>
                <td className="px-5 py-3.5">
                  {c.email ? (
                    <a href={`mailto:${c.email}`} className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800" onClick={(e) => e.stopPropagation()}>
                      <Mail size={13} />
                      {c.email}
                    </a>
                  ) : <span className="text-slate-300">—</span>}
                </td>
                <td className="px-5 py-3.5">
                  {c.phone ? (
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <Phone size={13} className="text-slate-400" />
                      {c.phone}
                    </span>
                  ) : <span className="text-slate-300">—</span>}
                </td>
                <td className="px-5 py-3.5 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/customers/${id}`); }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                      title="View"
                    >
                      <Eye size={15} />
                    </button>
                    {canEdit && (
                      <button
                        onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/customers/${id}/edit`); }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        title="Edit"
                      >
                        <Edit size={15} />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteCustomer(id); }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          }}
        />
      </div>


    </div>
  );
}
