"use client";

import { Printer } from "lucide-react";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors bg-white border border-gray-200 px-4 py-2 rounded-xl shadow-sm"
    >
      <Printer size={16} />
      Print
    </button>
  );
}
