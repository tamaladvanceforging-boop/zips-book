"use client";

import React, { useEffect, useState } from "react";
import { getProfitLoss } from "@/server/reports/reportActions";
import { formatINR } from "@/lib/gstUtils";
import { TrendingUp, RefreshCw } from "lucide-react";

export default function ProfitLossPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadPL = async () => {
    setLoading(true);
    const res = await getProfitLoss();
    if (res.success && res.data) {
      setData(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadPL();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        <RefreshCw className="h-5 w-5 animate-spin mr-2" /> Compiling Profit & Loss Statement...
      </div>
    );
  }

  const income = data?.income || {};
  const cogs = data?.cogs || {};
  const expenses = data?.expenses || [];
  const grossProfit = data?.grossProfit || 0;
  const netProfit = data?.netProfit || 0;

  return (
    <div className="space-y-6 max-w-4xl pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-500" />
            <h1 className="text-xl font-bold tracking-tight">Profit & Loss Statement (Income Statement)</h1>
          </div>
          <p className="text-xs text-muted-foreground">
            Operational financial performance showing Revenue, Cost of Goods Sold (COGS), Gross Margin, and Net Profit.
          </p>
        </div>
      </div>

      {/* Hero Result Banner */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-xs flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Current Period Result
          </span>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`text-3xl font-extrabold font-mono ${
                netProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {formatINR(netProfit)}
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                netProfit >= 0
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-rose-500/10 text-rose-600"
              }`}
            >
              {netProfit >= 0 ? "Net Profit" : "Net Loss"}
            </span>
          </div>
        </div>

        <div className="text-right text-xs text-muted-foreground">
          <div>Gross Margin: {formatINR(grossProfit)}</div>
          <div>Total Revenue: {formatINR(income.totalIncome || 0)}</div>
        </div>
      </div>

      {/* Statement Card */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs text-xs">
        {/* Section 1: Income */}
        <div className="p-4 bg-muted/40 border-b border-border font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex justify-between">
          <span>1. Income / Revenue from Operations</span>
          <span>Amount (₹)</span>
        </div>
        <div className="p-4 space-y-2.5">
          <div className="flex justify-between py-1 border-b border-border/50">
            <span className="font-medium text-foreground">4010 - Sales Account (Operating Revenue)</span>
            <span className="font-mono font-semibold">{formatINR(income.sales || 0)}</span>
          </div>
          <div className="flex justify-between pt-1 font-bold text-foreground">
            <span>Total Income:</span>
            <span className="font-mono text-emerald-600 dark:text-emerald-400">
              {formatINR(income.totalIncome || 0)}
            </span>
          </div>
        </div>

        {/* Section 2: Cost of Goods Sold */}
        <div className="p-4 bg-muted/40 border-y border-border font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 flex justify-between">
          <span>2. Cost of Goods Sold (COGS)</span>
          <span>Amount (₹)</span>
        </div>
        <div className="p-4 space-y-2.5">
          <div className="flex justify-between py-1 border-b border-border/50">
            <span className="font-medium text-foreground">5010 - Purchase Account (Procurement)</span>
            <span className="font-mono font-semibold">{formatINR(cogs.purchases || 0)}</span>
          </div>
          <div className="flex justify-between pt-1 font-bold text-foreground">
            <span>Total Cost of Goods Sold:</span>
            <span className="font-mono text-cyan-600 dark:text-cyan-400">
              {formatINR(cogs.totalCogs || 0)}
            </span>
          </div>
        </div>

        {/* Gross Profit Intermediate Bar */}
        <div className="p-4 bg-primary/5 border-y border-primary/20 flex justify-between items-center font-bold text-sm">
          <span className="text-primary uppercase tracking-wide">Gross Profit (1 - 2):</span>
          <span className="font-mono text-primary text-base">{formatINR(grossProfit)}</span>
        </div>

        {/* Section 3: Indirect Expenses */}
        <div className="p-4 bg-muted/40 border-y border-border font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex justify-between">
          <span>3. Indirect Operating Expenses</span>
          <span>Amount (₹)</span>
        </div>
        <div className="p-4 space-y-2.5">
          {expenses.map((e: any) => (
            <div key={e.code} className="flex justify-between py-1 border-b border-border/50">
              <span className="text-foreground">
                {e.code} - {e.name}
              </span>
              <span className="font-mono font-medium">{formatINR(e.amount)}</span>
            </div>
          ))}
          <div className="flex justify-between pt-1 font-bold text-foreground">
            <span>Total Indirect Expenses:</span>
            <span className="font-mono text-amber-600 dark:text-amber-400">
              {formatINR(data?.totalIndirectExpenses || 0)}
            </span>
          </div>
        </div>

        {/* Net Profit Final Bar */}
        <div className="p-5 bg-card border-t-2 border-border flex justify-between items-center font-extrabold text-base">
          <span className="uppercase tracking-wider">NET PROFIT / (LOSS):</span>
          <span
            className={`font-mono text-xl ${
              netProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
            }`}
          >
            {formatINR(netProfit)}
          </span>
        </div>
      </div>
    </div>
  );
}
