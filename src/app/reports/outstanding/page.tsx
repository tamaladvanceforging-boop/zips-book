"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getOutstanding } from "@/server/reports/reportActions";
import { formatINR } from "@/lib/gstUtils";
import { Clock, Users, Factory, ArrowUpRight, ArrowDownLeft, RefreshCw } from "lucide-react";

export default function OutstandingPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadOutstanding = async () => {
    setLoading(true);
    const res = await getOutstanding();
    if (res.success && res.data) {
      setData(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadOutstanding();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        <RefreshCw className="h-5 w-5 animate-spin mr-2" /> Loading Outstanding reports...
      </div>
    );
  }

  const receivables = data?.receivables || [];
  const payables = data?.payables || [];

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-500" />
            <h1 className="text-xl font-bold tracking-tight">Outstanding (Receivables & Payables)</h1>
          </div>
          <p className="text-xs text-muted-foreground">
            Real-time aging and balance ledgers for Customer Receivables (Sundry Debtors) and Vendor Payables (Sundry Creditors).
          </p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 shadow-xs">
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Customer Receivables</span>
            <Users className="h-4 w-4" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
            {formatINR(data?.totalReceivable || 0)}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Pending collections from {receivables.filter((r: any) => r.outstanding > 0).length} customers
          </p>
        </div>

        <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 shadow-xs">
          <div className="flex items-center justify-between text-rose-600 dark:text-rose-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Vendor Payables</span>
            <Factory className="h-4 w-4" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-rose-600 dark:text-rose-400">
            {formatINR(data?.totalPayable || 0)}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Pending disbursements to {payables.filter((p: any) => p.outstanding > 0).length} suppliers
          </p>
        </div>
      </div>

      {/* Section 1: Customer Receivables */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs space-y-2">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-amber-500" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Customer Receivables (Sundry Debtors)
            </h2>
          </div>
          <Link
            href="/vouchers/receipt"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
          >
            <ArrowDownLeft className="h-3.5 w-3.5" />
            <span>Record Collection (F6)</span>
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase font-semibold text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-2.5">Customer Code</th>
                <th className="px-4 py-2.5">Customer Name</th>
                <th className="px-4 py-2.5 text-right">Total Invoiced (₹)</th>
                <th className="px-4 py-2.5 text-right">Total Received (₹)</th>
                <th className="px-4 py-2.5 text-right font-bold">Outstanding Balance (₹)</th>
                <th className="px-4 py-2.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {receivables.map((r: any) => (
                <tr key={r.id} className="hover:bg-muted/30 transition">
                  <td className="px-4 py-2.5 font-mono font-medium text-foreground">{r.code}</td>
                  <td className="px-4 py-2.5 font-semibold text-foreground">{r.name}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-muted-foreground">
                    {formatINR(r.totalInvoiced)}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-muted-foreground">
                    {formatINR(r.totalReceived)}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono font-bold">
                    <span className={r.outstanding > 0 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}>
                      {formatINR(r.outstanding)}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    {r.outstanding > 0 ? (
                      <Link
                        href="/vouchers/receipt"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                      >
                        Collect <ArrowUpRight className="h-3 w-3" />
                      </Link>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">Settled</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-muted/60 border-t-2 border-border font-bold text-xs">
              <tr>
                <td colSpan={4} className="px-4 py-2.5 text-right uppercase tracking-wider">
                  Total Receivable:
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-amber-600 dark:text-amber-400">
                  {formatINR(data?.totalReceivable || 0)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Section 2: Vendor Payables */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs space-y-2">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Factory className="h-4 w-4 text-rose-500" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Vendor Payables (Sundry Creditors)
            </h2>
          </div>
          <Link
            href="/vouchers/payment"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
          >
            <ArrowDownLeft className="h-3.5 w-3.5" />
            <span>Make Payment (F5)</span>
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase font-semibold text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-2.5">Vendor Code</th>
                <th className="px-4 py-2.5">Vendor Name</th>
                <th className="px-4 py-2.5 text-right">Total Purchased (₹)</th>
                <th className="px-4 py-2.5 text-right">Total Paid (₹)</th>
                <th className="px-4 py-2.5 text-right font-bold">Outstanding Balance (₹)</th>
                <th className="px-4 py-2.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {payables.map((p: any) => (
                <tr key={p.id} className="hover:bg-muted/30 transition">
                  <td className="px-4 py-2.5 font-mono font-medium text-foreground">{p.code}</td>
                  <td className="px-4 py-2.5 font-semibold text-foreground">{p.name}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-muted-foreground">
                    {formatINR(p.totalPurchased)}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-muted-foreground">
                    {formatINR(p.totalPaid)}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono font-bold">
                    <span className={p.outstanding > 0 ? "text-rose-600 dark:text-rose-400" : "text-muted-foreground"}>
                      {formatINR(p.outstanding)}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    {p.outstanding > 0 ? (
                      <Link
                        href="/vouchers/payment"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:underline"
                      >
                        Disburse <ArrowUpRight className="h-3 w-3" />
                      </Link>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">Settled</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-muted/60 border-t-2 border-border font-bold text-xs">
              <tr>
                <td colSpan={4} className="px-4 py-2.5 text-right uppercase tracking-wider">
                  Total Payable:
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-rose-600 dark:text-rose-400">
                  {formatINR(data?.totalPayable || 0)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
