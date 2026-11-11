"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronDown, ArrowLeft, Building2, User, Info, Check, AlertCircle, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { COUNTRIES, getStatesForCountry } from "@/lib/data/countriesAndStates";

const MARKET_SEGMENT_ORDER = [
  "Oil & Gas",
  "Marine & Offshore",
  "Water & Waste Water Treatment",
  "General Industry",
  "HVAC",
  "Chemical & Petrochemical",
  "Pharmaceutical",
  "Mining",
  "Energy",
];

const MARKET_SEGMENT_FALLBACKS = [
  { value: "2315070000011469004", label: "Oil & Gas" },
  { value: "2315070000006075013", label: "Marine & Offshore" },
  { value: "2315070000006075015", label: "Water & Waste Water Treatment" },
  { value: "2315070000006075009", label: "General Industry" },
  { value: "2315070000011480003", label: "HVAC" },
  { value: "2315070000006075011", label: "Chemical & Petrochemical" },
  { value: "2315070000011480004", label: "Pharmaceutical" },
  { value: "2315070000011480005", label: "Mining" },
  { value: "2315070000006075017", label: "Energy" },
];

const JOB_NUMBER_FALLBACKS = [
  { value: "2315070000000236277", label: "SGS190010" },
  { value: "2315070000000236279", label: "SGS190011" },
  { value: "2315070000000236281", label: "SGS190014" },
  { value: "2315070000000236283", label: "SGS190015" },
  { value: "2315070000000230261", label: "SGS190016" },
  { value: "2315070000000230281", label: "SGS190017" },
  { value: "2315070000000230279", label: "SGS190018" },
  { value: "2315070000000253003", label: "SGS190019" },
  { value: "2315070000001611283", label: "SGS190040" },
];

function SearchableDropdown({ options, value, onChange, placeholder = "Select" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const selectedOption = options.find((o) => o.value === value);
  const filtered = options.filter((o) =>
    (o.label || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={`relative w-full ${isOpen ? "z-30" : "z-10"}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          setSearch("");
        }}
        className={`w-full bg-white border ${
          isOpen ? "border-blue-500 ring-1 ring-blue-500" : "border-gray-200"
        } rounded-lg px-3 py-2 text-sm text-gray-800 text-left flex items-center justify-between focus:outline-none transition-colors shadow-sm`}
      >
        <span className={selectedOption ? "text-gray-800 font-normal truncate" : "text-gray-400"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          size={14}
          className={`text-gray-400 pointer-events-none flex-shrink-0 ml-2 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-blue-500" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden animate-in fade-in-0 duration-100">
          <div className="p-2 border-b border-gray-100 bg-white">
            <div className="relative flex items-center">
              <Search size={14} className="absolute left-2.5 text-gray-400 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search"
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-blue-500 rounded-md text-gray-700 outline-none ring-1 ring-blue-500/20"
              />
            </div>
          </div>
          <div className="max-h-56 overflow-y-auto py-1 divide-y divide-gray-50">
            {value && !search && (
              <div
                onClick={() => {
                  onChange("");
                  setIsOpen(false);
                  setSearch("");
                }}
                className="px-3 py-1.5 text-xs text-gray-400 hover:text-red-500 hover:bg-red-50 cursor-pointer flex items-center justify-between"
              >
                <span>Clear selection</span>
              </div>
            )}
            {filtered.length > 0 ? (
              filtered.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <div
                    key={opt.value}
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                      setSearch("");
                    }}
                    className={`px-3 py-2 text-sm cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-blue-600 text-white font-medium"
                        : "text-gray-800 hover:bg-blue-50 hover:text-blue-600"
                    }`}
                  >
                    {opt.label}
                  </div>
                );
              })
            ) : (
              <div className="px-3 py-3 text-xs text-gray-400 text-center">No options found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function NewCustomerPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState("address");
  const [customBillingState, setCustomBillingState] = useState(false);
  const [customShippingState, setCustomShippingState] = useState(false);

  // Fetch Taxes
  const { data: taxesData } = useQuery({
    queryKey: ['taxes-list'],
    queryFn: async () => {
      const res = await fetch(`/api/zoho/taxes?limit=100`);
      if (!res.ok) throw new Error("Failed to fetch taxes");
      const json = await res.json();
      return json.data ? json.data : json;
    },
    staleTime: 5 * 60 * 1000,
  });
  const taxes = taxesData || [];

  // Fetch Reporting Tags
  const { data: tagsData } = useQuery({
    queryKey: ['reporting-tags'],
    queryFn: async () => {
      const res = await fetch('/api/zoho/tags');
      if (!res.ok) throw new Error("Failed to fetch tags");
      const json = await res.json();
      return json.data || null;
    },
    staleTime: 10 * 60 * 1000,
  });

  const jobNumberTag = tagsData?.jobNumberTag || null;
  const marketSegmentTag = tagsData?.marketSegmentTag || null;

  // Build sorted market segment options matching exact user sequence
  const serverMarketOptions = marketSegmentTag?.tag_options || [];
  const marketSegmentOptions = MARKET_SEGMENT_ORDER.map((name) => {
    const found = serverMarketOptions.find(
      (o) => (o.tag_option_name || "").trim().toLowerCase() === name.toLowerCase()
    );
    if (found) {
      return { value: found.tag_option_id, label: found.tag_option_name };
    }
    const fallback = MARKET_SEGMENT_FALLBACKS.find((f) => f.label.toLowerCase() === name.toLowerCase());
    return fallback || { value: name, label: name };
  });

  const jobNumberOptions = (jobNumberTag?.tag_options && jobNumberTag.tag_options.length > 0)
    ? jobNumberTag.tag_options.map((o) => ({ value: o.tag_option_id, label: o.tag_option_name }))
    : JOB_NUMBER_FALLBACKS;

  const [form, setForm] = useState({
    customer_sub_type: "business",
    salutation: "",
    first_name: "",
    last_name: "",
    company_name: "",
    contact_name: "",
    email: "",
    phone: "",
    mobile: "",
    language_code: "en",
    currency_code: "SGD",
    payment_terms: "100",
    enable_portal: false,
    registration_no: "",
    remarks: "",
    tax_id: "",
    company_id: "",
    job_number_tag_option_id: "",
    market_segment_tag_option_id: "",
    contact_persons: [{
        salutation: "",
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        mobile: ""
    }],
    billing_address: {
      attention: "",
      country: "",
      address: "",
      street2: "",
      city: "",
      state: "",
      zip: "",
      phone: "",
      fax: "",
    },
    shipping_address: {
      attention: "",
      country: "",
      address: "",
      street2: "",
      city: "",
      state: "",
      zip: "",
      phone: "",
      fax: "",
    },
  });

  const [copyBilling, setCopyBilling] = useState(false);

  const billingStates = getStatesForCountry(form.billing_address.country);
  const shippingStates = getStatesForCountry(form.shipping_address.country);

  function showToast(message, type = "success") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    const val = type === "checkbox" ? checked : value;
    
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setForm((prev) => {
        const newForm = { ...prev, [parent]: { ...prev[parent], [child]: val } };
        
        if (copyBilling && parent === "billing_address") {
          newForm.shipping_address = { ...newForm.billing_address };
        }
        
        return newForm;
      });
    } else {
      setForm((prev) => ({ ...prev, [name]: val }));
    }
  }

  function handleCountryChange(parent, newCountry) {
    const states = getStatesForCountry(newCountry);
    setForm((prev) => {
      const defaultState = (newCountry === "Singapore" && !prev[parent].state)
        ? "Singapore"
        : (states.includes(prev[parent].state) ? prev[parent].state : "");

      const newForm = {
        ...prev,
        [parent]: {
          ...prev[parent],
          country: newCountry,
          state: defaultState,
        }
      };

      if (copyBilling && parent === "billing_address") {
        newForm.shipping_address = { ...newForm.billing_address };
      }

      return newForm;
    });

    if (parent === "billing_address") {
      setCustomBillingState(false);
      if (copyBilling) setCustomShippingState(false);
    } else {
      setCustomShippingState(false);
    }
  }

  function handleContactPersonChange(index, field, value) {
    const newContacts = [...form.contact_persons];
    newContacts[index][field] = value;
    setForm({ ...form, contact_persons: newContacts });
  }

  function handleAddContactPerson() {
    setForm({
      ...form,
      contact_persons: [
        ...form.contact_persons,
        { salutation: "", first_name: "", last_name: "", email: "", phone: "", mobile: "" }
      ]
    });
  }

  function handleRemoveContactPerson(index) {
    const newContacts = [...form.contact_persons];
    newContacts.splice(index, 1);
    setForm({ ...form, contact_persons: newContacts });
  }

  function handleCopyBilling(e) {
    const checked = e.target.checked;
    setCopyBilling(checked);
    if (checked) {
      setForm(prev => ({
        ...prev,
        shipping_address: { ...prev.billing_address }
      }));
      setCustomShippingState(customBillingState);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.contact_name.trim()) {
      showToast("Display Name is required", "error");
      return;
    }

    try {
      setSaving(true);

      const tags = [];
      if (form.job_number_tag_option_id) {
        tags.push({
          tag_id: jobNumberTag?.tag_id || "2315070000000000333",
          tag_option_id: form.job_number_tag_option_id,
        });
      }
      if (form.market_segment_tag_option_id) {
        tags.push({
          tag_id: marketSegmentTag?.tag_id || "2315070000000000335",
          tag_option_id: form.market_segment_tag_option_id,
        });
      }

      const payload = {
        ...form,
        tags,
      };

      const res = await fetch("/api/zoho/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      
      if (!res.ok || data.success === false) {
        showToast(data.error || "Failed to save customer", "error");
        return;
      }
      
      showToast("Customer created successfully!");
      window.fetch('/api/sync/customers', { method: 'POST', keepalive: true }).catch(() => {});
      setTimeout(() => {
        router.push("/dashboard/customers");
      }, 1000);
    } catch (err) {
      showToast("Something went wrong", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-[#f9fafb] min-h-screen">
      {toast && (
        <div className={`fixed top-5 right-5 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-medium transition-all animate-in slide-in-from-top-2
          ${toast.type === "error" ? "bg-red-600 text-white" : "bg-slate-900 text-white"}`}>
          {toast.type === "error" ? <AlertCircle size={16} /> : <Check size={16} />}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/customers" className="text-gray-400 hover:text-gray-600 transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-xl font-semibold text-gray-800">New Customer</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard/customers" className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors">
              Cancel
            </Link>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-70 rounded-lg shadow-sm shadow-blue-200 transition-all active:scale-[0.98]"
            >
              {saving ? "Saving..." : "Save Customer"}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        
        {/* GST Prefill Banner */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-8 flex items-start gap-3">
          <Info size={18} className="text-blue-500 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            Prefill Customer details from the GST portal using the Customer's GSTIN. 
            <button className="text-blue-600 font-medium hover:underline ml-1">Prefill &gt;</button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">
          
          {/* Primary Details Section */}
          <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
            <h2 className="text-base font-semibold text-gray-800 mb-6 flex items-center gap-2">
              <User size={18} className="text-blue-500" />
              Primary Information
            </h2>
            
            <div className="grid grid-cols-12 gap-x-8 gap-y-6">
              
              {/* Customer Type */}
              <div className="col-span-12 flex items-center">
                <label className="w-48 text-sm font-medium text-gray-700 flex items-center gap-1">
                  Customer Type <Info size={14} className="text-gray-400" />
                </label>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="radio"
                      name="customer_sub_type"
                      value="business"
                      checked={form.customer_sub_type === "business"}
                      onChange={handleChange}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="text-sm text-gray-700 group-hover:text-gray-900">Business</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="radio"
                      name="customer_sub_type"
                      value="individual"
                      checked={form.customer_sub_type === "individual"}
                      onChange={handleChange}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="text-sm text-gray-700 group-hover:text-gray-900">Individual</span>
                  </label>
                </div>
              </div>

              {/* Primary Contact */}
              <div className="col-span-12 flex items-start">
                <label className="w-48 text-sm font-medium text-gray-700 mt-2 flex items-center gap-1">
                  Primary Contact <Info size={14} className="text-gray-400" />
                </label>
                <div className="flex-1 grid grid-cols-3 gap-4">
                  <div className="relative">
                    <select
                      name="salutation"
                      value={form.salutation}
                      onChange={handleChange}
                      className="w-full appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    >
                      <option value="">Salutation</option>
                      <option value="Mr.">Mr.</option>
                      <option value="Mrs.">Mrs.</option>
                      <option value="Ms.">Ms.</option>
                      <option value="Miss.">Miss.</option>
                      <option value="Dr.">Dr.</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                  <input
                    type="text"
                    name="first_name"
                    value={form.first_name}
                    onChange={handleChange}
                    placeholder="First Name"
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                  <input
                    type="text"
                    name="last_name"
                    value={form.last_name}
                    onChange={handleChange}
                    placeholder="Last Name"
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                </div>
              </div>

              {/* Company Name */}
              <div className="col-span-12 flex items-center">
                <label className="w-48 text-sm font-medium text-gray-700">Company Name</label>
                <div className="flex-1 max-w-md">
                  <input
                    type="text"
                    name="company_name"
                    value={form.company_name}
                    onChange={handleChange}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                </div>
              </div>

              {/* Display Name */}
              <div className="col-span-12 flex items-center">
                <label className="w-48 text-sm font-medium text-gray-700 flex items-center gap-1">
                  <span className="text-red-500">*</span> Display Name <Info size={14} className="text-gray-400" />
                </label>
                <div className="flex-1 max-w-md relative">
                  <input
                    type="text"
                    name="contact_name"
                    value={form.contact_name}
                    onChange={handleChange}
                    placeholder="Required"
                    required
                    className="w-full bg-white border border-red-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="col-span-12 flex items-center">
                <label className="w-48 text-sm font-medium text-gray-700 flex items-center gap-1">
                  Email Address <Info size={14} className="text-gray-400" />
                </label>
                <div className="flex-1 max-w-md">
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="col-span-12 flex items-start">
                <label className="w-48 text-sm font-medium text-gray-700 mt-2 flex items-center gap-1">
                  Phone <Info size={14} className="text-gray-400" />
                </label>
                <div className="flex-1 grid grid-cols-2 gap-4 max-w-xl">
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-200 bg-gray-50 text-gray-500 text-sm">
                      Work
                    </span>
                    <input
                      type="text"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      className="flex-1 w-full bg-white border border-gray-200 rounded-r-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    />
                  </div>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-200 bg-gray-50 text-gray-500 text-sm">
                      Mobile
                    </span>
                    <input
                      type="text"
                      name="mobile"
                      value={form.mobile}
                      onChange={handleChange}
                      className="flex-1 w-full bg-white border border-gray-200 rounded-r-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Customer Language */}
              <div className="col-span-12 flex items-center">
                <label className="w-48 text-sm font-medium text-gray-700 flex items-center gap-1">
                  Customer Language <Info size={14} className="text-gray-400" />
                </label>
                <div className="flex-1 max-w-xs relative">
                  <select
                    name="language_code"
                    value={form.language_code}
                    onChange={handleChange}
                    className="w-full appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>

            </div>
          </div>

          {/* Bottom Tabs */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-6 border-b border-gray-200 px-8 pt-4">
              {[
                { id: "other", label: "Other Details" },
                { id: "address", label: "Address" },
                { id: "contact_persons", label: "Contact Persons" },
                { id: "custom", label: "Custom Fields" },
                { id: "tags", label: "Reporting Tags" },
                { id: "remarks", label: "Remarks" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-800"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-8">
              {activeTab === "address" && (
                <div className="grid grid-cols-2 gap-12">
                  
                  {/* Billing Address */}
                  <div>
                    <h3 className="text-base font-semibold text-gray-800 mb-6">Billing Address</h3>
                    <div className="space-y-5">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1.5">Attention</label>
                        <input type="text" name="billing_address.attention" value={form.billing_address.attention} onChange={handleChange} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-blue-500 transition-colors" />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1.5">Country/Region</label>
                        <div className="relative">
                          <select
                            name="billing_address.country"
                            value={form.billing_address.country}
                            onChange={(e) => handleCountryChange("billing_address", e.target.value)}
                            className="w-full appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-blue-500 transition-colors"
                          >
                            <option value="">Select a Country</option>
                            {COUNTRIES.map((c) => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                            {form.billing_address.country && !COUNTRIES.includes(form.billing_address.country) && (
                              <option value={form.billing_address.country}>{form.billing_address.country}</option>
                            )}
                          </select>
                          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1.5">Address</label>
                        <textarea name="billing_address.address" value={form.billing_address.address} onChange={handleChange} rows="2" placeholder="Street 1" className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-blue-500 transition-colors mb-2 resize-none"></textarea>
                        <textarea name="billing_address.street2" value={form.billing_address.street2} onChange={handleChange} rows="2" placeholder="Street 2" className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-blue-500 transition-colors resize-none"></textarea>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1.5">City</label>
                        <input type="text" name="billing_address.city" value={form.billing_address.city} onChange={handleChange} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-blue-500 transition-colors" />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-sm text-gray-600">State</label>
                          {customBillingState ? (
                            <button
                              type="button"
                              onClick={() => setCustomBillingState(false)}
                              className="text-xs text-blue-600 hover:underline"
                            >
                              Choose from list
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setCustomBillingState(true)}
                              className="text-xs text-gray-400 hover:text-blue-600 hover:underline"
                            >
                              Enter manually
                            </button>
                          )}
                        </div>
                        {customBillingState ? (
                          <input
                            type="text"
                            name="billing_address.state"
                            value={form.billing_address.state}
                            onChange={handleChange}
                            placeholder="Type state name"
                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-blue-500 transition-colors"
                          />
                        ) : (
                          <div className="relative">
                            <select
                              name="billing_address.state"
                              value={form.billing_address.state}
                              onChange={(e) => {
                                if (e.target.value === "__custom__") {
                                  setCustomBillingState(true);
                                  setForm((prev) => ({
                                    ...prev,
                                    billing_address: { ...prev.billing_address, state: "" }
                                  }));
                                } else {
                                  handleChange(e);
                                }
                              }}
                              className="w-full appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-blue-500 transition-colors"
                            >
                              <option value="">{billingStates.length > 0 ? "Select a State" : (form.billing_address.country ? "Select a State" : "Select a country first")}</option>
                              {billingStates.map((st) => (
                                <option key={st} value={st}>{st}</option>
                              ))}
                              {form.billing_address.state && !billingStates.includes(form.billing_address.state) && (
                                <option value={form.billing_address.state}>{form.billing_address.state}</option>
                              )}
                              <option value="__custom__">+ Enter other state...</option>
                            </select>
                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1.5">Pin Code</label>
                        <input type="text" name="billing_address.zip" value={form.billing_address.zip} onChange={handleChange} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-blue-500 transition-colors" />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1.5">Phone</label>
                        <input type="text" name="billing_address.phone" value={form.billing_address.phone} onChange={handleChange} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-blue-500 transition-colors" />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1.5">Fax Number</label>
                        <input type="text" name="billing_address.fax" value={form.billing_address.fax} onChange={handleChange} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-blue-500 transition-colors" />
                      </div>
                    </div>
                  </div>

                  {/* Shipping Address */}
                  <div>
                    <h3 className="text-base font-semibold text-gray-800 mb-6 flex items-center justify-between">
                      Shipping Address
                      <label className="flex items-center gap-1.5 text-xs font-medium text-blue-600 cursor-pointer hover:underline">
                        <input 
                          type="checkbox" 
                          checked={copyBilling} 
                          onChange={handleCopyBilling}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                        />
                        Copy billing address
                      </label>
                    </h3>
                    <div className={`space-y-5 transition-opacity ${copyBilling ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1.5">Attention</label>
                        <input type="text" name="shipping_address.attention" value={form.shipping_address.attention} onChange={handleChange} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-blue-500 transition-colors" />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1.5">Country/Region</label>
                        <div className="relative">
                          <select
                            name="shipping_address.country"
                            value={form.shipping_address.country}
                            onChange={(e) => handleCountryChange("shipping_address", e.target.value)}
                            className="w-full appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-blue-500 transition-colors"
                          >
                            <option value="">Select a Country</option>
                            {COUNTRIES.map((c) => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                            {form.shipping_address.country && !COUNTRIES.includes(form.shipping_address.country) && (
                              <option value={form.shipping_address.country}>{form.shipping_address.country}</option>
                            )}
                          </select>
                          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1.5">Address</label>
                        <textarea name="shipping_address.address" value={form.shipping_address.address} onChange={handleChange} rows="2" placeholder="Street 1" className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-blue-500 transition-colors mb-2 resize-none"></textarea>
                        <textarea name="shipping_address.street2" value={form.shipping_address.street2} onChange={handleChange} rows="2" placeholder="Street 2" className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-blue-500 transition-colors resize-none"></textarea>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1.5">City</label>
                        <input type="text" name="shipping_address.city" value={form.shipping_address.city} onChange={handleChange} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-blue-500 transition-colors" />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-sm text-gray-600">State</label>
                          {customShippingState ? (
                            <button
                              type="button"
                              onClick={() => setCustomShippingState(false)}
                              className="text-xs text-blue-600 hover:underline"
                            >
                              Choose from list
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setCustomShippingState(true)}
                              className="text-xs text-gray-400 hover:text-blue-600 hover:underline"
                            >
                              Enter manually
                            </button>
                          )}
                        </div>
                        {customShippingState ? (
                          <input
                            type="text"
                            name="shipping_address.state"
                            value={form.shipping_address.state}
                            onChange={handleChange}
                            placeholder="Type state name"
                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-blue-500 transition-colors"
                          />
                        ) : (
                          <div className="relative">
                            <select
                              name="shipping_address.state"
                              value={form.shipping_address.state}
                              onChange={(e) => {
                                if (e.target.value === "__custom__") {
                                  setCustomShippingState(true);
                                  setForm((prev) => ({
                                    ...prev,
                                    shipping_address: { ...prev.shipping_address, state: "" }
                                  }));
                                } else {
                                  handleChange(e);
                                }
                              }}
                              className="w-full appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-blue-500 transition-colors"
                            >
                              <option value="">{shippingStates.length > 0 ? "Select a State" : (form.shipping_address.country ? "Select a State" : "Select a country first")}</option>
                              {shippingStates.map((st) => (
                                <option key={st} value={st}>{st}</option>
                              ))}
                              {form.shipping_address.state && !shippingStates.includes(form.shipping_address.state) && (
                                <option value={form.shipping_address.state}>{form.shipping_address.state}</option>
                              )}
                              <option value="__custom__">+ Enter other state...</option>
                            </select>
                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1.5">Pin Code</label>
                        <input type="text" name="shipping_address.zip" value={form.shipping_address.zip} onChange={handleChange} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-blue-500 transition-colors" />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1.5">Phone</label>
                        <input type="text" name="shipping_address.phone" value={form.shipping_address.phone} onChange={handleChange} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-blue-500 transition-colors" />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1.5">Fax Number</label>
                        <input type="text" name="shipping_address.fax" value={form.shipping_address.fax} onChange={handleChange} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-blue-500 transition-colors" />
                      </div>
                    </div>
                  </div>
                  
                </div>
              )}

              {activeTab === "other" && (
                <div className="max-w-2xl space-y-6">
                  <div className="flex items-center">
                    <label className="w-48 text-sm font-medium text-gray-700 flex items-center gap-1">Tax Rate</label>
                    <div className="flex-1 max-w-sm relative">
                      <select
                        name="tax_id"
                        value={form.tax_id}
                        onChange={handleChange}
                        className="w-full appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-blue-500 transition-colors"
                      >
                        <option value="">Select a Tax</option>
                        {taxes.map((t) => {
                          const tid = t.zoho_tax_id || t.tax_id || t._id;
                          return (
                            <option key={tid} value={tid}>
                              {t.tax_name} ({t.tax_percentage}%)
                            </option>
                          );
                        })}
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <p className="mt-1 text-xs text-gray-500">To associate more than one tax, you need to create a tax group in Settings.</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <label className="w-48 text-sm font-medium text-gray-700 flex items-center gap-1">Company ID <Info size={14} className="text-gray-400" /></label>
                    <input type="text" name="company_id" value={form.company_id} onChange={handleChange} className="flex-1 max-w-sm bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-blue-500 transition-colors" />
                  </div>
                  <div className="flex items-center">
                    <label className="w-48 text-sm font-medium text-gray-700">Currency</label>
                    <div className="flex-1 max-w-sm relative">
                      <select name="currency_code" value={form.currency_code} onChange={handleChange} className="w-full appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-blue-500 transition-colors">
                        <option value="SGD">SGD - Singapore Dollar</option>
                        <option value="INR">INR - Indian Rupee</option>
                        <option value="USD">USD - US Dollar</option>
                        <option value="EUR">EUR - Euro</option>
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  <div className="flex items-center">
                    <label className="w-48 text-sm font-medium text-gray-700">Payment Terms</label>
                    <div className="flex-1 max-w-sm relative">
                      <select name="payment_terms" value={form.payment_terms} onChange={handleChange} className="w-full appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-blue-500 transition-colors">
                        <option value="100">100% Advance</option>
                        <option value="15">Due on Receipt</option>
                        <option value="30">Net 30</option>
                        <option value="45">Net 45</option>
                        <option value="60">Net 60</option>
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  <div className="flex items-center">
                    <label className="w-48 text-sm font-medium text-gray-700 flex items-center gap-1">Enable Portal? <Info size={14} className="text-gray-400" /></label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" name="enable_portal" checked={form.enable_portal} onChange={handleChange} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <span className="text-sm text-gray-700">Allow portal access for this customer</span>
                    </label>
                  </div>
                  <div className="flex items-start mt-4">
                    <label className="w-48 text-sm font-medium text-gray-700 mt-2">Documents</label>
                    <div className="flex-1 max-w-sm">
                      <div className="border border-gray-200 rounded-lg bg-gray-50 flex items-center justify-center p-4 cursor-not-allowed opacity-70">
                        <span className="text-sm text-gray-500">Upload File (Supported after creation)</span>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">You can upload a maximum of 10 files, 10MB each (Save customer first).</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "custom" && (
                <div className="max-w-2xl space-y-6">
                  <div className="flex items-center">
                    <label className="w-48 text-sm font-medium text-gray-700 flex items-center gap-1">
                      <span className="text-red-500">*</span> Registration No
                    </label>
                    <input
                      type="text"
                      name="registration_no"
                      value={form.registration_no}
                      onChange={handleChange}
                      required
                      className="flex-1 max-w-sm bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>
              )}

              {activeTab === "remarks" && (
                <div className="max-w-2xl space-y-6">
                  <div className="flex items-start">
                    <label className="w-48 text-sm font-medium text-gray-700 mt-2">Remarks</label>
                    <textarea
                      name="remarks"
                      value={form.remarks}
                      onChange={handleChange}
                      rows="4"
                      className="flex-1 max-w-sm bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                    ></textarea>
                  </div>
                </div>
              )}

              {activeTab === "contact_persons" && (
                <div className="max-w-5xl space-y-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-gray-500 bg-gray-50 uppercase border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 min-w-[120px]">Salutation</th>
                          <th className="px-4 py-3 min-w-[150px]">First Name</th>
                          <th className="px-4 py-3 min-w-[150px]">Last Name</th>
                          <th className="px-4 py-3 min-w-[200px]">Email Address</th>
                          <th className="px-4 py-3 min-w-[150px]">Work Phone</th>
                          <th className="px-4 py-3 min-w-[150px]">Mobile</th>
                          <th className="px-4 py-3 w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {form.contact_persons.map((person, index) => (
                          <tr key={index} className="border-b border-gray-100">
                            <td className="p-2">
                              <select 
                                value={person.salutation} 
                                onChange={(e) => handleContactPersonChange(index, "salutation", e.target.value)}
                                className="w-full bg-white border border-gray-200 rounded px-2 py-1.5 focus:border-blue-500 outline-none"
                              >
                                <option value=""></option>
                                <option value="Mr.">Mr.</option>
                                <option value="Mrs.">Mrs.</option>
                                <option value="Ms.">Ms.</option>
                              </select>
                            </td>
                            <td className="p-2">
                              <input 
                                type="text" 
                                value={person.first_name} 
                                onChange={(e) => handleContactPersonChange(index, "first_name", e.target.value)}
                                className="w-full bg-white border border-gray-200 rounded px-2 py-1.5 focus:border-blue-500 outline-none"
                              />
                            </td>
                            <td className="p-2">
                              <input 
                                type="text" 
                                value={person.last_name} 
                                onChange={(e) => handleContactPersonChange(index, "last_name", e.target.value)}
                                className="w-full bg-white border border-gray-200 rounded px-2 py-1.5 focus:border-blue-500 outline-none"
                              />
                            </td>
                            <td className="p-2">
                              <input 
                                type="email" 
                                value={person.email} 
                                onChange={(e) => handleContactPersonChange(index, "email", e.target.value)}
                                className="w-full bg-white border border-gray-200 rounded px-2 py-1.5 focus:border-blue-500 outline-none"
                              />
                            </td>
                            <td className="p-2">
                              <input 
                                type="text" 
                                value={person.phone} 
                                onChange={(e) => handleContactPersonChange(index, "phone", e.target.value)}
                                className="w-full bg-white border border-gray-200 rounded px-2 py-1.5 focus:border-blue-500 outline-none"
                              />
                            </td>
                            <td className="p-2">
                              <input 
                                type="text" 
                                value={person.mobile} 
                                onChange={(e) => handleContactPersonChange(index, "mobile", e.target.value)}
                                className="w-full bg-white border border-gray-200 rounded px-2 py-1.5 focus:border-blue-500 outline-none"
                              />
                            </td>
                            <td className="p-2 text-center">
                              <button type="button" onClick={() => handleRemoveContactPerson(index)} className="text-red-400 hover:text-red-600">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <button type="button" onClick={handleAddContactPerson} className="text-blue-600 flex items-center gap-1 text-sm font-medium hover:underline bg-blue-50 px-3 py-1.5 rounded-lg w-fit">
                    + Add Contact Person
                  </button>
                </div>
              )}

              {activeTab === "tags" && (
                <div className="max-w-2xl space-y-6 min-h-[380px] pb-24">
                  {/* Job Number */}
                  <div className="flex items-center">
                    <label className="w-48 text-sm font-medium text-gray-700">Job Number</label>
                    <div className="flex-1 max-w-sm">
                      <SearchableDropdown
                        options={jobNumberOptions}
                        value={form.job_number_tag_option_id}
                        onChange={(val) => setForm((prev) => ({ ...prev, job_number_tag_option_id: val }))}
                        placeholder="Select"
                      />
                    </div>
                  </div>

                  {/* Market Segment */}
                  <div className="flex items-center">
                    <label className="w-48 text-sm font-medium text-gray-700">Market Segment</label>
                    <div className="flex-1 max-w-sm">
                      <SearchableDropdown
                        options={marketSegmentOptions}
                        value={form.market_segment_tag_option_id}
                        onChange={(val) => setForm((prev) => ({ ...prev, market_segment_tag_option_id: val }))}
                        placeholder="Select"
                      />
                    </div>
                  </div>
                </div>
              )}
              
            </div>
          </div>
          
        </form>
      </div>
    </div>
  );
}
