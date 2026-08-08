"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  FileText,
  Users,
  UserCircle,
  LogOut,
  ChevronRight,
  ListPlus,
  ClipboardList,
  ShieldAlert,
  FilePlus,
  ReceiptIndianRupee,
  X,
  HatGlasses,
  Database
} from "lucide-react";
import { PERMISSIONS, hasPermission } from "@/lib/rbac/permissions";

export default function Sidebar({ onClose }) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const userPermissions = session?.user?.permissions || [];
  const isAdmin = session?.user?.role === "Admin";

  const allLinks = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, requiresAny: [] },
    { name: "Quotations", href: "/dashboard/quotations", icon: FileText, requiresAny: [PERMISSIONS.QUOTATION.VIEW] },
    // { name: "Sales Orders", href: "/dashboard/sales-orders", icon: ClipboardList },
    // { name: "Invoices", href: "/dashboard/invoices", icon: FileText },
    { name: "Customers", href: "/dashboard/customers", icon: Users, requiresAny: [PERMISSIONS.CUSTOMER.VIEW] },
    // { name: "Custom Quote", href: "/dashboard/custom", icon: FilePlus, requiresAny: [PERMISSIONS.CUSTOM_QUOTE.VIEW] },
    { name: "Items", href: "/dashboard/items", icon: ListPlus, requiresAny: [PERMISSIONS.PRODUCT.VIEW] },
    { name: "Users", href: "/dashboard/users", icon: UserCircle, requiresAny: [PERMISSIONS.USER.VIEW] },
    { name: "Roles", href: "/dashboard/roles", icon: ShieldAlert, requiresAny: [PERMISSIONS.ROLE.MANAGE] },
    // { name: "Data Sync", href: "/dashboard/sync", icon: Database, requiresAny: [PERMISSIONS.ROLE.MANAGE] },
    { name: "Data Sync", href: "/dashboard/sync", icon: Database },
    // { name: "Price Data", href: "/dashboard/priceData", icon: ReceiptIndianRupee, requiresAny: [PERMISSIONS.PRICE_DATA.VIEW] },
    // { name: "Visits", href: "/dashboard/visits", icon: HatGlasses, requiresAny: [PERMISSIONS.VISIT.VIEW] },
  ];

  // Filter links based on permissions
  const navLinks = allLinks.filter(link => {
    if (isAdmin) return true;
    if (!link.requiresAny || link.requiresAny.length === 0) return true;
    return link.requiresAny.some(perm => hasPermission(userPermissions, perm));
  });

  const initials = session?.user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <aside className="w-64 bg-slate-900 h-full flex flex-col justify-between">
      {/* Logo */}
      <div>
        <div className="px-6 py-6 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                <FileText size={16} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white leading-none">QuoteFlow</h2>
                <p className="text-xs text-slate-500 mt-0.5">Powered by ZOHO</p>
              </div>
            </div>
            {onClose && (
              <button onClick={onClose} className="md:hidden text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav className="mt-4 flex flex-col gap-1 px-3">
          <p className="text-xs text-slate-600 uppercase tracking-wider font-semibold px-3 mb-2">
            Main Menu
          </p>
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive =
              pathname === link.href ||
              (link.href !== "/dashboard" && pathname.startsWith(link.href + "/"));
            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={onClose}
                className={`group flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 ${isActive
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/50"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  }`}
              >
                <span className="flex items-center gap-3">
                  <Icon
                    size={18}
                    className={isActive ? "text-white" : "text-slate-500 group-hover:text-indigo-400 transition-colors"}
                  />
                  {link.name}
                </span>
                {isActive && <ChevronRight size={14} className="text-indigo-300" />}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-slate-800">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800 mb-2">
          <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {initials || "U"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white truncate">
              {session?.user?.name}
            </p>
            <p className="text-xs text-slate-500 truncate">{session?.user?.role}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg font-medium text-sm transition-all duration-200"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}