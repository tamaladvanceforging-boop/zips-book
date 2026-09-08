"use client";

import React, { useEffect, useState } from "react";
import { getTrialBalance } from "@/server/reports/reportActions";
import { formatINR } from "@/lib/gstUtils";
import { formatInputDate } from "@/lib/dateUtils";
import { ExportButtonGroup } from "@/components/UI/ExportButtonGroup";
import { Scale, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";

const TrialBalancePage = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadTrialBalance = async () => {
    setLoading(true);
    const res = await getTrialBalance();
    if (res.success && res.data) {
      setData(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadTrialBalance();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        <RefreshCw className="h-5 w-5 animate-spin mr-2" /> Compiling Trial Balance...
      </div>
    );
  }

  const rows = data?.rows || [];
  const totals = data?.totals || {};
  const isBalanced = totals.isBalanced;

  const exportOptions = {
    filename: `trial-balance-${formatInputDate(new Date())}`,
    title: "Trial Balance Statement (Tally Verification)",
    subtitle: `Closing Dr: ${formatINR(totals.closingDr || 0)} | Closing Cr: ${formatINR(totals.closingCr || 0)} | Status: ${isBalanced ? "Balanced" : `Diff: ${formatINR(totals.difference || 0)}`}`,
    sheetName: "Trial_Balance",
    headers: [
      "Code",
      "Account / Ledger Name",
      "Group Type",
      "Opening Dr (₹)",
      "Opening Cr (₹)",
      "Period Dr (₹)",
      "Period Cr (₹)",
      "Closing Dr (₹)",
      "Closing Cr (₹)",
    ],
    data: rows.map((r: any) => [
      r.code,
      r.name,
      r.type,
      r.openingDr || 0,
      r.openingCr || 0,
      r.periodDr || 0,
      r.periodCr || 0,
      r.closingDr || 0,
      r.closingCr || 0,
    ]),
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-sky-500" />
            <h1 className="text-xl font-bold tracking-tight">Trial Balance (Tally-Style Verification)</h1>
          </div>
          <p className="text-xs text-muted-foreground">
            Summary statement of all ledger account closing balances verifying that Total Debits equal Total Credits.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {isBalanced ? (
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
              <CheckCircle2 className="h-4 w-4" />
              <span>Trial Balance Balanced</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 text-xs font-bold">
              <AlertTriangle className="h-4 w-4" />
              <span>Difference: {formatINR(totals.difference || 0)}</span>
            </div>
          )}
          <ExportButtonGroup exportOptions={exportOptions} />
        </div>
      </div>

      {/* Trial Balance Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase font-semibold text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Account / Ledger Name</th>
                <th className="px-4 py-3">Group Type</th>
                <th className="px-4 py-3 text-right">Opening Dr (₹)</th>
                <th className="px-4 py-3 text-right">Opening Cr (₹)</th>
                <th className="px-4 py-3 text-right">Period Dr (₹)</th>
                <th className="px-4 py-3 text-right">Period Cr (₹)</th>
                <th className="px-4 py-3 text-right font-bold">Closing Dr (₹)</th>
                <th className="px-4 py-3 text-right font-bold">Closing Cr (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((r: any) => (
                <tr key={r.code} className="hover:bg-muted/30 transition">
                  <td className="px-4 py-2.5 font-mono font-bold text-foreground">{r.code}</td>
                  <td className="px-4 py-2.5 font-semibold text-foreground">{r.name}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{r.type}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-muted-foreground">
                    {r.openingDr > 0 ? formatINR(r.openingDr) : "-"}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-muted-foreground">
                    {r.openingCr > 0 ? formatINR(r.openingCr) : "-"}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-muted-foreground">
                    {r.periodDr > 0 ? formatINR(r.periodDr) : "-"}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-muted-foreground">
                    {r.periodCr > 0 ? formatINR(r.periodCr) : "-"}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono font-bold">
                    {r.closingDr > 0 ? (
                      <span className="text-blue-600 dark:text-blue-400">{formatINR(r.closingDr)}</span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono font-bold">
                    {r.closingCr > 0 ? (
                      <span className="text-emerald-600 dark:text-emerald-400">{formatINR(r.closingCr)}</span>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-muted/70 border-t-2 border-border font-bold text-xs">
              <tr>
                <td colSpan={3} className="px-4 py-3 text-right uppercase tracking-wider">
                  Total:
                </td>
                <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                  {formatINR(totals.openingDr || 0)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                  {formatINR(totals.openingCr || 0)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                  {formatINR(totals.periodDr || 0)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                  {formatINR(totals.periodCr || 0)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-blue-600 dark:text-blue-400 text-sm">
                  {formatINR(totals.closingDr || 0)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-emerald-600 dark:text-emerald-400 text-sm">
                  {formatINR(totals.closingCr || 0)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TrialBalancePage;
