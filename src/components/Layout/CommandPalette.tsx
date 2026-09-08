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
} from "lucide-react";

interface CommandItem {
  title: string;
  category: string;
  href: string;
  shortcut?: string;
  icon: React.ComponentType<{ className?: string }>;
}

const commands: CommandItem[] = [
  { title: "Dashboard Overview", category: "General", href: "/dashboard", icon: LayoutDashboard },
  { title: "Company Profile & Numbering", category: "General", href: "/company", icon: Building2 },
  { title: "Item Master (Inventory)", category: "Masters", href: "/masters/items", icon: Package },
  { title: "Customer Master (Debtors)", category: "Masters", href: "/masters/customers", icon: Users },
  { title: "Vendor Master (Creditors)", category: "Masters", href: "/masters/vendors", icon: Factory },
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
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
      // Direct voucher function keys
      if (!e.ctrlKey && !e.altKey && !e.metaKey) {
        if (e.key === "F8") {
          e.preventDefault();
          router.push("/vouchers/sales");
        } else if (e.key === "F9") {
          e.preventDefault();
          router.push("/vouchers/purchase");
        } else if (e.key === "F5") {
          e.preventDefault();
          router.push("/vouchers/payment");
        } else if (e.key === "F6") {
          e.preventDefault();
          router.push("/vouchers/receipt");
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

  const navigateTo = (href: string) => {
    setOpen(false);
    setQuery("");
    router.push(href as any);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-background/80 backdrop-blur-xs p-4 animate-in fade-in-0 duration-200">
      <div className="relative w-full max-w-lg overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
        {/* Search header */}
        <div className="flex items-center border-b border-border px-3 py-2.5">
          <Search className="h-4 w-4 text-muted-foreground mr-2 shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Go To (Type page, voucher, or press F5, F6, F8, F9)..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <button
            onClick={() => setOpen(false)}
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="py-6 text-center text-xs text-muted-foreground">No matching views found.</div>
          ) : (
            filtered.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.href}
                  onClick={() => navigateTo(item.href)}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition hover:bg-accent group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-md bg-muted text-muted-foreground group-hover:text-primary transition">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-medium text-foreground">{item.title}</div>
                      <div className="text-[10px] text-muted-foreground">{item.category}</div>
                    </div>
                  </div>
                  {item.shortcut && (
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-muted border border-border text-muted-foreground">
                      {item.shortcut}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="flex items-center justify-between border-t border-border bg-muted/40 px-3 py-2 text-[10px] text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>
              <kbd className="rounded bg-muted px-1.5 py-0.5 border font-mono">F8</kbd> Sales
            </span>
            <span>
              <kbd className="rounded bg-muted px-1.5 py-0.5 border font-mono">F9</kbd> Purchase
            </span>
            <span>
              <kbd className="rounded bg-muted px-1.5 py-0.5 border font-mono">F5</kbd> Payment
            </span>
            <span>
              <kbd className="rounded bg-muted px-1.5 py-0.5 border font-mono">F6</kbd> Receipt
            </span>
          </div>
          <span>
            <kbd className="rounded bg-muted px-1.5 py-0.5 border font-mono">Esc</kbd> Close
          </span>
        </div>
      </div>
    </div>
  );
}
