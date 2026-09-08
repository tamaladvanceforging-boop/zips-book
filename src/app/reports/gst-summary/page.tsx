"use client";

import React, { useEffect, useState } from "react";
import { getGstSummary } from "@/server/reports/reportActions";
import { formatINR } from "@/lib/gstUtils";
import { Landmark, ArrowUpRight, ArrowDownLeft, RefreshCw, CheckCircle2 } from "lucide-react";

export default function GstSummaryPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadSummary = async () => {
    setLoading(true);
    const res = await getGstSummary();
    if (res.success && res.data) {
      setData(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadSummary();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        <RefreshCw className="h-5 w-5 animate-spin mr-2" /> Generating GST Summary Report...
      </div>
    );
  }

  const outward = data?.outward;
  const inward = data?.inward;
  const net = data?.netTax;

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Landmark className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-xl font-bold tracking-tight">GST Summary (GSTR-1 & GSTR-3B)</h1>
          </div>
          <p className="text-xs text-muted-foreground">
            Tax computation statement showing Outward Tax Liability, Inward Input Tax Credit (ITC), and Net GST Payable.
          </p>
        </div>
      </div>

      {/* Net Liability Hero Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 shadow-xs">
          <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Output GST (Sales)</span>
            <ArrowUpRight className="h-4 w-4" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-400">
            {formatINR(outward?.totalGstPayable || 0)}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            On {outward?.count || 0} invoices ({formatINR(outward?.taxableValue || 0)} taxable)
          </p>
        </div>

        <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4 shadow-xs">
          <div className="flex items-center justify-between text-cyan-600 dark:text-cyan-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Input Tax Credit (ITC)</span>
            <ArrowDownLeft className="h-4 w-4" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-cyan-600 dark:text-cyan-400">
            {formatINR(inward?.totalItc || 0)}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            From {inward?.count || 0} purchase bills ({formatINR(inward?.taxableValue || 0)} taxable)
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between text-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Net GST to Pay in Cash</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {formatINR(net?.netPayable || 0)}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {net?.itcCarriedForward > 0
              ? `Surplus ITC of ${formatINR(net.itcCarriedForward)} carried forward`
              : "Output GST liability after ITC set-off"}
          </p>
        </div>
      </div>

      {/* Outward Supplies Breakdown (GSTR-1) */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs space-y-2">
        <div className="p-4 border-b border-border">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground">
            1. Outward Supplies Breakdown (GSTR-1 Style)
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase font-semibold text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-2.5">Supply Type</th>
                <th className="px-4 py-2.5 text-right">Taxable Value (₹)</th>
                <th className="px-4 py-2.5 text-right">CGST (₹)</th>
                <th className="px-4 py-2.5 text-right">SGST (₹)</th>
                <th className="px-4 py-2.5 text-right">IGST (₹)</th>
                <th className="px-4 py-2.5 text-right font-bold">Total Tax (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr className="hover:bg-muted/30 transition">
                <td className="px-4 py-2.5 font-medium text-foreground">Intra-State (CGST + SGST)</td>
                <td className="px-4 py-2.5 text-right font-mono font-medium">
                  {formatINR(outward?.intraBreakup?.taxable || 0)}
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-muted-foreground">
                  {formatINR(outward?.intraBreakup?.cgst || 0)}
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-muted-foreground">
                  {formatINR(outward?.intraBreakup?.sgst || 0)}
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-muted-foreground">-</td>
                <td className="px-4 py-2.5 text-right font-mono font-bold text-foreground">
                  {formatINR(
                    (outward?.intraBreakup?.cgst || 0) + (outward?.intraBreakup?.sgst || 0)
                  )}
                </td>
              </tr>
              <tr className="hover:bg-muted/30 transition">
                <td className="px-4 py-2.5 font-medium text-foreground">Inter-State (IGST)</td>
                <td className="px-4 py-2.5 text-right font-mono font-medium">
                  {formatINR(outward?.interBreakup?.taxable || 0)}
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-muted-foreground">-</td>
                <td className="px-4 py-2.5 text-right font-mono text-muted-foreground">-</td>
                <td className="px-4 py-2.5 text-right font-mono text-muted-foreground">
                  {formatINR(outward?.interBreakup?.igst || 0)}
                </td>
                <td className="px-4 py-2.5 text-right font-mono font-bold text-foreground">
                  {formatINR(outward?.interBreakup?.igst || 0)}
                </td>
              </tr>
            </tbody>
            <tfoot className="bg-muted/60 border-t-2 border-border font-bold text-xs">
              <tr>
                <td className="px-4 py-2.5 uppercase tracking-wider">Total Outward Supplies:</td>
                <td className="px-4 py-2.5 text-right font-mono">{formatINR(outward?.taxableValue || 0)}</td>
                <td className="px-4 py-2.5 text-right font-mono">{formatINR(outward?.cgst || 0)}</td>
                <td className="px-4 py-2.5 text-right font-mono">{formatINR(outward?.sgst || 0)}</td>
                <td className="px-4 py-2.5 text-right font-mono">{formatINR(outward?.igst || 0)}</td>
                <td className="px-4 py-2.5 text-right font-mono text-indigo-600 dark:text-indigo-400">
                  {formatINR(outward?.totalGstPayable || 0)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Inward Supplies (Input Tax Credit) */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs space-y-2">
        <div className="p-4 border-b border-border">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground">
            2. Inward Supplies & Input Tax Credit (ITC - GSTR-3B Table 4)
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase font-semibold text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-2.5">ITC Description</th>
                <th className="px-4 py-2.5 text-right">Taxable Purchases (₹)</th>
                <th className="px-4 py-2.5 text-right">Input CGST (₹)</th>
                <th className="px-4 py-2.5 text-right">Input SGST (₹)</th>
                <th className="px-4 py-2.5 text-right">Input IGST (₹)</th>
                <th className="px-4 py-2.5 text-right font-bold">Total Eligible ITC (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr className="hover:bg-muted/30 transition">
                <td className="px-4 py-2.5 font-medium text-foreground">
                  All other ITC (Procurement of Goods & Services)
                </td>
                <td className="px-4 py-2.5 text-right font-mono font-medium">{formatINR(inward?.taxableValue || 0)}</td>
                <td className="px-4 py-2.5 text-right font-mono text-muted-foreground">{formatINR(inward?.cgst || 0)}</td>
                <td className="px-4 py-2.5 text-right font-mono text-muted-foreground">{formatINR(inward?.sgst || 0)}</td>
                <td className="px-4 py-2.5 text-right font-mono text-muted-foreground">{formatINR(inward?.igst || 0)}</td>
                <td className="px-4 py-2.5 text-right font-mono font-bold text-cyan-600 dark:text-cyan-400">
                  {formatINR(inward?.totalItc || 0)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
