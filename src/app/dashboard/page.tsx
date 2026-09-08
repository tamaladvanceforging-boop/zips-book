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
  Layers
} from "lucide-react";

export const dynamic = "force-dynamic";

const DashboardPage = async () => {
  const statsRes = await getDashboardStats();
  const data = statsRes.success && statsRes.data ? statsRes.data : ({} as any);
  const company = data.company;

  const navCards = [
    { label: "Company Gateway", desc: "Select, switch or create companies", href: "/companies", icon: Building2, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Item Master", desc: "Catalog & inventory quantities", href: "/masters/items", icon: Package, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Customer Master", desc: "Sundry Debtors & receivables", href: "/masters/customers", icon: Users, color: "text-purple-500", bg: "bg-purple-500/10" },
    { label: "Vendor Master", desc: "Sundry Creditors & TDS details", href: "/masters/vendors", icon: Factory, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "Chart of Accounts", desc: "Assets, liabilities, equity, COA", href: "/masters/accounts", icon: BookOpen, color: "text-indigo-500", bg: "bg-indigo-500/10" },
    { label: "Sales Invoice (F8)", desc: "Generate & print GST tax invoices", href: "/vouchers/sales", icon: FileText, color: "text-emerald-600", bg: "bg-emerald-600/10" },
    { label: "Purchase Bill (F9)", desc: "Record vendor purchase invoices", href: "/vouchers/purchase", icon: Receipt, color: "text-cyan-500", bg: "bg-cyan-500/10" },
    { label: "Payment Voucher (F5)", desc: "Bank & cash payments to parties", href: "/vouchers/payment", icon: CreditCard, color: "text-rose-500", bg: "bg-rose-500/10" },
    { label: "Receipt Voucher (F6)", desc: "Record collections from customers", href: "/vouchers/receipt", icon: Wallet, color: "text-green-500", bg: "bg-green-500/10" },
    { label: "Sales Register", desc: "All issued tax invoices & tax totals", href: "/registers/sales", icon: BookMarked, color: "text-blue-600", bg: "bg-blue-600/10" },
    { label: "Purchase Register", desc: "All vendor purchase records", href: "/registers/purchase", icon: BookMarked, color: "text-teal-500", bg: "bg-teal-500/10" },
    { label: "Day Book (Journal)", desc: "Double-entry chronological journal", href: "/registers/daybook", icon: BookOpen, color: "text-violet-500", bg: "bg-violet-500/10" },
    { label: "Outstanding (O/S)", desc: "Receivables & payables ledger", href: "/reports/outstanding", icon: Clock, color: "text-amber-600", bg: "bg-amber-600/10" },
    { label: "GST Summary", desc: "GSTR-1 & 3B tax liability summary", href: "/reports/gst-summary", icon: Landmark, color: "text-indigo-600", bg: "bg-indigo-600/10" },
    { label: "Trial Balance", desc: "Dr/Cr verification statement", href: "/reports/trial-balance", icon: Scale, color: "text-sky-500", bg: "bg-sky-500/10" },
    { label: "Profit & Loss", desc: "Gross & net operational profit", href: "/reports/profit-loss", icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Balance Sheet", desc: "Financial position as on date", href: "/reports/balance-sheet", icon: Coins, color: "text-yellow-500", bg: "bg-yellow-500/10" },
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* Top Banner: Gateway of Tally Header */}
      {!company ? (
        <div className="p-8 rounded-2xl border border-dashed border-emerald-500/40 bg-emerald-500/5 text-center space-y-4">
          <Building2 className="h-12 w-12 text-emerald-500 mx-auto" />
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-foreground">No Active Company Selected</h2>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              To start entering vouchers, Day Book records, and generating financial reports, select an existing company or create a new one.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3">
            <Link
              href={"/companies" as any}
              className="px-4 py-2 rounded-xl bg-foreground text-background font-semibold text-xs"
            >
              Select Company (F1)
            </Link>
            <Link
              href={"/companies/create" as any}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold text-xs"
            >
              Create New Company (F3)
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-border bg-gradient-to-r from-card via-card to-emerald-500/[0.04] p-6 shadow-sm">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs">
                <Sparkles className="h-3.5 w-3.5" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Gateway of Tally &bull; Active Workspace
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              {company.name}
            </h1>
            <p className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-2">
              <span>GSTIN: <strong className="font-mono text-foreground font-semibold">{company.gstin}</strong></span>
              <span>&bull;</span>
              <span>State: {company.state} ({company.stateCode})</span>
              <span>&bull;</span>
              <span>FY: {new Date(company.financialYearFrom).getFullYear()} - {new Date(company.financialYearFrom).getFullYear() + 1}</span>
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              href={"/vouchers/sales" as any}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-500 transition shadow-sm"
            >
              <FileText className="h-4 w-4" />
              <span>Sales Invoice (F8)</span>
            </Link>
            <Link
              href={"/companies" as any}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-secondary px-3.5 py-2.5 text-xs font-semibold text-secondary-foreground hover:bg-muted transition"
            >
              <Building2 className="h-4 w-4" />
              <span>Switch Co (F1)</span>
            </Link>
          </div>
        </div>
      )}

      {/* Tally Shortcuts Quick Bar */}
      <div className="p-3 rounded-xl border border-border bg-card/60 flex items-center justify-between overflow-x-auto text-xs text-muted-foreground gap-3">
        <div className="flex items-center gap-2 font-semibold text-foreground shrink-0">
          <Layers className="h-3.5 w-3.5 text-emerald-500" />
          Quick Hotkeys:
        </div>
        <div className="flex items-center gap-3 shrink-0 text-[11px]">
          <Link href={"/companies" as any} className="hover:text-foreground flex items-center gap-1 font-mono">
            <kbd className="px-1.5 py-0.5 rounded border bg-muted text-[10px] font-bold">F1</kbd> Select Co
          </Link>
          <Link href={"/companies/create" as any} className="hover:text-foreground flex items-center gap-1 font-mono">
            <kbd className="px-1.5 py-0.5 rounded border bg-muted text-[10px] font-bold">F3</kbd> New Co
          </Link>
          <Link href={"/company" as any} className="hover:text-foreground flex items-center gap-1 font-mono">
            <kbd className="px-1.5 py-0.5 rounded border bg-muted text-[10px] font-bold">Alt+F3</kbd> Alter
          </Link>
          <Link href={"/vouchers/sales" as any} className="hover:text-foreground flex items-center gap-1 font-mono">
            <kbd className="px-1.5 py-0.5 rounded border bg-muted text-[10px] font-bold">F8</kbd> Sales
          </Link>
          <Link href={"/vouchers/purchase" as any} className="hover:text-foreground flex items-center gap-1 font-mono">
            <kbd className="px-1.5 py-0.5 rounded border bg-muted text-[10px] font-bold">F9</kbd> Purchase
          </Link>
          <Link href={"/vouchers/payment" as any} className="hover:text-foreground flex items-center gap-1 font-mono">
            <kbd className="px-1.5 py-0.5 rounded border bg-muted text-[10px] font-bold">F5</kbd> Payment
          </Link>
          <Link href={"/vouchers/receipt" as any} className="hover:text-foreground flex items-center gap-1 font-mono">
            <kbd className="px-1.5 py-0.5 rounded border bg-muted text-[10px] font-bold">F6</kbd> Receipt
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Invoices */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-xs hover:border-emerald-500/40 transition-colors">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Sales</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black tracking-tight">{data.totalInvoices || 0} Invoices</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Gross: <strong className="text-foreground">{formatINR(data.totalInvoiceValue || 0)}</strong>
            </div>
          </div>
        </div>

        {/* Taxable Turnover */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-xs hover:border-emerald-500/40 transition-colors">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Taxable Turnover</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black tracking-tight text-foreground">
              {formatINR(data.totalTaxable || 0)}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Inward Cost: {formatINR(data.totalPurchaseValue || 0)}
            </div>
          </div>
        </div>

        {/* Total GST Payable */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-xs hover:border-emerald-500/40 transition-colors">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">GST Liability</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
              <Landmark className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black tracking-tight text-indigo-600 dark:text-indigo-400">
              {formatINR(data.totalGstPayable || 0)}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
              <span>CGST: {formatINR(data.totalCgst || 0)}</span>
              <span>SGST: {formatINR(data.totalSgst || 0)}</span>
            </div>
          </div>
        </div>

        {/* Net Profit */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-xs hover:border-emerald-500/40 transition-colors">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Operational Profit</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">
              {formatINR(data.netProfit || 0)}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Cash & Bank: <strong className="text-foreground">{formatINR((data.bankBalance || 0) + (data.cashBalance || 0))}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-border bg-card/60 p-4">
          <div className="text-xs text-muted-foreground font-medium">Customer Receivables (Debtors)</div>
          <div className="text-lg font-black text-amber-600 dark:text-amber-400 mt-1">
            {formatINR(data.totalReceivable || 0)}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card/60 p-4">
          <div className="text-xs text-muted-foreground font-medium">Vendor Payables (Creditors)</div>
          <div className="text-lg font-black text-rose-600 dark:text-rose-400 mt-1">
            {formatINR(data.totalPayable || 0)}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card/60 p-4">
          <div className="text-xs text-muted-foreground font-medium">Inventory Catalog</div>
          <div className="text-lg font-black mt-1">{data.itemsCount || 0} Products / Items</div>
        </div>
        <div className="rounded-2xl border border-border bg-card/60 p-4">
          <div className="text-xs text-muted-foreground font-medium">Parties Directory</div>
          <div className="text-lg font-black mt-1">
            {(data.customersCount || 0) + (data.vendorsCount || 0)} Debtors & Creditors
          </div>
        </div>
      </div>

      {/* Quick Navigation, The 17 Core Modules from Excel */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold tracking-wider uppercase text-muted-foreground">
            Tally Operational Modules & Registers
          </h2>
          <span className="text-xs text-muted-foreground font-mono">
            Press <kbd className="rounded bg-muted px-1.5 py-0.5 border text-foreground font-bold">Alt+G</kbd> for Go To Search
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {navCards.map((c) => {
            const Icon = c.icon;
            return (
              <Link
                key={c.href}
                href={c.href as any}
                className="group flex items-start gap-3.5 rounded-2xl border border-border bg-card p-4 transition-all duration-150 hover:border-emerald-500/50 hover:bg-emerald-500/[0.02] hover:shadow-sm"
              >
                <div className={`p-2.5 rounded-xl ${c.bg} ${c.color} shrink-0 transition-transform group-hover:scale-105`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition truncate">
                      {c.label}
                    </span>
                    <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1" />
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
};

export default DashboardPage;
