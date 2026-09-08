"use client";

import React, { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { getCompanyProfile } from "@/server/company/companyActions";
import { getVendors } from "@/server/vendors/vendorActions";
import { getItems } from "@/server/items/itemActions";
import { createPurchase, PurchaseItemInput } from "@/server/purchases/purchaseActions";
import { formatINR, getSupplyType, computeGst, numberToWordsINR } from "@/lib/gstUtils";
import { formatInputDate } from "@/lib/dateUtils";
import { notify } from "@/lib/notify";
import {
  Receipt,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

const PurchaseBillPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [company, setCompany] = useState<any>(null);
  const [vendors, setVendors] = useState<any[]>([]);
  const [itemsMaster, setItemsMaster] = useState<any[]>([]);

  // Purchase Bill State
  const [voucherNo, setVoucherNo] = useState("");
  const [vendorBillNo, setVendorBillNo] = useState("");
  const [billDate, setBillDate] = useState(formatInputDate(new Date()));
  const [selectedVendorId, setSelectedVendorId] = useState("");
  const [vendorName, setVendorName] = useState("");
  const [vendorAddress, setVendorAddress] = useState("");
  const [vendorGstin, setVendorGstin] = useState("");
  const [vendorState, setVendorState] = useState("West Bengal");
  const [vendorStateCode, setVendorStateCode] = useState("19");
  const [supplyType, setSupplyType] = useState<"Intra-State (CGST+SGST)" | "Inter-State (IGST)">(
    "Intra-State (CGST+SGST)"
  );
  const [notes, setNotes] = useState("");

  const [lines, setLines] = useState<PurchaseItemInput[]>([
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
    const init = async () => {
      const [compRes, vendRes, itemRes] = await Promise.all([
        getCompanyProfile(),
        getVendors(),
        getItems(),
      ]);

      if (compRes.success && compRes.data) {
        setCompany(compRes.data);
        const prefix = compRes.data.purchasePrefix || "PUR-";
        const nextNo = compRes.data.nextPurchaseNo || 1;
        setVoucherNo(`${prefix}${String(nextNo).padStart(5, "0")}`);
      }
      if (vendRes.success && vendRes.data) {
        setVendors(vendRes.data);
        if (vendRes.data.length > 0) {
          selectVendor(vendRes.data[0], compRes.data?.stateCode || "19");
        }
      }
      if (itemRes.success && itemRes.data) {
        setItemsMaster(itemRes.data);
        if (itemRes.data.length > 0) {
          applyItemToLine(0, itemRes.data[0], compRes.data?.stateCode || "19", vendRes.data?.[0]?.stateCode || "19");
        }
      }
      setLoading(false);
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectVendor = (v: any, compStateCode = company?.stateCode || "19") => {
    setSelectedVendorId(v.id);
    setVendorName(v.name);
    setVendorAddress(v.address || "");
    setVendorGstin(v.gstin || "");
    setVendorState(v.state || "West Bengal");
    setVendorStateCode(v.stateCode || "19");

    const calculatedSupply = getSupplyType(compStateCode, v.stateCode);
    setSupplyType(calculatedSupply);

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

  const handleVendorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = vendors.find((vend) => vend.id === e.target.value);
    if (v) {
      selectVendor(v);
    }
  };

  const applyItemToLine = (
    index: number,
    item: any,
    compCode = company?.stateCode || "19",
    partyCode = vendorStateCode
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

  const handleSavePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorName) {
      setFeedback({ type: "error", message: "Please select vendor details." });
      notify.error("Please select vendor details.");
      return;
    }
    if (lines.length === 0 || lines.some((l) => !l.itemCode)) {
      setFeedback({ type: "error", message: "Bill must have at least one valid item." });
      notify.error("Bill must have at least one valid item.");
      return;
    }

    setFeedback(null);
    startTransition(async () => {
      const res = await createPurchase({
        voucherNo,
        vendorBillNo,
        billDate,
        vendorId: selectedVendorId,
        vendorName,
        vendorAddress,
        vendorGstin,
        vendorState,
        vendorStateCode,
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
          message: `Purchase bill ${voucherNo} recorded & stock updated successfully!`,
        });
        notify.success(`Purchase bill ${voucherNo} recorded & stock updated successfully!`);
        setTimeout(() => {
          router.push("/registers/purchase");
        }, 1200);
      } else {
        setFeedback({ type: "error", message: res.error || "Failed to record purchase bill." });
        notify.error(res.error || "Failed to record purchase bill.");
      }
    });
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        <RefreshCw className="h-5 w-5 animate-spin mr-2" /> Initializing Purchase Bill form...
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-cyan-500" />
            <h1 className="text-xl font-bold tracking-tight">Purchase Bill (Inward Supply - F9)</h1>
          </div>
          <p className="text-xs text-muted-foreground">
            Record supplier purchase bills, compute input tax credit (ITC), increment inventory stock, and post to Day Book.
          </p>
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

      <form onSubmit={handleSavePurchase} className="space-y-6">
        {/* Meta Grid */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-xs">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-medium text-foreground">Purchase Voucher No *</label>
              <input
                required
                type="text"
                value={voucherNo}
                onChange={(e) => setVoucherNo(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs font-mono font-bold outline-none focus:border-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-foreground">Vendor Bill No</label>
              <input
                type="text"
                value={vendorBillNo}
                onChange={(e) => setVendorBillNo(e.target.value)}
                placeholder="e.g. VEN-994"
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs font-mono outline-none focus:border-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-foreground">Bill Date *</label>
              <input
                required
                type="date"
                value={billDate}
                onChange={(e) => setBillDate(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs outline-none focus:border-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-foreground">Supply Type (GST)</label>
              <div className="w-full rounded-md border border-border bg-muted/50 px-3 py-1.5 text-xs font-semibold text-cyan-600 dark:text-cyan-400">
                {supplyType}
              </div>
            </div>
          </div>

          {/* Vendor Selection Row */}
          <div className="border-t border-border pt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-medium text-foreground">Select Vendor *</label>
              <select
                value={selectedVendorId}
                onChange={handleVendorChange}
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs outline-none focus:border-primary font-medium"
              >
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.code}) - {v.state}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-medium text-foreground">Vendor Address</label>
              <input
                type="text"
                value={vendorAddress}
                onChange={(e) => setVendorAddress(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs outline-none focus:border-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-foreground">Vendor GSTIN</label>
              <input
                type="text"
                value={vendorGstin}
                onChange={(e) => setVendorGstin(e.target.value.toUpperCase())}
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
              Purchased Items & Inventory Addition
            </h2>
            <button
              type="button"
              onClick={addLine}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer"
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
                  <th className="px-3 py-2.5 w-28 text-right">Cost Rate (₹)</th>
                  <th className="px-3 py-2.5 w-28 text-right">Taxable (₹)</th>
                  <th className="px-3 py-2.5 w-20 text-center">GST %</th>
                  <th className="px-3 py-2.5 w-28 text-right">Tax Total</th>
                  <th className="px-3 py-2.5 w-28 text-right">Total Bill (₹)</th>
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
                    <td className="px-3 py-2 text-center font-semibold text-cyan-600 dark:text-cyan-400">
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

        {/* Summary Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-xs text-xs">
            <div className="space-y-1">
              <span className="font-semibold text-muted-foreground uppercase text-[10px]">
                Total Amount in Words:
              </span>
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs font-semibold text-primary">
                {numberToWordsINR(grandTotal)}
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-medium text-foreground">Purchase Notes / Remarks</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Received material in good condition."
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 space-y-3 shadow-xs text-xs">
            <h3 className="font-semibold uppercase tracking-wider text-muted-foreground text-[10px]">
              Purchase Bill Totals (Input Tax Credit)
            </h3>

            <div className="space-y-2 border-b border-border pb-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Taxable Value:</span>
                <span className="font-mono font-medium">{formatINR(totalTaxable)}</span>
              </div>

              {supplyType === "Intra-State (CGST+SGST)" ? (
                <>
                  <div className="flex justify-between text-cyan-600 dark:text-cyan-400">
                    <span>Input CGST (ITC):</span>
                    <span className="font-mono font-medium">+{formatINR(totalCgst)}</span>
                  </div>
                  <div className="flex justify-between text-cyan-600 dark:text-cyan-400">
                    <span>Input SGST (ITC):</span>
                    <span className="font-mono font-medium">+{formatINR(totalSgst)}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between text-indigo-600 dark:text-indigo-400">
                  <span>Input IGST (ITC):</span>
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
              <span className="text-sm font-bold text-foreground">Total Bill Value:</span>
              <span className="text-xl font-bold font-mono text-cyan-600 dark:text-cyan-400">
                {formatINR(grandTotal)}
              </span>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-cyan-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-cyan-700 disabled:opacity-50 transition shadow-xs cursor-pointer"
              >
                {saving ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" /> Recording Bill & Adding Stock...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" /> Save Purchase Bill (F9)
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default PurchaseBillPage;
