"use client";

import React, { useEffect, useState, useCallback } from "react";
import { getDayBook } from "@/server/reports/reportActions";
import { formatINR } from "@/lib/gstUtils";
import { formatDisplayDate, formatInputDate } from "@/lib/dateUtils";
import { ExportButtonGroup } from "@/components/UI/ExportButtonGroup";
import { BookOpen, RefreshCw, CheckCircle2 } from "lucide-react";

const DayBookPage = () => {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [voucherType, setVoucherType] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const loadEntries = useCallback(async () => {
    setLoading(true);
    const res = await getDayBook(startDate || undefined, endDate || undefined, voucherType);
    if (res.success && res.data) {
      setEntries(res.data);
    }
    setLoading(false);
  }, [startDate, endDate, voucherType]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  // Flatten journal lines for Day Book view matching Excel layout
  const flatRows: {
    date: Date;
    voucherType: string;
    voucherNo: string;
    accountName: string;
    debit: number;
    credit: number;
    narration: string;
  }[] = [];

  let totalDebit = 0;
  let totalCredit = 0;

  for (const entry of entries) {
    for (const line of entry.lines) {
      flatRows.push({
        date: entry.entryDate,
        voucherType: entry.voucherType,
        voucherNo: entry.voucherNo,
        accountName: line.accountName,
        debit: line.debit,
        credit: line.credit,
        narration: line.narration || entry.narration || "",
      });
      totalDebit += line.debit;
      totalCredit += line.credit;
    }
  }

  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  const exportOptions = {
    filename: `daybook-${formatInputDate(new Date())}`,
    title: "Day Book (General Journal Ledger)",
    subtitle: `Total Debit: ${formatINR(totalDebit)} | Total Credit: ${formatINR(totalCredit)} | Status: ${isBalanced ? "Balanced" : "Unbalanced"}`,
    sheetName: "Day_Book",
    headers: [
      "Date",
      "Voucher Type",
      "Voucher No",
      "Particulars (Account)",
      "Debit (₹)",
      "Credit (₹)",
      "Narration",
    ],
    data: flatRows.map((r) => [
      formatDisplayDate(r.date),
      r.voucherType,
      r.voucherNo,
      r.accountName,
      r.debit,
      r.credit,
      r.narration,
    ]),
  };

  const getTypeColor = (t: string) => {
    switch (t) {
      case "Sales":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
      case "Purchase":
        return "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20";
      case "Payment":
        return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";
      case "Receipt":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
      case "Contra":
        return "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20";
      case "Journal":
        return "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20";
      case "Credit Note":
        return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20";
      case "Debit Note":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-violet-500" />
            <h1 className="text-xl font-bold tracking-tight">Day Book (General Journal Ledger)</h1>
          </div>
          <p className="text-xs text-muted-foreground">
            Complete chronological double-entry journal record auto-generated from all Sales, Purchases, Payments, Receipts, Contras, and Notes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isBalanced ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
              <CheckCircle2 className="h-4 w-4" />
              <span>Double-Entry Balanced</span>
            </div>
          ) : (
            <div className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 text-xs font-semibold">
              Check Entries ({formatINR(Math.abs(totalDebit - totalCredit))})
            </div>
          )}
          <ExportButtonGroup options={exportOptions} disabled={flatRows.length === 0} />
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 shadow-xs">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-muted-foreground font-medium">Voucher Type:</span>
          {["ALL", "Sales", "Purchase", "Payment", "Receipt", "Contra", "Journal", "Credit Note", "Debit Note"].map((type) => (
            <button
              key={type}
              onClick={() => setVoucherType(type)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition cursor-pointer ${
                voucherType === type
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-md border border-input bg-background px-2.5 py-1 text-xs outline-none focus:border-primary"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-md border border-input bg-background px-2.5 py-1 text-xs outline-none focus:border-primary"
            />
          </div>
          {(startDate || endDate) && (
            <button
              onClick={() => {
                setStartDate("");
                setEndDate("");
              }}
              className="text-xs text-muted-foreground hover:text-foreground underline cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Day Book Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase font-semibold text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Voucher No</th>
                <th className="px-4 py-3">Account / Ledger</th>
                <th className="px-4 py-3 text-right">Debit (₹)</th>
                <th className="px-4 py-3 text-right">Credit (₹)</th>
                <th className="px-4 py-3">Narration / Particulars</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-muted-foreground">
                    <RefreshCw className="h-4 w-4 animate-spin mx-auto mb-1" /> Loading Day Book...
                  </td>
                </tr>
              ) : flatRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-muted-foreground">
                    No transactions recorded for this period.
                  </td>
                </tr>
              ) : (
                flatRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-muted/30 transition">
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {formatDisplayDate(row.date)}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-0.5 rounded border text-[10px] font-semibold ${getTypeColor(row.voucherType)}`}>
                        {row.voucherType}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-mono font-bold text-foreground">{row.voucherNo}</td>
                    <td className="px-4 py-2.5 font-semibold text-foreground">{row.accountName}</td>
                    <td className="px-4 py-2.5 text-right font-mono font-medium">
                      {row.debit > 0 ? formatINR(row.debit) : ""}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono font-medium">
                      {row.credit > 0 ? formatINR(row.credit) : ""}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground text-[11px] truncate max-w-[280px]">
                      {row.narration}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {flatRows.length > 0 && (
              <tfoot className="bg-muted/70 border-t-2 border-border font-bold text-xs">
                <tr>
                  <td colSpan={4} className="px-4 py-3 text-right uppercase tracking-wider">
                    Total:
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-foreground">
                    {formatINR(totalDebit)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-foreground">
                    {formatINR(totalCredit)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                      ✓ Dr = Cr Balanced
                    </span>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};

export default DayBookPage;
