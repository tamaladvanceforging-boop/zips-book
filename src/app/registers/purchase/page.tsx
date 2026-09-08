"use client";

import React, { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { getPurchases, deletePurchase } from "@/server/purchases/purchaseActions";
import { formatINR } from "@/lib/gstUtils";
import { formatDisplayDate, formatInputDate } from "@/lib/dateUtils";
import { notify } from "@/lib/notify";
import { ExportButtonGroup } from "@/components/UI/ExportButtonGroup";
import { BookMarked, Plus, Search, Trash2, RefreshCw } from "lucide-react";

const PurchaseRegisterPage = () => {
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pending, startTransition] = useTransition();

  const loadBills = async () => {
    setLoading(true);
    const res = await getPurchases();
    if (res.success && res.data) {
      setBills(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadBills();
  }, []);

  const handleDelete = (id: string, no: string) => {
    if (!confirm(`Are you sure you want to delete purchase bill ${no}? Stock and journal entries will be reversed.`))
      return;
    startTransition(async () => {
      const res = await deletePurchase(id);
      if (res.success) {
        notify.success(`Purchase bill ${no} deleted successfully!`);
      } else {
        notify.error(res.error || "Failed to delete purchase bill");
      }
      loadBills();
    });
  };

  const filtered = bills.filter(
    (b) =>
      b.voucherNo.toLowerCase().includes(search.toLowerCase()) ||
      b.vendorName.toLowerCase().includes(search.toLowerCase()) ||
      (b.vendorBillNo && b.vendorBillNo.toLowerCase().includes(search.toLowerCase())) ||
      (b.vendorGstin && b.vendorGstin.toLowerCase().includes(search.toLowerCase()))
  );

  // Totals
  const totalTaxable = filtered.reduce((s, b) => s + b.taxableValue, 0);
  const totalCgst = filtered.reduce((s, b) => s + b.cgstAmount, 0);
  const totalSgst = filtered.reduce((s, b) => s + b.sgstAmount, 0);
  const totalIgst = filtered.reduce((s, b) => s + b.igstAmount, 0);
  const totalGross = filtered.reduce((s, b) => s + b.totalAmount, 0);

  const exportOptions = {
    filename: `purchase-register-${formatInputDate(new Date())}`,
    title: "Purchase Register (GSTR-2B Inward Supplies)",
    subtitle: `Total Records: ${filtered.length} | Taxable: ${formatINR(totalTaxable)} | Gross: ${formatINR(totalGross)}`,
    sheetName: "Purchase_Register",
    headers: [
      "Voucher No",
      "Vendor Bill No",
      "Bill Date",
      "Vendor Name",
      "GSTIN",
      "State",
      "Supply Type",
      "Taxable Value (₹)",
      "Input CGST (₹)",
      "Input SGST (₹)",
      "Input IGST (₹)",
      "Total Bill Value (₹)",
    ],
    data: filtered.map((b) => [
      b.voucherNo,
      b.vendorBillNo || "N/A",
      formatDisplayDate(b.billDate),
      b.vendorName,
      b.vendorGstin || "N/A",
      b.vendorState || "",
      b.supplyType,
      b.taxableValue,
      b.cgstAmount,
      b.sgstAmount,
      b.igstAmount,
      b.totalAmount,
    ]),
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <BookMarked className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
            <h1 className="text-xl font-bold tracking-tight">Purchase Register (GSTR-2B Inward Supplies)</h1>
          </div>
          <p className="text-xs text-muted-foreground">
            Register of all vendor purchase bills, Input Tax Credit (ITC) eligibility, and vendor procurement history.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <ExportButtonGroup options={exportOptions} disabled={filtered.length === 0} />
          <Link
            href="/vouchers/purchase"
            className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-cyan-700 transition shadow-xs cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>New Bill (F9)</span>
          </Link>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
        <div className="rounded-xl border border-border bg-card p-3.5">
          <div className="text-muted-foreground font-medium text-[11px]">Bills Count</div>
          <div className="text-lg font-bold mt-1 text-foreground">{filtered.length} Bills</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-3.5">
          <div className="text-muted-foreground font-medium text-[11px]">Taxable Purchases</div>
          <div className="text-lg font-bold mt-1 font-mono text-foreground">{formatINR(totalTaxable)}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-3.5">
          <div className="text-muted-foreground font-medium text-[11px]">Input CGST (ITC)</div>
          <div className="text-lg font-bold mt-1 font-mono text-cyan-600 dark:text-cyan-400">
            {formatINR(totalCgst)}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-3.5">
          <div className="text-muted-foreground font-medium text-[11px]">Input SGST (ITC)</div>
          <div className="text-lg font-bold mt-1 font-mono text-cyan-600 dark:text-cyan-400">
            {formatINR(totalSgst)}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-3.5 col-span-2 sm:col-span-1">
          <div className="text-muted-foreground font-medium text-[11px]">Total Purchases Value</div>
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
            placeholder="Search by voucher no, bill no, vendor, or GSTIN..."
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
                <th className="px-4 py-3">Voucher No</th>
                <th className="px-4 py-3">Bill No</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Vendor Name</th>
                <th className="px-4 py-3">GSTIN</th>
                <th className="px-4 py-3">State</th>
                <th className="px-4 py-3 text-right">Taxable (₹)</th>
                <th className="px-4 py-3 text-right">CGST (₹)</th>
                <th className="px-4 py-3 text-right">SGST (₹)</th>
                <th className="px-4 py-3 text-right">IGST (₹)</th>
                <th className="px-4 py-3 text-right font-bold">Total Bill (₹)</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={12} className="text-center py-8 text-muted-foreground">
                    <RefreshCw className="h-4 w-4 animate-spin mx-auto mb-1" /> Loading Purchase Register...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={12} className="text-center py-8 text-muted-foreground">
                    No purchase bills recorded in register.
                  </td>
                </tr>
              ) : (
                filtered.map((b) => (
                  <tr key={b.id} className="hover:bg-muted/30 transition">
                    <td className="px-4 py-3 font-mono font-bold text-foreground">{b.voucherNo}</td>
                    <td className="px-4 py-3 font-mono text-muted-foreground">{b.vendorBillNo || "N/A"}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDisplayDate(b.billDate)}
                    </td>
                    <td className="px-4 py-3 font-semibold text-foreground">{b.vendorName}</td>
                    <td className="px-4 py-3 font-mono text-muted-foreground">
                      {b.vendorGstin || <span className="italic text-[10px]">Unregistered</span>}
                    </td>
                    <td className="px-4 py-3">{b.vendorState}</td>
                    <td className="px-4 py-3 text-right font-mono font-medium">{formatINR(b.taxableValue)}</td>
                    <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                      {formatINR(b.cgstAmount)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                      {formatINR(b.sgstAmount)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                      {formatINR(b.igstAmount)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-cyan-600 dark:text-cyan-400">
                      {formatINR(b.totalAmount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleDelete(b.id, b.voucherNo)}
                          disabled={pending}
                          className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-muted transition"
                          title="Delete Bill"
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
                  <td className="px-4 py-3 text-right font-mono text-cyan-600 dark:text-cyan-400">
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
};

export default PurchaseRegisterPage;
