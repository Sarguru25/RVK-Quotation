"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp, Search, Check, PlusCircle } from "lucide-react";

export default function AccountSelectDropdown({
  value,
  onChange,
  groups = [],
  placeholder = "Select an account",
  className = "",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Find currently selected account across all groups
  const allAccounts = groups.flatMap((g) => g.accounts || []);
  const selectedAccount = allAccounts.find((a) => a.account_id === value);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Filter groups and accounts by search term
  const term = searchTerm.trim().toLowerCase();
  const filteredGroups = groups
    .map((group) => {
      const filtered = (group.accounts || []).filter((account) => {
        if (!term) return true;
        const nameMatch = account.account_name?.toLowerCase().includes(term);
        const codeMatch = account.account_code?.toLowerCase().includes(term);
        const displayMatch = account.display_name?.toLowerCase().includes(term);
        return nameMatch || codeMatch || displayMatch;
      });
      return {
        ...group,
        accounts: filtered,
      };
    })
    .filter((group) => group.accounts.length > 0);

  function handleSelect(account) {
    onChange(account.account_id);
    setIsOpen(false);
  }

  return (
    <div className={`relative w-full ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => {
          if (!isOpen) setSearchTerm("");
          setIsOpen(!isOpen);
        }}
        className={`w-full border rounded px-3 py-2 text-sm bg-white flex items-center justify-between text-left transition-colors outline-none ${
          isOpen
            ? "border-blue-500 ring-2 ring-blue-100"
            : "border-gray-300 hover:border-gray-400"
        }`}
      >
        <span className="truncate text-gray-800">
          {selectedAccount?.display_name ||
            selectedAccount?.account_name ||
            placeholder}
        </span>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-blue-500 ml-2 shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400 ml-2 shrink-0" />
        )}
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden text-sm animate-in fade-in zoom-in-95 duration-100">
          {/* Search Box */}
          <div className="p-2 border-b border-gray-100 bg-gray-50/50">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-gray-400 absolute left-2.5 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search"
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-gray-200 rounded focus:border-blue-500 focus:outline-none placeholder-gray-400"
              />
            </div>
          </div>

          {/* Groups & Items List */}
          <div className="max-h-56 overflow-y-auto py-1 divide-y divide-gray-50">
            {filteredGroups.length === 0 ? (
              <div className="p-4 text-center text-xs text-gray-400">
                No accounts found
              </div>
            ) : (
              filteredGroups.map((group) => (
                <div key={group.label} className="py-1">
                  {/* Category Header */}
                  <div className="px-3 py-1 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                    {group.label}
                  </div>

                  {/* Account Items */}
                  {group.accounts.map((account) => {
                    const isSelected = account.account_id === value;
                    return (
                      <div
                        key={account.account_id}
                        onClick={() => handleSelect(account)}
                        className={`px-3 py-2 cursor-pointer flex items-center justify-between text-xs transition-colors group ${
                          isSelected
                            ? "bg-blue-50 text-blue-700 font-medium hover:bg-blue-600 hover:text-white"
                            : "text-gray-700 hover:bg-blue-600 hover:text-white"
                        }`}
                      >
                        <span className="truncate">
                          {account.display_name || account.account_name}
                        </span>
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-blue-600 group-hover:text-white shrink-0 ml-2" />
                        )}
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer Action */}
          <div className="p-2 border-t border-gray-100 bg-gray-50/40">
            <button
              type="button"
              onClick={() => {
                // If there's an account creation action, or just toast for now
                setIsOpen(false);
              }}
              className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium px-2 py-1 rounded transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>New Account</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
