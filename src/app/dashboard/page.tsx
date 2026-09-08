import React from "react";
import Link from "next/link";
import { getDashboardStats } from "@/server/reports/reportActions";
import { formatINR } from "@/lib/gstUtils";
import {
  FileText,
  DollarSign,
  Receipt,
  Scale,
  TrendingUp,
  Package,
  Users,
  Factory,
  ArrowUpRight,
  Building2,
  BookOpen,
  CreditCard,
  Wallet,
  Clock,
  Landmark,
  Coins,
  BookMarked,
  Sparkles,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const statsRes = await getDashboardStats();
  const data = statsRes.success && statsRes.data ? statsRes.data : ({} as any);

  const navCards = [
    { label: "Company Setup", desc: "Profile, GSTIN, numbering rules", href: "/company", icon: Building2, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Item Master", desc: "Catalog & inventory quantities", href: "/masters/items", icon: Package, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Customer Master", desc: "Sundry Debtors & receivables", href: "/masters/customers", icon: Users, color: "text-purple-500", bg: "bg-purple-500/10" },
    { label: "Vendor Master", desc: "Sundry Creditors & TDS details", href: "/masters/vendors", icon: Factory, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "Chart of Accounts", desc: "Assets, liabilities, equity, COA", href: "/masters/accounts", icon: BookOpen, color: "text-indigo-500", bg: "bg-indigo-500/10" },
    { label: "Sales Invoice (F8)", desc: "Generate & print GST tax invoices", href: "/vouchers/sales", icon: FileText, color: "text-emerald-600", bg: "bg-emerald-600/10" },
    { label: "Purchase Bill (F9)", desc: "Record vendor purchase invoices", href: "/vouchers/purchase", icon: Receipt, color: "text-cyan-500", bg: "bg-cyan-500/10" },
    { label: "Sales Register", desc: "All issued tax invoices & tax totals", href: "/registers/sales", icon: BookMarked, color: "text-blue-600", bg: "bg-blue-600/10" },
    { label: "Purchase Register", desc: "All vendor purchase records", href: "/registers/purchase", icon: BookMarked, color: "text-teal-500", bg: "bg-teal-500/10" },
    { label: "Payment Voucher (F5)", desc: "Bank & cash payments to parties", href: "/vouchers/payment", icon: CreditCard, color: "text-rose-500", bg: "bg-rose-500/10" },
    { label: "Receipt Voucher (F6)", desc: "Record collections from customers", href: "/vouchers/receipt", icon: Wallet, color: "text-green-500", bg: "bg-green-500/10" },
    { label: "Day Book (Journal)", desc: "Double-entry chronological journal", href: "/registers/daybook", icon: BookOpen, color: "text-violet-500", bg: "bg-violet-500/10" },
    { label: "Outstanding (O/S)", desc: "Receivables & payables ledger", href: "/reports/outstanding", icon: Clock, color: "text-amber-600", bg: "bg-amber-600/10" },
    { label: "GST Summary", desc: "GSTR-1 & 3B tax liability summary", href: "/reports/gst-summary", icon: Landmark, color: "text-indigo-600", bg: "bg-indigo-600/10" },
    { label: "Trial Balance", desc: "Dr/Cr verification statement", href: "/reports/trial-balance", icon: Scale, color: "text-sky-500", bg: "bg-sky-500/10" },
    { label: "Profit & Loss", desc: "Gross & net operational profit", href: "/reports/profit-loss", icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Balance Sheet", desc: "Financial position as on date", href: "/reports/balance-sheet", icon: Coins, color: "text-yellow-500", bg: "bg-yellow-500/10" },
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-border bg-gradient-to-r from-card via-card to-accent/30 p-6 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500/20 text-emerald-500 text-xs">
              <Sparkles className="h-3.5 w-3.5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              GST Billing & Accounting Dashboard
            </h1>
          </div>
          <p className="text-xs text-muted-foreground">
            {data.company?.name || "Your Company Pvt Ltd"} &bull; GSTIN:{" "}
            <span className="font-mono text-foreground font-medium">
              {data.company?.gstin || "19AAAAA0000A1Z5"}
            </span>{" "}
            &bull; State: {data.company?.state || "West Bengal"} ({data.company?.stateCode || "19"})
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/vouchers/sales"
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition shadow-xs"
          >
            <FileText className="h-4 w-4" />
            <span>Create Invoice (F8)</span>
          </Link>
          <Link
            href="/company"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-secondary px-3.5 py-2 text-xs font-semibold text-secondary-foreground hover:bg-muted transition"
          >
            <Building2 className="h-4 w-4" />
            <span>Setup</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Invoices */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Total Invoices</span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight">{data.totalInvoices || 0}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              Value: {formatINR(data.totalInvoiceValue || 0)}
            </div>
          </div>
        </div>

        {/* Taxable Turnover */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Taxable Sales</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight">
              {formatINR(data.totalTaxable || 0)}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              Purchases: {formatINR(data.totalPurchaseValue || 0)}
            </div>
          </div>
        </div>

        {/* Total GST Payable */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">GST Liability</span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
              <Landmark className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight">
              {formatINR(data.totalGstPayable || 0)}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-2">
              <span>CGST: {formatINR(data.totalCgst || 0)}</span>
              <span>SGST: {formatINR(data.totalSgst || 0)}</span>
            </div>
          </div>
        </div>

        {/* Net Profit */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Net Profit</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              {formatINR(data.netProfit || 0)}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              Bank Balance: {formatINR(data.bankBalance || 0)}
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-card/60 p-3.5">
          <div className="text-[11px] text-muted-foreground font-medium">Total Receivables (Debtors)</div>
          <div className="text-lg font-bold text-amber-600 dark:text-amber-400 mt-1">
            {formatINR(data.totalReceivable || 0)}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card/60 p-3.5">
          <div className="text-[11px] text-muted-foreground font-medium">Total Payables (Creditors)</div>
          <div className="text-lg font-bold text-rose-600 dark:text-rose-400 mt-1">
            {formatINR(data.totalPayable || 0)}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card/60 p-3.5">
          <div className="text-[11px] text-muted-foreground font-medium">Items in Master</div>
          <div className="text-lg font-bold mt-1">{data.itemsCount || 0} Products/Services</div>
        </div>
        <div className="rounded-xl border border-border bg-card/60 p-3.5">
          <div className="text-[11px] text-muted-foreground font-medium">Parties Registered</div>
          <div className="text-lg font-bold mt-1">
            {(data.customersCount || 0) + (data.vendorsCount || 0)} Clients & Vendors
          </div>
        </div>
      </div>

      {/* Quick Navigation — The 17 Core Modules from Excel */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
            Quick Navigation (Modules & Reports)
          </h2>
          <span className="text-[11px] text-muted-foreground">
            Press <kbd className="rounded bg-muted px-1.5 py-0.5 border font-mono">Alt+G</kbd> to jump anywhere
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {navCards.map((c) => {
            const Icon = c.icon;
            return (
              <Link
                key={c.href}
                href={c.href as any}
                className="group flex items-start gap-3.5 rounded-xl border border-border bg-card p-3.5 transition-all duration-150 hover:border-primary/40 hover:shadow-sm"
              >
                <div className={`p-2.5 rounded-lg ${c.bg} ${c.color} shrink-0 transition-transform group-hover:scale-105`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-foreground group-hover:text-primary transition truncate">
                      {c.label}
                    </span>
                    <ArrowUpRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1" />
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">{c.desc}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
