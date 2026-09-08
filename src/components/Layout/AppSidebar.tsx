"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Package,
  Users,
  Factory,
  BookOpen,
  FileSpreadsheet,
  Receipt,
  CreditCard,
  Wallet,
  BookMarked,
  Clock,
  Landmark,
  Scale,
  TrendingUp,
  Coins,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  Settings2,
  ArrowLeftRight,
  Undo2,
  Redo2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AppLogo } from "@/components/UI/AppLogo";

interface NavGroup {
  label: string;
  items: {
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    shortcut?: string;
  }[];
}

const navGroups: NavGroup[] = [
  {
    label: "Gateway & Company",
    items: [
      { href: "/dashboard", label: "Enterprise Gateway", icon: LayoutDashboard },
      { href: "/companies", label: "Select Company", icon: Building2, shortcut: "F1" },
      { href: "/companies/create", label: "Create Company", icon: PlusCircle, shortcut: "F3" },
      { href: "/company", label: "Alter Company", icon: Settings2, shortcut: "Alt+F3" },
    ],
  },
  {
    label: "Masters",
    items: [
      { href: "/masters/items", label: "Item Master", icon: Package },
      { href: "/masters/customers", label: "Customer Master", icon: Users },
      { href: "/masters/vendors", label: "Vendor Master", icon: Factory },
      { href: "/masters/accounts", label: "Chart of Accounts", icon: BookOpen },
    ],
  },
  {
    label: "Vouchers (Entry)",
    items: [
      { href: "/vouchers/sales", label: "Sales Invoice", icon: FileSpreadsheet, shortcut: "F8" },
      { href: "/vouchers/purchase", label: "Purchase Bill", icon: Receipt, shortcut: "F9" },
      { href: "/vouchers/payment", label: "Payment Voucher", icon: CreditCard, shortcut: "F5" },
      { href: "/vouchers/receipt", label: "Receipt Voucher", icon: Wallet, shortcut: "F6" },
      { href: "/vouchers/contra", label: "Contra Voucher", icon: ArrowLeftRight, shortcut: "F4" },
      { href: "/vouchers/journal", label: "Journal Voucher", icon: BookOpen, shortcut: "F7" },
      { href: "/vouchers/credit-note", label: "Credit Note", icon: Undo2, shortcut: "Alt+F6" },
      { href: "/vouchers/debit-note", label: "Debit Note", icon: Redo2, shortcut: "Alt+F5" },
    ],
  },
  {
    label: "Registers",
    items: [
      { href: "/registers/sales", label: "Sales Register", icon: BookMarked },
      { href: "/registers/purchase", label: "Purchase Register", icon: BookMarked },
      { href: "/registers/credit-notes", label: "Credit Note Register", icon: Undo2 },
      { href: "/registers/debit-notes", label: "Debit Note Register", icon: Redo2 },
      { href: "/registers/daybook", label: "Day Book (Journal)", icon: BookOpen },
    ],
  },
  {
    label: "Financial Statements",
    items: [
      { href: "/reports/outstanding", label: "Outstanding (O/S)", icon: Clock },
      { href: "/reports/gst-summary", label: "GST Summary", icon: Landmark },
      { href: "/reports/trial-balance", label: "Trial Balance", icon: Scale },
      { href: "/reports/profit-loss", label: "Profit & Loss", icon: TrendingUp },
      { href: "/reports/balance-sheet", label: "Balance Sheet", icon: Coins },
    ],
  },
];

export const AppSidebar = () => {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "relative flex flex-col border-r border-border bg-card/60 backdrop-blur-md transition-all duration-300 ease-in-out shrink-0 select-none z-20",
        collapsed ? "w-18" : "w-64"
      )}
    >
      {/* Sidebar Header */}
      <div className="flex items-center justify-between h-14 px-3 border-b border-border">
        {!collapsed && (
          <AppLogo size="sm" showText subtitle="Enterprise ERP" href="/dashboard" />
        )}
        {collapsed && (
          <div className="mx-auto">
            <AppLogo size="xs" showText={false} href="/dashboard" />
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 text-muted-foreground hover:text-foreground rounded hover:bg-muted transition"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-4 text-xs">
        {navGroups.map((group) => (
          <div key={group.label} className="space-y-1">
            {!collapsed && (
              <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                {group.label}
              </div>
            )}
            {group.items.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href as any}
                  className={cn(
                    "flex items-center gap-2.5 px-2.5 py-2 rounded-xl font-medium transition-colors group",
                    isActive
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                  title={collapsed ? `${item.label} ${item.shortcut ? `(${item.shortcut})` : ""}` : undefined}
                >
                  <Icon className={cn("h-4 w-4 shrink-0 transition-transform group-hover:scale-105", isActive && "text-white")} />
                  {!collapsed && (
                    <div className="flex items-center justify-between flex-1 truncate">
                      <span className="truncate">{item.label}</span>
                      {item.shortcut && (
                        <span
                          className={cn(
                            "text-[10px] font-mono px-1.5 py-0.5 rounded border leading-none ml-1",
                            isActive
                              ? "border-white/30 bg-white/15 text-white"
                              : "border-border bg-muted/60 text-muted-foreground"
                          )}
                        >
                          {item.shortcut}
                        </span>
                      )}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Sidebar Footer */}
      <div className="p-3 border-t border-border text-[11px] text-muted-foreground text-center">
        {!collapsed ? (
          <div className="space-y-0.5">
            <span className="font-semibold text-foreground">ZIPS-Book ERP</span>
            <div className="text-[10px] text-muted-foreground">© 2026 Tamal Roy Chowdhury</div>
          </div>
        ) : (
          <div className="font-mono text-[9px]">© 2026</div>
        )}
      </div>
    </aside>
  );
};
