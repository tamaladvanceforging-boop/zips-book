"use client";

import React, { useEffect, useState } from "react";
import { getBalanceSheet } from "@/server/reports/reportActions";
import { formatINR } from "@/lib/gstUtils";
import { formatInputDate } from "@/lib/dateUtils";
import { ExportButtonGroup } from "@/components/UI/ExportButtonGroup";
import { Coins, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";

const BalanceSheetPage = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadBS = async () => {
    setLoading(true);
    const res = await getBalanceSheet();
    if (res.success && res.data) {
      setData(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadBS();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        <RefreshCw className="h-5 w-5 animate-spin mr-2" /> Compiling Balance Sheet...
      </div>
    );
  }

  const assets = data?.assets || [];
  const liabilities = data?.liabilities || [];
  const equity = data?.equity || {};
  const isBalanced = data?.isBalanced;

  const exportOptions = {
    filename: `balance-sheet-${formatInputDate(new Date())}`,
    title: "Balance Sheet (Statement of Financial Position)",
    subtitle: `Total Assets: ${formatINR(data?.totalAssets || 0)} | Total Liab. & Equity: ${formatINR(data?.totalLiabilitiesAndEquity || 0)} | Status: ${isBalanced ? "Balanced" : `Variance: ${formatINR(data?.difference || 0)}`}`,
    sheetName: "Balance_Sheet",
    headers: ["Classification", "Account Code", "Particulars / Account Name", "Amount (₹)"],
    data: [
      ...assets.map((a: any) => ["ASSETS", a.code, a.name, a.amount || 0]),
      ["ASSETS", "", "TOTAL ASSETS", data?.totalAssets || 0],
      ...liabilities.map((l: any) => ["LIABILITIES", l.code, l.name, l.amount || 0]),
      ["LIABILITIES", "", "TOTAL LIABILITIES", data?.totalLiabilities || 0],
      ["EQUITY", "3010", "Capital Account", equity.capitalAmount || 0],
      ["EQUITY", "PL", "Net Profit (Current Period)", equity.netProfit || 0],
      ["EQUITY", "", "TOTAL EQUITY", equity.totalEquity || 0],
      ["SUMMARY", "", "TOTAL LIABILITIES & EQUITY", data?.totalLiabilitiesAndEquity || 0],
    ],
  };

  return (
    <div className="space-y-6 max-w-5xl pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-yellow-500" />
            <h1 className="text-xl font-bold tracking-tight">Balance Sheet (Financial Position)</h1>
          </div>
          <p className="text-xs text-muted-foreground">
            Statement of Assets, Liabilities, and Owner's Equity adhering strictly to accounting equation Assets = Liabilities + Capital.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {isBalanced ? (
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
              <CheckCircle2 className="h-4 w-4" />
              <span>Balance Sheet Equation Balanced</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 text-xs font-bold">
              <AlertTriangle className="h-4 w-4" />
              <span>Variance: {formatINR(data?.difference || 0)}</span>
            </div>
          )}
          <ExportButtonGroup exportOptions={exportOptions} />
        </div>
      </div>

      {/* Dual Column Layout: Left Assets, Right Liabilities & Equity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Left Column: ASSETS */}
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs text-xs">
          <div className="p-4 bg-muted/40 border-b border-border font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex justify-between">
            <span>ASSETS (Application of Funds)</span>
            <span>Amount (₹)</span>
          </div>

          <div className="p-4 space-y-2.5">
            {assets.map((a: any) => (
              <div key={a.code} className="flex justify-between py-1 border-b border-border/50">
                <div>
                  <span className="font-semibold text-foreground">{a.name}</span>
                  <span className="text-[10px] text-muted-foreground ml-1.5 font-mono">({a.code})</span>
                </div>
                <span className="font-mono font-medium">{formatINR(a.amount)}</span>
              </div>
            ))}
          </div>

          <div className="p-4 bg-muted/70 border-t-2 border-border flex justify-between items-center font-bold text-sm">
            <span className="uppercase tracking-wider">TOTAL ASSETS:</span>
            <span className="font-mono text-blue-600 dark:text-blue-400 text-base">
              {formatINR(data?.totalAssets || 0)}
            </span>
          </div>
        </div>

        {/* Right Column: LIABILITIES & EQUITY */}
        <div className="space-y-6">
          {/* Liabilities Card */}
          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs text-xs">
            <div className="p-4 bg-muted/40 border-b border-border font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex justify-between">
              <span>LIABILITIES (External Obligations)</span>
              <span>Amount (₹)</span>
            </div>

            <div className="p-4 space-y-2.5">
              {liabilities.map((l: any) => (
                <div key={l.code} className="flex justify-between py-1 border-b border-border/50">
                  <div>
                    <span className="font-semibold text-foreground">{l.name}</span>
                    <span className="text-[10px] text-muted-foreground ml-1.5 font-mono">({l.code})</span>
                  </div>
                  <span className="font-mono font-medium">{formatINR(l.amount)}</span>
                </div>
              ))}
              <div className="flex justify-between pt-1 font-bold text-foreground">
                <span>Total Liabilities:</span>
                <span className="font-mono text-rose-600 dark:text-rose-400">
                  {formatINR(data?.totalLiabilities || 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Equity Card */}
          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs text-xs">
            <div className="p-4 bg-muted/40 border-b border-border font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 flex justify-between">
              <span>EQUITY & RESERVES</span>
              <span>Amount (₹)</span>
            </div>

            <div className="p-4 space-y-2.5">
              <div className="flex justify-between py-1 border-b border-border/50">
                <div>
                  <span className="font-semibold text-foreground">Capital Account</span>
                  <span className="text-[10px] text-muted-foreground ml-1.5 font-mono">(3010)</span>
                </div>
                <span className="font-mono font-medium">{formatINR(equity.capitalAmount || 0)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  Net Profit (Current Period P&L)
                </span>
                <span className="font-mono font-medium text-emerald-600 dark:text-emerald-400">
                  {formatINR(equity.netProfit || 0)}
                </span>
              </div>
              <div className="flex justify-between pt-1 font-bold text-foreground">
                <span>Total Equity:</span>
                <span className="font-mono text-purple-600 dark:text-purple-400">
                  {formatINR(equity.totalEquity || 0)}
                </span>
              </div>
            </div>

            <div className="p-4 bg-muted/70 border-t-2 border-border flex justify-between items-center font-bold text-sm">
              <span className="uppercase tracking-wider text-[11px]">TOTAL LIABILITIES + EQUITY:</span>
              <span className="font-mono text-purple-600 dark:text-purple-400 text-base">
                {formatINR(data?.totalLiabilitiesAndEquity || 0)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BalanceSheetPage;
