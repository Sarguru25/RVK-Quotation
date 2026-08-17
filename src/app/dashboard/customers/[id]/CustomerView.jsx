"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2, Phone, Mail, FileText, MapPin, User, Plus, FileSignature, Share2,
  Briefcase, Activity, Calendar, Clock, CheckCircle2, XCircle, ArrowRight
} from 'lucide-react';

export default function CustomerView({ customer, customerId }) {
  const [activeTab, setActiveTab] = useState('Overview');
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  // useEffect(() => {
  //   async function fetchAnalytics() {
  //     try {
  //       const res = await fetch(`/api/customers/${customerId}/analytics`);
  //       const data = await res.json();
  //       setAnalytics(data);
  //     } catch (error) {
  //       console.error("Failed to fetch analytics:", error);
  //     } finally {
  //       setLoading(false);
  //     }
  //   }
  //   fetchAnalytics();
  // }, [customerId]);

  const tabs = ['Overview',
    //  'Quotations', 'Visits', 'Activity'
  ];

  return (
    <div className="bg-white min-h-screen w-full font-sans text-gray-900 flex flex-col">
      {/* HEADER SECTION */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-gray-200">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-medium text-gray-900">{customer.company_name || customer.contact_name}</h1>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/dashboard/customers/${customerId}/edit`} className="px-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded hover:bg-gray-100 font-medium">
            Edit
          </Link>
          <button className="px-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded hover:bg-gray-100 font-medium flex items-center">
            <Share2 size={14} className="text-gray-600" />
          </button>
          <Link href={`/dashboard/quotations?new=true&customerId=${customerId}`} className="px-3 py-1.5 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded font-medium shadow-sm">
            New Transaction
          </Link>
          <button className="px-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded hover:bg-gray-100 font-medium">
            More ▾
          </button>
          <Link href="/dashboard/customers" className="p-1.5 text-gray-400 hover:bg-gray-100 rounded ml-2">
            <XCircle size={20} />
          </Link>
        </div>
      </div>

      {/* TABS */}
      <div className="px-6 pt-3 border-b border-gray-200 bg-white">
        <div className="flex space-x-6">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-2 text-sm font-medium transition-colors border-b-2 ${activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-gray-900'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* TAB CONTENT */}
      <div className="flex-1 bg-white overflow-y-auto">
        {activeTab === 'Overview' && (
          <div className="flex flex-col md:flex-row h-full">
            {/* Left Column - Details */}
            <div className="w-full md:w-[350px] shrink-0 border-r border-gray-200 bg-gray-50/30">
              <div className="p-4 border-b border-gray-200">
                <div className="text-sm font-medium text-gray-800 mb-3">{customer.company_name || customer.contact_name}</div>
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center shrink-0">
                    <User size={24} className="text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{customer.contact_name}</div>
                    <div className="text-xs text-gray-500 mb-2">{customer.email || 'No email provided'}</div>
                    <div className="flex gap-3 text-xs text-blue-600">
                      <button className="hover:underline">Invite to Portal</button>
                      <button className="hover:underline">Send Email</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* ADDRESS SECTION */}
              <div className="p-4 border-b border-gray-200">
                <div className="text-xs font-semibold text-gray-500 tracking-wider mb-3 flex justify-between items-center">
                  ADDRESS
                </div>
                
                <div className="mb-4">
                  <div className="text-xs text-gray-500 mb-1">Billing Address</div>
                  {customer.billing_address && (customer.billing_address.address || customer.billing_address.city) ? (
                    <p className="text-sm text-gray-800 leading-relaxed">
                      {customer.billing_address.attention && <>{customer.billing_address.attention}<br /></>}
                      {customer.billing_address.address && <>{customer.billing_address.address}<br /></>}
                      {[customer.billing_address.city, customer.billing_address.state].filter(Boolean).join(", ")}<br />
                      {[customer.billing_address.zip, customer.billing_address.country].filter(Boolean).join(" ")}
                    </p>
                  ) : <p className="text-sm text-gray-400 italic">No billing address</p>}
                </div>

                <div className="mb-3">
                  <div className="text-xs text-gray-500 mb-1">Shipping Address</div>
                  {customer.shipping_address && (customer.shipping_address.address || customer.shipping_address.city) ? (
                    <p className="text-sm text-gray-800 leading-relaxed">
                      {customer.shipping_address.attention && <>{customer.shipping_address.attention}<br /></>}
                      {customer.shipping_address.address && <>{customer.shipping_address.address}<br /></>}
                      {[customer.shipping_address.city, customer.shipping_address.state].filter(Boolean).join(", ")}<br />
                      {[customer.shipping_address.zip, customer.shipping_address.country].filter(Boolean).join(" ")}
                    </p>
                  ) : <p className="text-sm text-gray-400 italic">No shipping address</p>}
                </div>
                <button className="text-xs text-blue-600 hover:underline">Add additional address</button>
              </div>

              {/* OTHER DETAILS */}
              <div className="p-4">
                <div className="text-xs font-semibold text-gray-500 tracking-wider mb-4">
                  OTHER DETAILS
                </div>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <span className="text-xs text-gray-500 w-28">Customer Type</span>
                    <span className="text-sm text-gray-900">{customer.customer_sub_type || 'Business'}</span>
                  </div>
                  <div className="flex gap-4">
                    <span className="text-xs text-gray-500 w-28">Default Currency</span>
                    <span className="text-sm text-gray-900">{customer.currency_code || 'INR'}</span>
                  </div>
                  <div className="flex gap-4">
                    <span className="text-xs text-gray-500 w-28">Business Legal Name</span>
                    <span className="text-sm text-gray-900">{customer.company_name}</span>
                  </div>
                  <div className="flex gap-4">
                    <span className="text-xs text-gray-500 w-28">GST Treatment</span>
                    <span className="text-sm text-gray-900">{customer.gst_treatment || 'Registered Business - Regular'}</span>
                  </div>
                  <div className="flex gap-4">
                    <span className="text-xs text-gray-500 w-28">GSTIN</span>
                    <span className="text-sm text-gray-900">{customer.gst_no || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Financials */}
            <div className="flex-1 p-6">
              <div className="bg-blue-50/50 rounded p-3 text-sm text-blue-800 mb-8 border border-blue-100 flex items-center justify-between">
                <span>You can request your contact to directly update the GSTIN by sending an email. <button className="text-blue-600 hover:underline">Send email</button></span>
              </div>

              <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Payment due period</div>
                  <div className="text-sm text-gray-900">{customer.payment_terms_label || 'Due on Receipt'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Credit Limit</div>
                  <div className="text-sm text-gray-900">{customer.credit_limit || 'Unlimited'}</div>
                </div>
              </div>

              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Receivables</h3>
                <div className="border border-gray-200 rounded">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase">
                      <tr>
                        <th className="px-4 py-2 font-medium text-left">Currency</th>
                        <th className="px-4 py-2 font-medium text-right">Outstanding Receivables</th>
                        <th className="px-4 py-2 font-medium text-right">Unused Credits</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      <tr>
                        <td className="px-4 py-3 text-gray-700">{customer.currency_code || 'INR'}</td>
                        <td className="px-4 py-3 text-right text-blue-600">
                          {customer.currency_code === 'INR' ? '₹' : (customer.currency_symbol || '')}
                          {parseFloat(customer.outstanding_receivable_amount || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-700">
                          {customer.currency_code === 'INR' ? '₹' : (customer.currency_symbol || '')}
                          {parseFloat(customer.unused_credits_receivable_amount || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Visits' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Visit History</h3>
              <Link href={`/dashboard/visits/new?customerId=${customerId}`} className="text-sm text-blue-600 font-medium hover:underline flex items-center gap-1">
                <Plus size={16} /> Add Visit
              </Link>
            </div>

            {loading ? (
              <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
            ) : analytics?.recentActivities?.filter(a => a.type === 'visit').length > 0 ? (
              <div className="space-y-4">
                {analytics.recentActivities.filter(a => a.type === 'visit').map((visit, idx) => (
                  <div key={idx} className="flex gap-4 p-4 rounded-xl border border-gray-100 hover:shadow-md transition-shadow bg-gray-50/50">
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0">
                      <Briefcase size={20} />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-gray-900">{visit.title}</h4>
                          <p className="text-sm text-gray-500 mt-1">{visit.description}</p>
                          {visit.data.location?.address && (
                            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1"><MapPin size={12} /> {visit.data.location.address}</p>
                          )}
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-sm font-medium text-gray-900">{new Date(visit.date).toLocaleDateString('en-GB')}</span>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full mt-2 ${visit.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {visit.status}
                          </span>
                        </div>
                      </div>
                      {visit.data.reportDetails && (
                        <div className="mt-3 p-3 bg-white rounded border border-gray-100 text-sm text-gray-600">
                          {visit.data.reportDetails}
                        </div>
                      )}
                      <div className="mt-3 flex justify-end">
                        <Link href={`/dashboard/visits/${visit.data._id}/edit`} className="text-xs font-medium text-blue-600 hover:underline">Edit Details</Link>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="text-center pt-4">
                  <Link href="/dashboard/visits" className="text-sm font-medium text-blue-600 hover:underline">View All Visits in Module <ArrowRight size={14} className="inline" /></Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Briefcase size={48} className="mx-auto text-gray-300 mb-3" />
                <p>No visits recorded yet.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'Quotations' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Quotation History</h3>
              <Link href={`/dashboard/quotations?new=true&customerId=${customerId}`} className="text-sm text-blue-600 font-medium hover:underline flex items-center gap-1">
                <Plus size={16} /> Create Quote
              </Link>
            </div>

            {loading ? (
              <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
            ) : analytics?.recentActivities?.filter(a => a.type === 'quotation').length > 0 ? (
              <div className="space-y-4">
                {analytics.recentActivities.filter(a => a.type === 'quotation').map((quote, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:shadow-md transition-shadow bg-gray-50/50">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center">
                        <FileSignature size={18} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{quote.title}</h4>
                        <p className="text-sm text-gray-500 mt-0.5">{new Date(quote.date).toLocaleDateString('en-GB')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">₹{quote.data.total?.toFixed(2) || '0.00'}</p>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mt-1 inline-block
                          ${quote.status === 'accepted' ? 'bg-green-100 text-green-700' :
                            quote.status === 'declined' ? 'bg-red-100 text-red-700' :
                              'bg-yellow-100 text-yellow-700'}`}>
                          {quote.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <FileSignature size={48} className="mx-auto text-gray-300 mb-3" />
                <p>No quotations generated yet.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'Activity' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Timeline</h3>

            {loading ? (
              <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
            ) : analytics?.recentActivities?.length > 0 ? (
              <div className="relative border-l-2 border-gray-100 ml-4 space-y-8 pb-8">
                {analytics.recentActivities.map((activity, idx) => (
                  <div key={idx} className="relative pl-6">
                    <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white ${activity.type === 'visit' ? 'bg-blue-500' : 'bg-purple-500'}`}></div>
                    <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-semibold text-gray-900">{activity.title}</h4>
                        <span className="text-xs font-medium text-gray-500">{new Date(activity.date).toLocaleDateString('en-GB')}</span>
                      </div>
                      <p className="text-sm text-gray-600">{activity.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Activity size={48} className="mx-auto text-gray-300 mb-3" />
                <p>No recent activity found.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
