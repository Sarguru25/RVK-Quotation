"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronDown, ArrowLeft, Building2, User, Info, Check, AlertCircle } from "lucide-react";

export default function NewCustomerPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState("address");

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
    pan_no: "",
    currency_code: "INR",
    payment_terms: "15",
    enable_portal: false,
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

  function handleCopyBilling(e) {
    const checked = e.target.checked;
    setCopyBilling(checked);
    if (checked) {
      setForm(prev => ({
        ...prev,
        shipping_address: { ...prev.billing_address }
      }));
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
      const res = await fetch("/api/zoho/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      
      if (!res.ok || data.success === false) {
        showToast(data.error || "Failed to save customer", "error");
        return;
      }
      
      showToast("Customer created successfully!");
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
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
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
                          <select name="billing_address.country" value={form.billing_address.country} onChange={handleChange} className="w-full appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-blue-500 transition-colors">
                            <option value="">Select</option>
                            <option value="India">India</option>
                            <option value="USA">USA</option>
                            <option value="UK">UK</option>
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
                        <label className="block text-sm text-gray-600 mb-1.5">State</label>
                        <div className="relative">
                          <select name="billing_address.state" value={form.billing_address.state} onChange={handleChange} className="w-full appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-blue-500 transition-colors">
                            <option value="">Select or type to add</option>
                            <option value="Tamil Nadu">Tamil Nadu</option>
                            <option value="Karnataka">Karnataka</option>
                            <option value="Maharashtra">Maharashtra</option>
                            <option value="Delhi">Delhi</option>
                          </select>
                          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
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
                          <select name="shipping_address.country" value={form.shipping_address.country} onChange={handleChange} className="w-full appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-blue-500 transition-colors">
                            <option value="">Select</option>
                            <option value="India">India</option>
                            <option value="USA">USA</option>
                            <option value="UK">UK</option>
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
                        <label className="block text-sm text-gray-600 mb-1.5">State</label>
                        <div className="relative">
                          <select name="shipping_address.state" value={form.shipping_address.state} onChange={handleChange} className="w-full appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-blue-500 transition-colors">
                            <option value="">Select or type to add</option>
                            <option value="Tamil Nadu">Tamil Nadu</option>
                            <option value="Karnataka">Karnataka</option>
                            <option value="Maharashtra">Maharashtra</option>
                            <option value="Delhi">Delhi</option>
                          </select>
                          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
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
                    <label className="w-48 text-sm font-medium text-gray-700 flex items-center gap-1">PAN <Info size={14} className="text-gray-400" /></label>
                    <input type="text" name="pan_no" value={form.pan_no} onChange={handleChange} className="flex-1 max-w-sm bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-blue-500 transition-colors" />
                  </div>
                  <div className="flex items-center">
                    <label className="w-48 text-sm font-medium text-gray-700">Currency</label>
                    <div className="flex-1 max-w-sm relative">
                      <select name="currency_code" value={form.currency_code} onChange={handleChange} className="w-full appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-blue-500 transition-colors">
                        <option value="INR">INR - Indian Rupee</option>
                        <option value="USD">USD - US Dollar</option>
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  <div className="flex items-center">
                    <label className="w-48 text-sm font-medium text-gray-700">Payment Terms</label>
                    <div className="flex-1 max-w-sm relative">
                      <select name="payment_terms" value={form.payment_terms} onChange={handleChange} className="w-full appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-blue-500 transition-colors">
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
                </div>
              )}

              {["contact_persons", "custom", "tags", "remarks"].includes(activeTab) && (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                    <Info size={24} className="text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-medium">{activeTab.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} tab content goes here</p>
                  <p className="text-gray-400 text-sm mt-1">This section is available in the extended API.</p>
                </div>
              )}
              
            </div>
          </div>
          
        </form>
      </div>
    </div>
  );
}
