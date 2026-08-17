"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Search, Plus, MoreHorizontal, Building2, User } from 'lucide-react';

export default function CustomerSplitLayout({ children }) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  
  const { data: queryData, isLoading } = useQuery({
    queryKey: ['customers-sidebar', search],
    queryFn: async () => {
      const res = await fetch(`/api/zoho/customers?limit=50&search=${encodeURIComponent(search)}`);
      return res.json();
    }
  });

  const customers = queryData?.data || [];
  const pathname = usePathname();
  
  if (pathname.endsWith('/new') || pathname.endsWith('/edit')) {
    return <>{children}</>;
  }

  const selectedId = pathname.split('/').pop() !== 'customers' ? pathname.split('/').pop() : null;

  if (!selectedId) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* Left Sidebar (List) */}
      <div className="w-[320px] shrink-0 border-r border-gray-200 flex flex-col bg-white z-10 shadow-[2px_0_8px_rgba(0,0,0,0.02)]">
        <div className="p-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="font-semibold text-gray-800 text-sm">All Customers</div>
          <div className="flex items-center gap-1">
            <Link href="/dashboard/customers/new" className="p-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded shadow-sm transition-colors">
              <Plus size={16} />
            </Link>
            <button className="p-1.5 text-gray-500 hover:bg-gray-200 rounded transition-colors">
              <MoreHorizontal size={16} />
            </button>
          </div>
        </div>
        
        <div className="p-2 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input 
              type="text" 
              placeholder="Search Customers..." 
              className="w-full pl-8 pr-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded outline-none focus:border-blue-500 transition-colors"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-400 text-sm">Loading...</div>
          ) : customers.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {customers.map(c => {
                const id = c.zoho_customer_id || c._id;
                const isSelected = selectedId === id;
                return (
                  <Link 
                    key={id} 
                    href={`/dashboard/customers/${id}`}
                    className={`block p-3 hover:bg-gray-50 transition-colors ${isSelected ? 'bg-blue-50/50 border-l-4 border-blue-500' : 'border-l-4 border-transparent'}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="overflow-hidden">
                        <div className={`text-sm truncate ${isSelected ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
                          {c.company_name || c.contact_name}
                        </div>
                        {c.company_name && c.contact_name && c.contact_name !== c.company_name && (
                          <div className="text-xs text-gray-400 truncate mt-0.5">{c.contact_name}</div>
                        )}
                      </div>
                    </div>
                    <div className="mt-1.5 text-xs font-semibold text-gray-600">
                      ₹{parseFloat(c.outstanding_receivable_amount || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="p-4 text-center text-gray-400 text-sm">No customers found.</div>
          )}
        </div>
      </div>

      {/* Right Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto bg-white">
        {children}
      </div>
    </div>
  );
}
