"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
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
  X,
  PlusCircle,
  Settings2,
} from "lucide-react";

interface CommandItem {
  title: string;
  category: string;
  href: string;
  shortcut?: string;
  icon: React.ComponentType<{ className?: string }>;
}

const commands: CommandItem[] = [
  { title: "Gateway of Tally (Dashboard)", category: "Gateway", href: "/dashboard", icon: LayoutDashboard },
  { title: "Select Company", category: "Gateway", href: "/companies", shortcut: "F1", icon: Building2 },
  { title: "Create New Company", category: "Gateway", href: "/companies/create", shortcut: "F3", icon: PlusCircle },
  { title: "Alter Company Profile", category: "Gateway", href: "/company", shortcut: "Alt+F3", icon: Settings2 },
  { title: "Item Master (Stock & HSN)", category: "Masters", href: "/masters/items", icon: Package },
  { title: "Customer Master (Sundry Debtors)", category: "Masters", href: "/masters/customers", icon: Users },
  { title: "Vendor Master (Sundry Creditors)", category: "Masters", href: "/masters/vendors", icon: Factory },
  { title: "Chart of Accounts (COA)", category: "Masters", href: "/masters/accounts", icon: BookOpen },
  { title: "Create Sales Invoice (Tax Invoice)", category: "Vouchers", href: "/vouchers/sales", shortcut: "F8", icon: FileSpreadsheet },
  { title: "Create Purchase Bill", category: "Vouchers", href: "/vouchers/purchase", shortcut: "F9", icon: Receipt },
  { title: "Record Payment Voucher", category: "Vouchers", href: "/vouchers/payment", shortcut: "F5", icon: CreditCard },
  { title: "Record Receipt Voucher", category: "Vouchers", href: "/vouchers/receipt", shortcut: "F6", icon: Wallet },
  { title: "Sales Register", category: "Registers", href: "/registers/sales", icon: BookMarked },
  { title: "Purchase Register", category: "Registers", href: "/registers/purchase", icon: BookMarked },
  { title: "Day Book (General Journal)", category: "Registers", href: "/registers/daybook", icon: BookOpen },
  { title: "Outstanding (Receivable / Payable)", category: "Reports", href: "/reports/outstanding", icon: Clock },
  { title: "GST Summary (GSTR-1 & 3B)", category: "Reports", href: "/reports/gst-summary", icon: Landmark },
  { title: "Trial Balance", category: "Reports", href: "/reports/trial-balance", icon: Scale },
  { title: "Profit & Loss Statement", category: "Reports", href: "/reports/profit-loss", icon: TrendingUp },
  { title: "Balance Sheet", category: "Reports", href: "/reports/balance-sheet", icon: Coins },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Alt+G (Tally shortcut)
      if ((e.ctrlKey && e.key.toLowerCase() === "k") || (e.altKey && e.key.toLowerCase() === "g")) {
        e.preventDefault();
        setOpen((prev) => !prev);
        return;
      }
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }

      // Alt+F3: Alter Company
      if (e.altKey && e.key === "F3") {
        e.preventDefault();
        router.push("/company" as any);
        return;
      }

      // Direct Function keys
      if (!e.ctrlKey && !e.altKey && !e.metaKey) {
        if (e.key === "F1") {
          e.preventDefault();
          router.push("/companies" as any);
        } else if (e.key === "F3") {
          e.preventDefault();
          router.push("/companies/create" as any);
        } else if (e.key === "F8") {
          e.preventDefault();
          router.push("/vouchers/sales" as any);
        } else if (e.key === "F9") {
          e.preventDefault();
          router.push("/vouchers/purchase" as any);
        } else if (e.key === "F5") {
          e.preventDefault();
          router.push("/vouchers/payment" as any);
        } else if (e.key === "F6") {
          e.preventDefault();
          router.push("/vouchers/receipt" as any);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  if (!open) return null;

  const filtered = commands.filter(
    (c) =>
      c.title.toLowerCase().includes(query.toLowerCase()) ||
      c.category.toLowerCase().includes(query.toLowerCase()) ||
      (c.shortcut && c.shortcut.toLowerCase().includes(query.toLowerCase()))
  );

  const handleSelect = (href: string) => {
    setOpen(false);
    router.push(href as any);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/60 backdrop-blur-sm p-4 animate-in fade-in-0 duration-150">
      <div className="w-full max-w-xl rounded-2xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 border-b border-border h-12 bg-muted/30">
          <Search className="h-4 w-4 text-emerald-500 mr-2 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type to search or jump to voucher, report, or company... (Alt+G)"
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            autoFocus
          />
          <button
            onClick={() => setOpen(false)}
            className="p-1 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Command List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No matching modules or vouchers found.
            </div>
          ) : (
            filtered.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.href}
                  onClick={() => handleSelect(item.href)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 text-foreground transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <div className="p-1.5 rounded-lg bg-muted group-hover:bg-emerald-500/20 text-muted-foreground group-hover:text-emerald-500 transition-colors">
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <span className="font-medium truncate">{item.title}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-muted-foreground group-hover:text-emerald-500/80 uppercase font-semibold">
                      {item.category}
                    </span>
                    {item.shortcut && (
                      <kbd className="px-1.5 py-0.5 rounded border border-border bg-background text-[10px] font-mono text-muted-foreground font-bold">
                        {item.shortcut}
                      </kbd>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts info */}
        <div className="px-4 py-2 border-t border-border bg-muted/40 text-[10px] text-muted-foreground flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>F1: Select Co</span>
            <span>•</span>
            <span>F8: Sales</span>
            <span>•</span>
            <span>F9: Purchase</span>
            <span>•</span>
            <span>F5: Payment</span>
          </div>
          <span>ESC to close</span>
        </div>
      </div>
    </div>
  );
}
