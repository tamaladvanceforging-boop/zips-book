"use client";

import React, { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { getInvoices, deleteInvoice } from "@/server/invoices/invoiceActions";
import { formatINR } from "@/lib/gstUtils";
import { BookMarked, Plus, Search, Download, Trash2, RefreshCw } from "lucide-react";

export default function SalesRegisterPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pending, startTransition] = useTransition();

  const loadInvoices = async () => {
    setLoading(true);
    const res = await getInvoices();
    if (res.success && res.data) {
      setInvoices(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const handleDelete = (id: string, no: string) => {
    if (!confirm(`Are you sure you want to delete invoice ${no}? Stock and journal entries will be reversed.`))
      return;
    startTransition(async () => {
      await deleteInvoice(id);
      loadInvoices();
    });
  };

  const filtered = invoices.filter(
    (inv) =>
      inv.invoiceNo.toLowerCase().includes(search.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(search.toLowerCase()) ||
      (inv.customerGstin && inv.customerGstin.toLowerCase().includes(search.toLowerCase())) ||
      (inv.customerState && inv.customerState.toLowerCase().includes(search.toLowerCase()))
  );

  // Totals
  const totalTaxable = filtered.reduce((s, i) => s + i.taxableValue, 0);
  const totalCgst = filtered.reduce((s, i) => s + i.cgstAmount, 0);
  const totalSgst = filtered.reduce((s, i) => s + i.sgstAmount, 0);
  const totalIgst = filtered.reduce((s, i) => s + i.igstAmount, 0);
  const totalGross = filtered.reduce((s, i) => s + i.totalAmount, 0);

  const exportCSV = () => {
    const headers = [
      "Invoice No",
      "Date",
      "Customer Name",
      "GSTIN",
      "State",
      "Supply Type",
      "Taxable Value",
      "CGST",
      "SGST",
      "IGST",
      "Total Invoice Value",
    ];
    const rows = filtered.map((i) => [
      i.invoiceNo,
      new Date(i.invoiceDate).toLocaleDateString("en-IN"),
      `"${i.customerName}"`,
      i.customerGstin || "N/A",
      i.customerState || "",
      `"${i.supplyType}"`,
      i.taxableValue,
      i.cgstAmount,
      i.sgstAmount,
      i.igstAmount,
      i.totalAmount,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sales-register-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <BookMarked className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <h1 className="text-xl font-bold tracking-tight">Sales Register (GSTR-1 Outward Supplies)</h1>
          </div>
          <p className="text-xs text-muted-foreground">
            Historical register of all finalized Tax Invoices, GST breakups, and exportable GSTR-1 records.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-secondary px-3 py-2 text-xs font-semibold text-secondary-foreground hover:bg-muted transition cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
          <Link
            href="/vouchers/sales"
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition shadow-xs cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>New Invoice (F8)</span>
          </Link>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
        <div className="rounded-xl border border-border bg-card p-3.5">
          <div className="text-muted-foreground font-medium text-[11px]">Invoices Count</div>
          <div className="text-lg font-bold mt-1 text-foreground">{filtered.length} Invoices</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-3.5">
          <div className="text-muted-foreground font-medium text-[11px]">Taxable Turnover</div>
          <div className="text-lg font-bold mt-1 font-mono text-foreground">{formatINR(totalTaxable)}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-3.5">
          <div className="text-muted-foreground font-medium text-[11px]">Central Tax (CGST)</div>
          <div className="text-lg font-bold mt-1 font-mono text-emerald-600 dark:text-emerald-400">
            {formatINR(totalCgst)}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-3.5">
          <div className="text-muted-foreground font-medium text-[11px]">State Tax (SGST)</div>
          <div className="text-lg font-bold mt-1 font-mono text-emerald-600 dark:text-emerald-400">
            {formatINR(totalSgst)}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-3.5 col-span-2 sm:col-span-1">
          <div className="text-muted-foreground font-medium text-[11px]">Total Invoice Value</div>
          <div className="text-lg font-bold mt-1 font-mono text-primary">{formatINR(totalGross)}</div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by invoice no, customer, GSTIN, or state..."
            className="w-full rounded-lg border border-input bg-card pl-9 pr-4 py-2 text-xs outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase font-semibold text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-3">Invoice No</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Customer Name</th>
                <th className="px-4 py-3">GSTIN</th>
                <th className="px-4 py-3">State</th>
                <th className="px-4 py-3">Supply Type</th>
                <th className="px-4 py-3 text-right">Taxable (₹)</th>
                <th className="px-4 py-3 text-right">CGST (₹)</th>
                <th className="px-4 py-3 text-right">SGST (₹)</th>
                <th className="px-4 py-3 text-right">IGST (₹)</th>
                <th className="px-4 py-3 text-right font-bold">Total (₹)</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={12} className="text-center py-8 text-muted-foreground">
                    <RefreshCw className="h-4 w-4 animate-spin mx-auto mb-1" /> Loading Sales Register...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={12} className="text-center py-8 text-muted-foreground">
                    No sales invoices found in register.
                  </td>
                </tr>
              ) : (
                filtered.map((inv) => (
                  <tr key={inv.id} className="hover:bg-muted/30 transition">
                    <td className="px-4 py-3 font-mono font-bold text-foreground">{inv.invoiceNo}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(inv.invoiceDate).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-4 py-3 font-semibold text-foreground">{inv.customerName}</td>
                    <td className="px-4 py-3 font-mono text-muted-foreground">
                      {inv.customerGstin || <span className="italic text-[10px]">Unregistered</span>}
                    </td>
                    <td className="px-4 py-3">{inv.customerState}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded bg-muted text-[10px] font-medium border border-border">
                        {inv.supplyType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-medium">{formatINR(inv.taxableValue)}</td>
                    <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                      {formatINR(inv.cgstAmount)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                      {formatINR(inv.sgstAmount)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                      {formatINR(inv.igstAmount)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {formatINR(inv.totalAmount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleDelete(inv.id, inv.invoiceNo)}
                          disabled={pending}
                          className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-muted transition"
                          title="Delete Invoice"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filtered.length > 0 && (
              <tfoot className="bg-muted/60 border-t-2 border-border font-bold text-xs">
                <tr>
                  <td colSpan={6} className="px-4 py-3 text-right uppercase tracking-wider">
                    Total:
                  </td>
                  <td className="px-4 py-3 text-right font-mono">{formatINR(totalTaxable)}</td>
                  <td className="px-4 py-3 text-right font-mono">{formatINR(totalCgst)}</td>
                  <td className="px-4 py-3 text-right font-mono">{formatINR(totalSgst)}</td>
                  <td className="px-4 py-3 text-right font-mono">{formatINR(totalIgst)}</td>
                  <td className="px-4 py-3 text-right font-mono text-emerald-600 dark:text-emerald-400">
                    {formatINR(totalGross)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
