"use client";

import { useEffect, useState, useRef } from "react";
import { RefreshCcw, Plus, X, Trash2, Edit, FileText, Search, ChevronRight, AlertCircle, ListPlus, DownloadCloud } from "lucide-react";
import Link from "next/link";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import toast from "react-hot-toast";
import DataTable from "@/app/components/DataTable";

const STATUS_STYLES = {
  draft: "bg-amber-100 text-amber-700 border border-amber-200",
  sent: "bg-blue-100 text-blue-700 border border-blue-200",
  accepted: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  declined: "bg-red-100 text-red-700 border border-red-200",
  expired: "bg-slate-100 text-slate-600 border border-slate-200",
};

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

function TextAreaField({ label, ...props }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      <textarea
        {...props}
        className="input-field w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 bg-slate-50 focus:bg-white resize-none"
        rows={3}
      />
    </div>
  );
}

import { useSession } from "next-auth/react";
import { PERMISSIONS, hasPermission } from "@/lib/rbac/permissions";

function SearchableSelect({ options, value, onChange, placeholder, className }) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(o => o.value === value);
  const displayValue = isOpen ? query : (selectedOption ? selectedOption.label : "");

  const filtered = options.filter(o => (o.label || "").toLowerCase().includes((query || "").toLowerCase()));

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <input
        type="text"
        className={className || "w-full border border-gray-300 rounded-md text-sm px-3 py-2 text-gray-700 bg-white focus:border-blue-500 outline-none"}
        placeholder={placeholder}
        value={displayValue}
        onChange={e => {
          setQuery(e.target.value);
          if (!isOpen) setIsOpen(true);
        }}
        onClick={() => {
          setQuery("");
          setIsOpen(true);
        }}
      />
      {isOpen && (
        <div className="absolute z-[100] w-full h-40 mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto divide-y divide-gray-100">
          {filtered.length > 0 ? filtered.map((o, idx) => (
            <div
              key={`${o.value}-${idx}`}
              className="px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 text-gray-700 text-left flex items-center justify-between"
              onClick={() => {
                onChange(o.value);
                setQuery("");
                setIsOpen(false);
              }}
            >
              <div>
                <div className="font-medium text-gray-800">{o.label}</div>
                {o.isItem && (
                  <div className="text-xs text-gray-500 mt-0.5">Rate: ₹{parseFloat(o.rate || 0).toFixed(2)}</div>
                )}
              </div>
              {o.isItem && (
                <div className="text-right">
                  <div className="text-xs text-gray-500 font-normal">Available for Sale</div>
                  <div className="text-xs font-semibold text-gray-800 mt-0.5">{o.availableForSale} {o.unit}</div>
                </div>
              )}
            </div>
          )) : (
            <div className="px-3 py-2 text-sm text-gray-500 text-left">No results found</div>
          )}
        </div>
      )}
    </div>
  );
}

export default function QuotationsPage() {
  const { data: session } = useSession();
  const userPermissions = session?.user?.permissions || [];
  const canCreate = hasPermission(userPermissions, PERMISSIONS.QUOTATION.CREATE);
  const canEdit = hasPermission(userPermissions, PERMISSIONS.QUOTATION.EDIT);
  const canDelete = hasPermission(userPermissions, PERMISSIONS.QUOTATION.DELETE);

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  function showToast(message, type = "success") {
    if (type === "error") {
      toast.error(message);
    } else {
      toast.success(message);
    }
  }

  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const page = Number(searchParams.get("page")) || 1;
  const limit = Number(searchParams.get("limit")) || 20;
  const search = searchParams.get("search") || "";
  const statusFilter = searchParams.get("status") || "all";

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

  const { data: queryData, isLoading: loading, refetch: fetchQuotes } = useQuery({
    queryKey: ['quotations', page, limit, search, statusFilter],
    queryFn: async () => {
      const res = await fetch(`/api/zoho/quotes?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}&status=${statusFilter}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    placeholderData: keepPreviousData
  });

  const { data: customersData } = useQuery({
    queryKey: ['customers-list'],
    queryFn: async () => {
      const res = await fetch(`/api/zoho/customers?limit=1000`);
      if (!res.ok) throw new Error("Failed to fetch customers");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: usersData } = useQuery({
    queryKey: ['users-list'],
    queryFn: async () => {
      const res = await fetch(`/api/users`);
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: itemsData } = useQuery({
    queryKey: ['items-list'],
    queryFn: async () => {
      const res = await fetch(`/api/zoho/items`);
      if (!res.ok) throw new Error("Failed to fetch items");
      const json = await res.json();
      return json.data ? json.data : json;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: taxesData } = useQuery({
    queryKey: ['taxes-list'],
    queryFn: async () => {
      const res = await fetch(`/api/zoho/taxes`);
      if (!res.ok) throw new Error("Failed to fetch taxes");
      const json = await res.json();
      return json.data ? json.data : json;
    },
    staleTime: 5 * 60 * 1000,
  });

  const quotes = queryData?.data || [];
  const customers = customersData?.data || [];
  const users = usersData || [];
  const items = itemsData || [];
  const taxes = taxesData || [];
  const pagination = queryData?.pagination || { total: 0, page: 1, limit: 20 };

  const initialFormState = {
    customer_id: "",
    customer_name: "",
    estimate_number: "",
    reference_number: "",
    subject: "",
    date: new Date().toISOString().split("T")[0],
    expiry_date: "",
    notes: "We thank you for your enquiry and look forward for your confirmation of order.",
    terms: ` Price: Quoted in SGD, DAP Singapore.

(Quoted prices are based on current raw material costs and prevailing exchange rates. Should raw material prices increase by more than 7%, or currency exchange rates fluctuate by more than 3% from the base rates at the time of quotation, the Seller reserves the right to revise the quoted prices accordingly.)

Delivery: 6 to 8 Weeks from the date of approval of GAD.

Payment: 30% Advance and balance before dispatch.

Warranty: 12 months from the date of Installation or 18 months from the date of Supply, whichever is earlier.

Technical Submittals: 
1. GAD
2. MTC

Note: 
1. Please contact us before issuing PO in case of changes to the specifications or quantity.
2. Any additional documents will be charged separately.

This is a computer-generated document; therefore, no signature is required.
`,
    discount_value: 0,
    discount_type: "percent",
    shipping_charges: 0,
    adjustment: 0,
    line_items: [{ item_id: "", name: "", description: "", quantity: 1, rate: 0, tax_id: "" }],
    salesperson: "",
    estimated_margin: "",
    epc_customer: "",
    project: "",
    end_user: "",
    market_segment: "",
  };

  const [form, setForm] = useState(initialFormState);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  function showToast(message, type = "success") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }





  // Helper to get tax percentage from tax_id
  function getTaxPercentage(taxId) {
    if (!taxId) return 0;
    const tax = taxes.find(t => (t.zoho_tax_id || t.tax_id || t._id) === taxId);
    return tax ? tax.tax_percentage : 0;
  }

  useEffect(() => {

    // Check for pending items from Actuators conversion
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("new") === "true") {
      const pendingItems = localStorage.getItem("pending_quotation_items");
      const prefillCustomerId = urlParams.get("customerId");

      if (pendingItems) {
        try {
          const items = JSON.parse(pendingItems);
          setForm(prev => ({
            ...prev,
            line_items: items,
            customer_id: prefillCustomerId || prev.customer_id
          }));
          if (canCreate) {
            setOpen(true);
          }
          localStorage.removeItem("pending_quotation_items");
          window.history.replaceState({}, '', '/dashboard/quotations');
        } catch (e) {
          console.error("Failed to load pending quotation items:", e);
        }
      } else if (prefillCustomerId) {
        setForm(prev => ({
          ...prev,
          customer_id: prefillCustomerId
        }));
        if (canCreate) {
          setOpen(true);
        }
        window.history.replaceState({}, '', '/dashboard/quotations');
      } else if (canCreate) {
        setOpen(true);
        window.history.replaceState({}, '', '/dashboard/quotations');
      }
    }
  }, [canCreate]);

  useEffect(() => {
    if (open && form.customer_id && !form.customer_name && customers.length > 0) {
      const cust = customers.find(c => (c.zoho_customer_id || c._id) === form.customer_id);
      if (cust) {
        setForm(prev => ({ ...prev, customer_name: cust.customer_name || cust.contact_name || "" }));
      }
    }
  }, [open, customers, form.customer_id, form.customer_name]);

  const formatDate = (date) => {
    if (!date) return "—";
    const dateStr = date.split("T")[0];
    const [y, m, d] = dateStr.split("-");
    return `${d}/${m}/${y}`;
  };

  const formatCurrency = (amount, currencyCode = "INR") =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: currencyCode }).format(amount || 0);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleItemChange(index, field, value) {
    const updated = [...form.line_items];
    updated[index][field] = (field === "quantity" || field === "rate") ? Number(value) : value;
    setForm((prev) => ({ ...prev, line_items: updated }));
  }

  function addRow() {
    setForm((prev) => ({
      ...prev,
      line_items: [...prev.line_items, { item_id: "", name: "", description: "", quantity: 1, rate: 0, tax_id: prev.default_tax_id || "" }],
    }));
  }

  function removeRow(index) {
    setForm((prev) => ({
      ...prev,
      line_items: prev.line_items.filter((_, i) => i !== index),
    }));
  }

  // Computed totals
  const subTotal = form.line_items.reduce((acc, item) => acc + item.quantity * item.rate, 0);
  const discountVal = parseFloat(form.discount_value) || 0;
  const discountAmount = form.discount_type === "percent" ? (subTotal * discountVal) / 100 : discountVal;
  const afterDiscount = subTotal - discountAmount;
  const taxTotal = form.line_items.reduce((acc, item) => {
    const lineAmount = item.quantity * item.rate;
    const taxPct = getTaxPercentage(item.tax_id);
    const lineTax = (lineAmount * taxPct) / 100;
    return acc + lineTax;
  }, 0);
  const shippingCharges = parseFloat(form.shipping_charges) || 0;
  const adjustment = parseFloat(form.adjustment) || 0;
  const total = afterDiscount + taxTotal + shippingCharges + adjustment;

  async function handleSaveQuotation(actionType = 'draft') {
    if (!form.customer_id) { showToast("Please select a customer", "error"); return; }
    try {
      setSaving(true);
      const url = editingId ? `/api/zoho/quotes/${editingId}` : "/api/zoho/quotes/create";
      const method = editingId ? "PUT" : "POST";

      const isSubmit = actionType !== 'draft';

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, actionType, isSubmit }),
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        showToast(data.error || "Failed to save", "error");
        return;
      }
      showToast(`Quotation ${editingId ? "updated" : "created"} successfully!`);
      setOpen(false);
      setEditingId(null);
      setForm(initialFormState);
      fetchQuotes();
    } catch (err) {
      console.error(err);
      showToast("Something went wrong", "error");
    } finally {
      setSaving(false);
    }
  }

  async function deleteQuotation(id) {
    if (!window.confirm("Delete this quotation? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/zoho/quotes/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || data.success === false) { showToast(data.error || "Failed to delete", "error"); return; }
      showToast("Quotation deleted successfully");
      window.fetch('/api/sync/quotations', { method: 'POST', keepalive: true }).catch(() => {});
      fetchQuotes();
    } catch { showToast("Something went wrong", "error"); }
  }

  function openEditModal(quote, isClone = false) {
    const id = quote.zoho_estimate_id || quote.estimate_id || quote._id;
    if (isClone) {
      router.push(`/dashboard/quotations/new?clone=${id}`);
    } else {
      router.push(`/dashboard/quotations/new?edit=${id}`);
    }
  }
  const filtered = quotes.filter(
    (q) => {
      const matchesSearch =
        q.estimate_number?.toLowerCase().includes(search.toLowerCase()) ||
        q.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
        q.reference_number?.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = statusFilter === "all" || q.status === statusFilter;

      return matchesSearch && matchesStatus;
    }
  );

  if (loading) {
    return (
      <div className="p-8">
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
    <div className="p-6 md:p-8 max-w-7xl mx-auto">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quotations</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {quotes.length} quotation{quotes.length !== 1 ? "s" : ""} from Zoho
          </p>
        </div>
        <div className="flex gap-2">
          {canCreate && (
            <button
              onClick={() => router.push('/dashboard/quotations/new')}
              className="btn-press flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium shadow-sm shadow-indigo-200 transition-colors"
            >
              <Plus size={16} />
              New Quotation
            </button>
          )}
          <button
            onClick={() => fetchQuotes(true)}
            className="btn-press flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
            title="Fetch all quotations from Zoho Books"
          >
            <DownloadCloud size={16} />
            Full Fetch
          </button>
          <button
            onClick={() => fetchQuotes(false)}
            className="btn-press flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
          >
            <RefreshCcw size={16} />
            Refresh
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-5">
        <select
          value={statusFilter}
          onChange={(e) => updateUrlParams({ status: e.target.value, page: 1 })}
          className="w-full sm:w-48 px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white text-slate-800 outline-none focus:border-indigo-500"
        >
          <option value="all">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="accepted">Accepted</option>
          <option value="declined">Declined</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      <div className="h-[600px]">
        <DataTable
          columns={[
            { label: "Date" },
            { label: "Quote No." },
            { label: "Ref No." },
            { label: "Customer" },
            { label: "Status" },
            { label: "Amount", className: "text-right" },
            { label: "Actions", className: "text-center" }
          ]}
          data={quotes}
          loading={loading}
          page={page}
          limit={limit}
          total={pagination.total}
          onPageChange={(p) => updateUrlParams({ page: p })}
          onLimitChange={(l) => updateUrlParams({ limit: l, page: 1 })}
          onSearch={(v) => setSearchInput(v)}
          searchValue={searchInput}
          emptyStateText="No quotations found"
          emptyStateSubtext="Try adjusting your search or create a new quotation"
          renderRow={(q) => {
            const id = q.zoho_estimate_id || q.estimate_id || q._id;
            return (
              <tr key={id} className="table-row-hover hover:bg-slate-50/70 group">
                <td className="px-5 py-4 text-slate-500 text-xs">{formatDate(q.date)}</td>
                <td className="px-5 py-4">
                  <Link
                    href={`/dashboard/quotations/${id}`}
                    className="flex items-center gap-1 font-semibold text-indigo-600 hover:text-indigo-800 group-hover:underline"
                  >
                    <FileText size={13} className="flex-shrink-0" />
                    {q.estimate_number}
                    <ChevronRight size={13} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </td>
                <td className="px-5 py-4 text-slate-600">{q.reference_number || "—"}</td>
                <td className="px-5 py-4">
                  <div className="font-medium text-slate-800">{q.customer_name}</div>
                </td>
                <td className="px-5 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[q.status] || STATUS_STYLES.draft}`}>
                    {q.status}
                  </span>
                </td>
                <td className="px-5 py-4 text-right font-semibold text-slate-800">
                  {formatCurrency(q.total, q.currency_code || q.rawZohoData?.currency_code)}
                </td>
                <td className="px-5 py-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    {canEdit && (q.status?.toLowerCase() === 'draft' || q.status?.toLowerCase() === 'pending_approval' || q.status?.toLowerCase() === 'pending approval') && (
                      <button
                        onClick={() => openEditModal(q)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        title="Edit"
                      >
                        <Edit size={15} />
                      </button>
                    )}
                    {canEdit && (
                      <button
                        onClick={() => openEditModal(q, true)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-green-600 hover:bg-green-50 transition-colors"
                        title="Clone"
                      >
                        <svg className="w-[15px] h-[15px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => deleteQuotation(id)}
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