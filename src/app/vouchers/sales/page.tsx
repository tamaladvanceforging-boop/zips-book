"use client";

import React, { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { getCompanyProfile } from "@/server/company/companyActions";
import { getCustomers } from "@/server/customers/customerActions";
import { getItems } from "@/server/items/itemActions";
import { createInvoice, InvoiceItemInput } from "@/server/invoices/invoiceActions";
import { formatINR, getSupplyType, computeGst, numberToWordsINR } from "@/lib/gstUtils";
import {
  FileSpreadsheet,
  Plus,
  Trash2,
  Printer,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Eye,
  X,
} from "lucide-react";

export default function SalesInvoicePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const [company, setCompany] = useState<any>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [itemsMaster, setItemsMaster] = useState<any[]>([]);

  // Invoice Form State
  const [invoiceNo, setInvoiceNo] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerGstin, setCustomerGstin] = useState("");
  const [customerState, setCustomerState] = useState("West Bengal");
  const [customerStateCode, setCustomerStateCode] = useState("19");
  const [supplyType, setSupplyType] = useState<"Intra-State (CGST+SGST)" | "Inter-State (IGST)">(
    "Intra-State (CGST+SGST)"
  );
  const [notes, setNotes] = useState("Note: This is a computer-generated invoice.");

  const [lines, setLines] = useState<InvoiceItemInput[]>([
    {
      itemId: "",
      itemCode: "",
      itemName: "",
      hsnSac: "",
      unit: "PCS",
      qty: 1,
      rate: 0,
      taxableValue: 0,
      gstRate: 18,
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: 0,
      totalAmount: 0,
    },
  ]);

  useEffect(() => {
    async function init() {
      const [compRes, custRes, itemRes] = await Promise.all([
        getCompanyProfile(),
        getCustomers(),
        getItems(),
      ]);

      if (compRes.success && compRes.data) {
        setCompany(compRes.data);
        const prefix = compRes.data.invoicePrefix || "INV-";
        const nextNo = compRes.data.nextInvoiceNo || 1;
        setInvoiceNo(`${prefix}${String(nextNo).padStart(5, "0")}`);
      }
      if (custRes.success && custRes.data) {
        setCustomers(custRes.data);
        if (custRes.data.length > 0) {
          selectCustomer(custRes.data[0], compRes.data?.stateCode || "19");
        }
      }
      if (itemRes.success && itemRes.data) {
        setItemsMaster(itemRes.data);
        if (itemRes.data.length > 0) {
          applyItemToLine(0, itemRes.data[0], compRes.data?.stateCode || "19", custRes.data?.[0]?.stateCode || "19");
        }
      }
      setLoading(false);
    }
    init();
  }, []);

  const selectCustomer = (cust: any, companyStateCode = company?.stateCode || "19") => {
    setSelectedCustomerId(cust.id);
    setCustomerName(cust.name);
    setCustomerAddress(cust.address || "");
    setCustomerGstin(cust.gstin || "");
    setCustomerState(cust.state || "West Bengal");
    setCustomerStateCode(cust.stateCode || "19");

    const calculatedSupply = getSupplyType(companyStateCode, cust.stateCode);
    setSupplyType(calculatedSupply);

    // Recompute existing lines with new supply type
    setLines((prev) =>
      prev.map((l) => {
        const taxable = Math.round(l.qty * l.rate * 100) / 100;
        const tax = computeGst(taxable, l.gstRate, calculatedSupply);
        return {
          ...l,
          taxableValue: taxable,
          cgstAmount: tax.cgstAmount,
          sgstAmount: tax.sgstAmount,
          igstAmount: tax.igstAmount,
          totalAmount: tax.totalAmount,
        };
      })
    );
  };

  const handleCustomerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cust = customers.find((c) => c.id === e.target.value);
    if (cust) {
      selectCustomer(cust);
    }
  };

  const applyItemToLine = (
    index: number,
    item: any,
    compCode = company?.stateCode || "19",
    partyCode = customerStateCode
  ) => {
    const stType = getSupplyType(compCode, partyCode);
    setLines((prev) => {
      const updated = [...prev];
      const qty = updated[index]?.qty || 1;
      const rate = item.rate || 0;
      const taxable = Math.round(qty * rate * 100) / 100;
      const tax = computeGst(taxable, item.gstRate, stType);

      updated[index] = {
        itemId: item.id,
        itemCode: item.code,
        itemName: item.name,
        hsnSac: item.hsnSac,
        unit: item.unit,
        qty,
        rate,
        taxableValue: taxable,
        gstRate: item.gstRate,
        cgstAmount: tax.cgstAmount,
        sgstAmount: tax.sgstAmount,
        igstAmount: tax.igstAmount,
        totalAmount: tax.totalAmount,
      };
      return updated;
    });
  };

  const handleItemSelect = (index: number, itemId: string) => {
    const item = itemsMaster.find((i) => i.id === itemId);
    if (item) {
      applyItemToLine(index, item);
    }
  };

  const handleQtyChange = (index: number, qty: number) => {
    setLines((prev) => {
      const updated = [...prev];
      const l = updated[index];
      const cleanQty = Math.max(1, qty);
      const taxable = Math.round(cleanQty * l.rate * 100) / 100;
      const tax = computeGst(taxable, l.gstRate, supplyType);

      updated[index] = {
        ...l,
        qty: cleanQty,
        taxableValue: taxable,
        cgstAmount: tax.cgstAmount,
        sgstAmount: tax.sgstAmount,
        igstAmount: tax.igstAmount,
        totalAmount: tax.totalAmount,
      };
      return updated;
    });
  };

  const handleRateChange = (index: number, rate: number) => {
    setLines((prev) => {
      const updated = [...prev];
      const l = updated[index];
      const cleanRate = Math.max(0, rate);
      const taxable = Math.round(l.qty * cleanRate * 100) / 100;
      const tax = computeGst(taxable, l.gstRate, supplyType);

      updated[index] = {
        ...l,
        rate: cleanRate,
        taxableValue: taxable,
        cgstAmount: tax.cgstAmount,
        sgstAmount: tax.sgstAmount,
        igstAmount: tax.igstAmount,
        totalAmount: tax.totalAmount,
      };
      return updated;
    });
  };

  const addLine = () => {
    if (itemsMaster.length === 0) return;
    const defaultItem = itemsMaster[0];
    const taxable = defaultItem.rate;
    const tax = computeGst(taxable, defaultItem.gstRate, supplyType);
    setLines((prev) => [
      ...prev,
      {
        itemId: defaultItem.id,
        itemCode: defaultItem.code,
        itemName: defaultItem.name,
        hsnSac: defaultItem.hsnSac,
        unit: defaultItem.unit,
        qty: 1,
        rate: defaultItem.rate,
        taxableValue: taxable,
        gstRate: defaultItem.gstRate,
        cgstAmount: tax.cgstAmount,
        sgstAmount: tax.sgstAmount,
        igstAmount: tax.igstAmount,
        totalAmount: tax.totalAmount,
      },
    ]);
  };

  const removeLine = (index: number) => {
    if (lines.length <= 1) return;
    setLines((prev) => prev.filter((_, i) => i !== index));
  };

  // Calculations
  const totalTaxable = Math.round(lines.reduce((s, l) => s + l.taxableValue, 0) * 100) / 100;
  const totalCgst = Math.round(lines.reduce((s, l) => s + l.cgstAmount, 0) * 100) / 100;
  const totalSgst = Math.round(lines.reduce((s, l) => s + l.sgstAmount, 0) * 100) / 100;
  const totalIgst = Math.round(lines.reduce((s, l) => s + l.igstAmount, 0) * 100) / 100;
  const grandTotalExact = totalTaxable + totalCgst + totalSgst + totalIgst;
  const grandTotal = Math.round(grandTotalExact);
  const roundOff = Math.round((grandTotal - grandTotalExact) * 100) / 100;

  const handleSaveInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName) {
      setFeedback({ type: "error", message: "Please select or enter customer details." });
      return;
    }
    if (lines.length === 0 || lines.some((l) => !l.itemCode)) {
      setFeedback({ type: "error", message: "Invoice must have at least one valid item." });
      return;
    }

    setFeedback(null);
    startTransition(async () => {
      const res = await createInvoice({
        invoiceNo,
        invoiceDate,
        dueDate: dueDate || undefined,
        customerId: selectedCustomerId,
        customerName,
        customerAddress,
        customerGstin,
        customerState,
        customerStateCode,
        supplyType,
        taxableValue: totalTaxable,
        cgstAmount: totalCgst,
        sgstAmount: totalSgst,
        igstAmount: totalIgst,
        roundOff,
        totalAmount: grandTotal,
        notes,
        items: lines,
      });

      if (res.success) {
        setFeedback({
          type: "success",
          message: `Invoice ${invoiceNo} generated & posted to Day Book successfully!`,
        });
        setTimeout(() => {
          router.push("/registers/sales");
        }, 1200);
      } else {
        setFeedback({ type: "error", message: res.error || "Failed to create invoice." });
      }
    });
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        <RefreshCw className="h-5 w-5 animate-spin mr-2" /> Initializing Tax Invoice form...
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <h1 className="text-xl font-bold tracking-tight">Sales Invoice (Tax Invoice - F8)</h1>
          </div>
          <p className="text-xs text-muted-foreground">
            Create GST-compliant Tax Invoices with automatic Intra/Inter-state tax calculation, double-entry Day Book posting, and instant print preview.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-secondary px-3.5 py-2 text-xs font-semibold text-secondary-foreground hover:bg-muted transition cursor-pointer"
          >
            <Eye className="h-4 w-4" />
            <span>Preview & Print</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`flex items-center gap-2 p-3 rounded-lg text-xs font-medium border ${
            feedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
              : "bg-destructive/10 border-destructive/30 text-destructive"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      <form onSubmit={handleSaveInvoice} className="space-y-6">
        {/* Invoice Meta Grid */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-xs">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-medium text-foreground">Invoice Number *</label>
              <input
                required
                type="text"
                value={invoiceNo}
                onChange={(e) => setInvoiceNo(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs font-mono font-bold outline-none focus:border-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-foreground">Invoice Date *</label>
              <input
                required
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs outline-none focus:border-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-foreground">Payment Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs outline-none focus:border-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-foreground">Supply Type (GST)</label>
              <div className="w-full rounded-md border border-border bg-muted/50 px-3 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                {supplyType}
              </div>
            </div>
          </div>

          {/* Customer Selection Row */}
          <div className="border-t border-border pt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-medium text-foreground">Select Customer *</label>
              <select
                value={selectedCustomerId}
                onChange={handleCustomerChange}
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs outline-none focus:border-primary font-medium"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code}) - {c.state}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-medium text-foreground">Billing Address</label>
              <input
                type="text"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs outline-none focus:border-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-foreground">Customer GSTIN</label>
              <input
                type="text"
                value={customerGstin}
                onChange={(e) => setCustomerGstin(e.target.value.toUpperCase())}
                placeholder="Unregistered if blank"
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs font-mono uppercase outline-none focus:border-primary"
              />
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs space-y-2">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Invoice Line Items
            </h2>
            <button
              type="button"
              onClick={addLine}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Item Line</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  <th className="px-3 py-2.5 w-12 text-center">#</th>
                  <th className="px-3 py-2.5 min-w-[200px]">Item / Service</th>
                  <th className="px-3 py-2.5 w-24">HSN/SAC</th>
                  <th className="px-3 py-2.5 w-20 text-center">Unit</th>
                  <th className="px-3 py-2.5 w-24 text-right">Qty</th>
                  <th className="px-3 py-2.5 w-28 text-right">Rate (₹)</th>
                  <th className="px-3 py-2.5 w-28 text-right">Taxable (₹)</th>
                  <th className="px-3 py-2.5 w-20 text-center">GST %</th>
                  <th className="px-3 py-2.5 w-28 text-right">Tax Total</th>
                  <th className="px-3 py-2.5 w-28 text-right">Total (₹)</th>
                  <th className="px-3 py-2.5 w-12 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {lines.map((line, idx) => (
                  <tr key={idx} className="hover:bg-muted/20 transition">
                    <td className="px-3 py-2 text-center font-mono text-muted-foreground">{idx + 1}</td>
                    <td className="px-3 py-2">
                      <select
                        value={line.itemId || ""}
                        onChange={(e) => handleItemSelect(idx, e.target.value)}
                        className="w-full rounded border border-input bg-background px-2 py-1 text-xs outline-none focus:border-primary font-medium"
                      >
                        {itemsMaster.map((itm) => (
                          <option key={itm.id} value={itm.id}>
                            {itm.name} ({itm.code})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2 font-mono text-muted-foreground">{line.hsnSac}</td>
                    <td className="px-3 py-2 text-center">
                      <span className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono border border-border">
                        {line.unit}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={line.qty}
                        onChange={(e) => handleQtyChange(idx, Number(e.target.value))}
                        className="w-20 rounded border border-input bg-background px-2 py-1 text-right text-xs outline-none focus:border-primary"
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number"
                        step="0.01"
                        value={line.rate}
                        onChange={(e) => handleRateChange(idx, Number(e.target.value))}
                        className="w-24 rounded border border-input bg-background px-2 py-1 text-right text-xs outline-none focus:border-primary"
                      />
                    </td>
                    <td className="px-3 py-2 text-right font-medium">{formatINR(line.taxableValue)}</td>
                    <td className="px-3 py-2 text-center font-semibold text-emerald-600 dark:text-emerald-400">
                      {line.gstRate}%
                    </td>
                    <td className="px-3 py-2 text-right text-muted-foreground">
                      {formatINR(line.cgstAmount + line.sgstAmount + line.igstAmount)}
                    </td>
                    <td className="px-3 py-2 text-right font-bold text-foreground">
                      {formatINR(line.totalAmount)}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => removeLine(idx)}
                        disabled={lines.length <= 1}
                        className="p-1 rounded text-muted-foreground hover:text-destructive disabled:opacity-30"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Invoice Summary & Tax Breakup Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: Bank Details & Amount in Words */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-xs text-xs">
            <h3 className="font-semibold uppercase tracking-wider text-muted-foreground text-[10px]">
              Payment & Bank Instructions
            </h3>
            <div className="p-3 rounded-lg bg-muted/40 border border-border space-y-1">
              <div>
                <span className="text-muted-foreground">Bank Name:</span>{" "}
                <span className="font-semibold text-foreground">{company?.bankName}</span>
              </div>
              <div>
                <span className="text-muted-foreground">A/C No:</span>{" "}
                <span className="font-mono font-semibold text-foreground">{company?.bankAccountNo}</span>
              </div>
              <div>
                <span className="text-muted-foreground">IFSC Code:</span>{" "}
                <span className="font-mono font-semibold text-foreground">{company?.ifscCode}</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="font-semibold text-muted-foreground uppercase text-[10px]">
                Amount in Words:
              </span>
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs font-semibold text-primary">
                {numberToWordsINR(grandTotal)}
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-medium text-foreground">Invoice Notes</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Right Column: Tax Calculation Summary Card */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3 shadow-xs text-xs">
            <h3 className="font-semibold uppercase tracking-wider text-muted-foreground text-[10px]">
              Tax & Total Breakdown
            </h3>

            <div className="space-y-2 border-b border-border pb-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal (Taxable Value):</span>
                <span className="font-mono font-medium">{formatINR(totalTaxable)}</span>
              </div>

              {supplyType === "Intra-State (CGST+SGST)" ? (
                <>
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                    <span>Central GST (CGST):</span>
                    <span className="font-mono font-medium">+{formatINR(totalCgst)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                    <span>State GST (SGST):</span>
                    <span className="font-mono font-medium">+{formatINR(totalSgst)}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between text-indigo-600 dark:text-indigo-400">
                  <span>Integrated GST (IGST):</span>
                  <span className="font-mono font-medium">+{formatINR(totalIgst)}</span>
                </div>
              )}

              {roundOff !== 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Round Off:</span>
                  <span className="font-mono">{formatINR(roundOff)}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-sm font-bold text-foreground">Grand Total:</span>
              <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {formatINR(grandTotal)}
              </span>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition shadow-xs cursor-pointer"
              >
                {saving ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" /> Posting to Day Book & Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" /> Save & Post Invoice (F8)
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Tax Invoice Print / Preview Modal */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-md p-4 overflow-y-auto">
          <div className="relative w-full max-w-3xl rounded-xl border border-border bg-white text-slate-900 shadow-2xl p-8 my-8 space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                TAX INVOICE PREVIEW
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print Document</span>
                </button>
                <button
                  onClick={() => setPreviewOpen(false)}
                  className="p-1 rounded text-slate-500 hover:text-slate-900"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Printable Content Matching Sheet 7 */}
            <div className="border border-slate-300 rounded-lg p-6 space-y-6 text-xs text-slate-800">
              {/* Top Title & Header */}
              <div className="text-center border-b border-slate-200 pb-4 space-y-1">
                <h1 className="text-lg font-extrabold uppercase tracking-wide text-slate-900">
                  TAX INVOICE
                </h1>
                <div className="text-sm font-bold text-slate-800">{company?.name}</div>
                <div className="text-slate-600">
                  {company?.addressLine1}
                  {company?.addressLine2 ? `, ${company.addressLine2}` : ""}, {company?.city},{" "}
                  {company?.state} - {company?.pincode}
                </div>
                <div className="font-mono text-slate-700 font-semibold">
                  GSTIN: {company?.gstin} &bull; PAN: {company?.pan}
                </div>
              </div>

              {/* Invoice & Customer Meta Grid */}
              <div className="grid grid-cols-2 gap-6 border-b border-slate-200 pb-4">
                <div className="space-y-1">
                  <div className="font-bold text-slate-900">Billed To (Customer):</div>
                  <div className="font-semibold text-slate-800">{customerName}</div>
                  <div className="text-slate-600">{customerAddress}</div>
                  <div>
                    State: {customerState} (Code: {customerStateCode})
                  </div>
                  {customerGstin && <div className="font-mono font-semibold">GSTIN: {customerGstin}</div>}
                </div>

                <div className="space-y-1 text-right">
                  <div>
                    <span className="text-slate-500">Invoice No:</span>{" "}
                    <span className="font-bold font-mono text-slate-900">{invoiceNo}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Invoice Date:</span>{" "}
                    <span className="font-semibold">{invoiceDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Supply Type:</span>{" "}
                    <span className="font-semibold">{supplyType}</span>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full border border-slate-300 text-left">
                <thead className="bg-slate-100 border-b border-slate-300 font-semibold text-[10px] uppercase">
                  <tr>
                    <th className="p-2 border-r border-slate-300 w-8 text-center">#</th>
                    <th className="p-2 border-r border-slate-300">Description</th>
                    <th className="p-2 border-r border-slate-300">HSN</th>
                    <th className="p-2 border-r border-slate-300 text-right">Qty</th>
                    <th className="p-2 border-r border-slate-300 text-right">Rate</th>
                    <th className="p-2 border-r border-slate-300 text-right">Taxable</th>
                    <th className="p-2 border-r border-slate-300 text-center">GST</th>
                    <th className="p-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {lines.map((l, i) => (
                    <tr key={i}>
                      <td className="p-2 border-r border-slate-200 text-center font-mono">{i + 1}</td>
                      <td className="p-2 border-r border-slate-200 font-medium">{l.itemName}</td>
                      <td className="p-2 border-r border-slate-200 font-mono text-slate-600">{l.hsnSac}</td>
                      <td className="p-2 border-r border-slate-200 text-right">
                        {l.qty} {l.unit}
                      </td>
                      <td className="p-2 border-r border-slate-200 text-right font-mono">
                        {formatINR(l.rate)}
                      </td>
                      <td className="p-2 border-r border-slate-200 text-right font-mono">
                        {formatINR(l.taxableValue)}
                      </td>
                      <td className="p-2 border-r border-slate-200 text-center font-mono">{l.gstRate}%</td>
                      <td className="p-2 text-right font-bold font-mono">{formatINR(l.totalAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Bottom Totals & Words */}
              <div className="grid grid-cols-2 gap-4 border-t border-slate-300 pt-3">
                <div className="space-y-2">
                  <div>
                    <span className="font-semibold text-slate-700">Amount in Words:</span>
                    <div className="italic text-slate-900 font-medium">{numberToWordsINR(grandTotal)}</div>
                  </div>
                  <div className="p-2 rounded bg-slate-50 border border-slate-200 space-y-0.5 text-[11px]">
                    <div className="font-semibold text-slate-800">Bank Details:</div>
                    <div>{company?.bankName}</div>
                    <div className="font-mono">A/C: {company?.bankAccountNo}</div>
                    <div className="font-mono">IFSC: {company?.ifscCode}</div>
                  </div>
                </div>

                <div className="space-y-1.5 text-right">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Taxable Value:</span>
                    <span className="font-mono font-medium">{formatINR(totalTaxable)}</span>
                  </div>
                  {totalCgst > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">CGST Total:</span>
                      <span className="font-mono font-medium">+{formatINR(totalCgst)}</span>
                    </div>
                  )}
                  {totalSgst > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">SGST Total:</span>
                      <span className="font-mono font-medium">+{formatINR(totalSgst)}</span>
                    </div>
                  )}
                  {totalIgst > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">IGST Total:</span>
                      <span className="font-mono font-medium">+{formatINR(totalIgst)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-extrabold text-slate-900 border-t border-slate-300 pt-1.5">
                    <span>Grand Total:</span>
                    <span className="font-mono">{formatINR(grandTotal)}</span>
                  </div>
                </div>
              </div>

              {/* Signatory Footer */}
              <div className="flex justify-between items-end pt-8 text-[11px] text-slate-600">
                <div>{notes}</div>
                <div className="text-center space-y-8">
                  <div className="font-semibold">For {company?.name}</div>
                  <div className="border-t border-slate-400 pt-1 font-medium">Authorised Signatory</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
