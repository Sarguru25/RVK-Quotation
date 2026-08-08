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

  const tabs = ['Overview', 'Visits', 'Quotations', 'Activity'];

  return (
    <div className="bg-gray-50/50 min-h-screen p-8 w-full max-w-7xl mx-auto font-sans text-gray-900 pb-20">
      {/* HEADER SECTION */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex gap-5 items-center">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl font-bold shadow-inner">
            {customer.contact_name ? customer.contact_name.charAt(0).toUpperCase() : 'C'}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{customer.contact_name}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-600">
              {customer.company_name && (
                <div className="flex items-center gap-1.5"><Building2 size={14} /> {customer.company_name}</div>
              )}
              {customer.email && (
                <div className="flex items-center gap-1.5"><Mail size={14} /> {customer.email}</div>
              )}
              {customer.phone && (
                <div className="flex items-center gap-1.5"><Phone size={14} /> {customer.phone}</div>
              )}
              {customer.gst_no && (
                <div className="flex items-center gap-1.5"><FileText size={14} /> GST: {customer.gst_no}</div>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Link href={`/dashboard/visits/new?customerId=${customerId}`} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-all hover:shadow">
            <Plus size={16} /> Create Visit
          </Link>
          <Link href={`/dashboard/quotations?new=true&customerId=${customerId}`} className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-medium shadow-sm transition-all">
            <FileSignature size={16} /> New Quote
          </Link>
          <button className="flex items-center justify-center bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 w-10 h-10 rounded-lg shadow-sm transition-all">
            <Share2 size={16} />
          </button>
        </div>
      </div>

      {/* ANALYTICS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
          <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1 flex items-center gap-1.5"><Briefcase size={12} /> Total Visits</div>
          <div className="text-2xl font-bold text-gray-900">{loading ? '-' : analytics?.totalVisits || 0}</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
          <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1 flex items-center gap-1.5"><FileSignature size={12} /> Total Quotes</div>
          <div className="text-2xl font-bold text-gray-900">{loading ? '-' : analytics?.totalQuotations || 0}</div>
        </div>
        <div className="bg-green-50 p-4 rounded-xl shadow-sm border border-green-100 flex flex-col justify-center">
          <div className="text-green-700 text-xs font-semibold uppercase tracking-wider mb-1 flex items-center gap-1.5"><CheckCircle2 size={12} /> Accepted</div>
          <div className="text-2xl font-bold text-green-800">{loading ? '-' : analytics?.acceptedQuotations || 0}</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-xl shadow-sm border border-yellow-100 flex flex-col justify-center">
          <div className="text-yellow-700 text-xs font-semibold uppercase tracking-wider mb-1 flex items-center gap-1.5"><Clock size={12} /> Pending</div>
          <div className="text-2xl font-bold text-yellow-800">{loading ? '-' : analytics?.pendingQuotations || 0}</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
          <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1 flex items-center gap-1.5"><Calendar size={12} /> Last Visit</div>
          <div className="text-sm font-bold text-gray-900 mt-1">{loading ? '-' : (analytics?.lastVisit ? new Date(analytics.lastVisit).toLocaleDateString('en-GB') : 'Never')}</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
          <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1 flex items-center gap-1.5"><Activity size={12} /> Last Activity</div>
          <div className="text-sm font-bold text-gray-900 mt-1">{loading ? '-' : (analytics?.recentActivities?.[0]?.date ? new Date(analytics.recentActivities[0].date).toLocaleDateString('en-GB') : 'None')}</div>
        </div>
      </div>

      {/* TABS */}
      <div className="flex space-x-1 bg-gray-200/50 p-1 rounded-xl w-fit mb-6">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* TAB CONTENT */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 min-h-[400px]">
        {activeTab === 'Overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Contact Details</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="text-sm text-gray-500">Contact Person</span>
                  <span className="text-sm font-medium text-gray-900">{customer.contact_name || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="text-sm text-gray-500">Email Address</span>
                  <span className="text-sm font-medium text-gray-900">{customer.email || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="text-sm text-gray-500">Phone Number</span>
                  <span className="text-sm font-medium text-gray-900">{customer.phone || customer.mobile || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="text-sm text-gray-500">Customer Type</span>
                  <span className="text-sm font-medium text-gray-900">{customer.customer_sub_type || customer.contact_type || 'Business'}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Address Information</h3>
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Billing Address</h4>
                  {customer.billing_address && (customer.billing_address.address || customer.billing_address.city) ? (
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {customer.billing_address.attention && <>{customer.billing_address.attention}<br /></>}
                      {customer.billing_address.address && <>{customer.billing_address.address}<br /></>}
                      {[customer.billing_address.city, customer.billing_address.state].filter(Boolean).join(", ")}<br />
                      {[customer.billing_address.zip, customer.billing_address.country].filter(Boolean).join(" ")}
                    </p>
                  ) : <p className="text-sm text-gray-400 italic">No billing address provided.</p>}
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Shipping Address</h4>
                  {customer.shipping_address && (customer.shipping_address.address || customer.shipping_address.city) ? (
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {customer.shipping_address.attention && <>{customer.shipping_address.attention}<br /></>}
                      {customer.shipping_address.address && <>{customer.shipping_address.address}<br /></>}
                      {[customer.shipping_address.city, customer.shipping_address.state].filter(Boolean).join(", ")}<br />
                      {[customer.shipping_address.zip, customer.shipping_address.country].filter(Boolean).join(" ")}
                    </p>
                  ) : <p className="text-sm text-gray-400 italic">No shipping address provided.</p>}
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
