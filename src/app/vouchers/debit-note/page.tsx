"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  FilePlus2, 
  Plus, 
  Trash2, 
  Save, 
  Printer, 
  Sparkles, 
  ArrowLeft,
  X
} from "lucide-react";
import { createDebitNote, DebitNoteItemInput } from "@/server/notes/debitNoteActions";
import { getVendors } from "@/server/vendors/vendorActions";
import { getItems } from "@/server/items/itemActions";
import { getActiveCompanyAction } from "@/server/company/companyActions";
import { formatINR, computeGst, numberToWordsINR } from "@/lib/gstUtils";
import { formatInputDate, formatDisplayDate } from "@/lib/dateUtils";
import { notify } from "@/lib/notify";
import { ExportButtonGroup } from "@/components/UI/ExportButtonGroup";
import { SlideUp, FadeIn } from "@/components/Motion/MotionContainer";

const DebitNotePage = () => {
  const router = useRouter();
  const [vendors, setVendors] = useState<any[]>([]);
  const [itemsCatalog, setItemsCatalog] = useState<any[]>([]);
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [savedNote, setSavedNote] = useState<any>(null);

  const [noteNo, setNoteNo] = useState("");
  const [noteDate, setNoteDate] = useState(new Date().toISOString().split("T")[0]);
  const [originalBillNo, setOriginalBillNo] = useState("TSL/WB/2025/4412");
  const [originalBillDate, setOriginalBillDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedVendorId, setSelectedVendorId] = useState("");
  const [vendorName, setVendorName] = useState("");
  const [vendorGstin, setVendorGstin] = useState("");
  const [vendorState, setVendorState] = useState("West Bengal");
  const [vendorStateCode, setVendorStateCode] = useState("19");
  const [supplyType, setSupplyType] = useState("Intra-State (CGST+SGST)");
  const [reason, setReason] = useState("Purchase Return");
  const [notes, setNotes] = useState("Raw material returned due to surface defects");

  const [lines, setLines] = useState<DebitNoteItemInput[]>([
    {
      itemCode: "ITM-F02",
      itemName: "High Tensile Hex Bolt M24",
      hsnSac: "7318",
      unit: "KGS",
      qty: 100,
      rate: 145,
      taxableValue: 14500,
      gstRate: 18,
      cgstAmount: 1305,
      sgstAmount: 1305,
      igstAmount: 0,
      totalAmount: 17110,
    },
  ]);

  useEffect(() => {
    const init = async () => {
      const [vRes, iRes, coRes] = await Promise.all([
        getVendors(),
        getItems(),
        getActiveCompanyAction(),
      ]);
      if (vRes.success) setVendors(vRes.data || []);
      if (iRes.success) setItemsCatalog(iRes.data || []);
      if (coRes.company) setCompany(coRes.company);
    }
    init();
  }, []);

  const handleSelectVendor = (vendId: string) => {
    setSelectedVendorId(vendId);
    const v = vendors.find((x) => x.id === vendId);
    if (!v) return;

    setVendorName(v.name);
    setVendorGstin(v.gstin || "");
    setVendorState(v.state || "West Bengal");
    setVendorStateCode(v.stateCode || "19");

    const isIntra = !company?.stateCode || v.stateCode === company.stateCode;
    const newSupplyType = isIntra ? "Intra-State (CGST+SGST)" : "Inter-State (IGST)";
    setSupplyType(newSupplyType);

    recalculateAllLines(lines, isIntra);
  };

  const recalculateLine = (line: DebitNoteItemInput, isIntra: boolean): DebitNoteItemInput => {
    const taxable = line.qty * line.rate;
    const stType = isIntra ? "Intra-State (CGST+SGST)" : "Inter-State (IGST)";
    const tax = computeGst(taxable, line.gstRate, stType);
    return {
      ...line,
      taxableValue: taxable,
      cgstAmount: tax.cgstAmount,
      sgstAmount: tax.sgstAmount,
      igstAmount: tax.igstAmount,
      totalAmount: tax.totalAmount,
    };
  };

  const recalculateAllLines = (currentLines: DebitNoteItemInput[], isIntra: boolean) => {
    const updated = currentLines.map((l) => recalculateLine(l, isIntra));
    setLines(updated);
  };

  const handleItemChange = (index: number, itemId: string) => {
    const prod = itemsCatalog.find((i) => i.id === itemId);
    if (!prod) return;

    const isIntra = supplyType.includes("Intra");
    const updated = [...lines];
    updated[index] = recalculateLine(
      {
        ...updated[index],
        itemId: prod.id,
        itemCode: prod.code,
        itemName: prod.name,
        hsnSac: prod.hsnSac,
        unit: prod.unit,
        rate: prod.rate,
        gstRate: prod.gstRate,
      },
      isIntra
    );
    setLines(updated);
  };

  const handleQtyRateChange = (index: number, field: "qty" | "rate", value: number) => {
    const isIntra = supplyType.includes("Intra");
    const updated = [...lines];
    updated[index] = recalculateLine(
      {
        ...updated[index],
        [field]: value,
      },
      isIntra
    );
    setLines(updated);
  };

  const addLine = () => {
    const first = itemsCatalog[0];
    const isIntra = supplyType.includes("Intra");
    const newLine = recalculateLine(
      {
        itemId: first?.id,
        itemCode: first?.code || "ITM-01",
        itemName: first?.name || "Item",
        hsnSac: first?.hsnSac || "9999",
        unit: first?.unit || "PCS",
        qty: 1,
        rate: first?.rate || 100,
        taxableValue: 100,
        gstRate: first?.gstRate || 18,
        cgstAmount: 9,
        sgstAmount: 9,
        igstAmount: 0,
        totalAmount: 118,
      },
      isIntra
    );
    setLines([...lines, newLine]);
  };

  const removeLine = (idx: number) => {
    if (lines.length <= 1) return;
    setLines(lines.filter((_, i) => i !== idx));
  };

  const totalTaxable = lines.reduce((s, l) => s + l.taxableValue, 0);
  const totalCgst = lines.reduce((s, l) => s + l.cgstAmount, 0);
  const totalSgst = lines.reduce((s, l) => s + l.sgstAmount, 0);
  const totalIgst = lines.reduce((s, l) => s + l.igstAmount, 0);
  const grandTotal = lines.reduce((s, l) => s + l.totalAmount, 0);

  const noteExportOptions = savedNote
    ? {
        filename: `debit-note-${savedNote.noteNo || "DN"}-${formatInputDate(new Date())}`,
        title: `DEBIT NOTE (GST SECTION 34), ${company?.name || "Company"}`,
        subtitle: `Note No: ${savedNote.noteNo} | Date: ${formatDisplayDate(savedNote.noteDate)} | Against Bill: ${savedNote.originalBillNo} | Vendor: ${savedNote.vendorName} | Total: ${formatINR(savedNote.totalAmount)}`,
        sheetName: "Debit_Note",
        headers: ["Item Description", "HSN/SAC", "Qty", "Unit", "Rate (₹)", "Taxable Value (₹)", "GST (%)", "Total (₹)"],
        data: (savedNote.items || []).map((it: any) => [
          it.itemName,
          it.hsnSac || "",
          it.qty,
          it.unit,
          it.rate,
          it.taxableValue,
          `${it.gstRate}%`,
          it.totalAmount,
        ]),
      }
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorName.trim()) {
      setFeedback({ type: "error", message: "Please select or enter vendor name." });
      notify.error("Please select or enter vendor name.");
      return;
    }

    setLoading(true);
    setFeedback(null);

    const res = await createDebitNote({
      noteNo: noteNo || undefined,
      noteDate,
      originalBillNo,
      originalBillDate,
      vendorId: selectedVendorId || undefined,
      vendorName,
      vendorGstin,
      vendorState,
      vendorStateCode,
      supplyType,
      reason,
      taxableValue: totalTaxable,
      cgstAmount: totalCgst,
      sgstAmount: totalSgst,
      igstAmount: totalIgst,
      totalAmount: grandTotal,
      notes,
      items: lines,
    });

    if (res.success && res.data) {
      setFeedback({ type: "success", message: `Debit Note ${res.data.noteNo} created & Day Book posted successfully!` });
      notify.success(`Debit Note ${res.data.noteNo} created & Day Book posted successfully!`);
      setSavedNote(res.data);
      setShowPrintModal(true);
      router.refresh();
    } else {
      setFeedback({ type: "error", message: res.error || "Failed to create Debit Note." });
      notify.error(res.error || "Failed to create Debit Note.");
    }
    setLoading(false);
  };

  return (
    <SlideUp className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href={"/dashboard" as any}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Gateway of Tally
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground">Tally Voucher: Alt+F5 / Ctrl+F9</span>
          <Link
            href={"/registers/debit-notes" as any}
            className="text-xs font-semibold text-cyan-600 hover:text-cyan-500 underline underline-offset-4"
          >
            View Debit Note Register &rarr;
          </Link>
        </div>
      </div>

      {/* Main Title Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-zinc-900 to-cyan-950 text-white border border-cyan-500/20 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[11px] font-semibold border border-cyan-500/30">
            <Sparkles className="h-3 w-3" />
            Inward ITC Reversal • GST Section 34
          </div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-100 flex items-center gap-2">
            <FilePlus2 className="h-6 w-6 text-cyan-400" />
            Debit Note (Purchase Return Voucher)
          </h1>
          <p className="text-xs text-zinc-400">
            Debits Sundry Creditors ledger, reverses Input Tax Credit (ITC), and reduces inward inventory.
          </p>
        </div>
      </div>

      {feedback && (
        <FadeIn className={`p-4 rounded-xl text-xs font-medium border ${feedback.type === "success" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500" : "bg-destructive/10 border-destructive/30 text-destructive"}`}>
          {feedback.message}
        </FadeIn>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header Metadata Section */}
        <div className="p-5 rounded-2xl border border-border bg-card shadow-xs space-y-4">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Debit Note No</label>
              <input
                type="text"
                value={noteNo}
                onChange={(e) => setNoteNo(e.target.value)}
                placeholder="Auto (DBN-00001)"
                className="w-full h-9 px-3 rounded-xl border bg-background text-xs font-mono border-input"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Debit Note Date</label>
              <input
                type="date"
                value={noteDate}
                onChange={(e) => setNoteDate(e.target.value)}
                className="w-full h-9 px-3 rounded-xl border bg-background text-xs font-mono border-input"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Original Vendor Bill No</label>
              <input
                type="text"
                value={originalBillNo}
                onChange={(e) => setOriginalBillNo(e.target.value)}
                placeholder="e.g. TSL/WB/2025/4412"
                required
                className="w-full h-9 px-3 rounded-xl border bg-background text-xs font-mono border-input"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Original Bill Date</label>
              <input
                type="date"
                value={originalBillDate}
                onChange={(e) => setOriginalBillDate(e.target.value)}
                className="w-full h-9 px-3 rounded-xl border bg-background text-xs font-mono border-input"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 pt-2 border-t border-border">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Vendor (Sundry Creditor) *</label>
              <select
                value={selectedVendorId}
                onChange={(e) => handleSelectVendor(e.target.value)}
                className="w-full h-9 px-3 rounded-xl border bg-background text-xs border-input font-medium"
              >
                <option value="">-- Choose Vendor --</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.state})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Vendor GSTIN</label>
              <input
                type="text"
                value={vendorGstin}
                onChange={(e) => setVendorGstin(e.target.value)}
                placeholder="19XXXXX..."
                className="w-full h-9 px-3 rounded-xl border bg-background text-xs font-mono border-input"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Reason for Debit Note</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full h-9 px-3 rounded-xl border bg-background text-xs border-input font-medium"
              >
                <option value="Purchase Return">01 - Purchase Return (Rejection of Goods)</option>
                <option value="Vendor Price Reduction">02 - Vendor Discount / Price Adjustment</option>
                <option value="Deficient Material">03 - Defective Raw Materials</option>
                <option value="Quantity Correction">04 - Shortage / Excess Billed Correction</option>
              </select>
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="p-5 rounded-2xl border border-border bg-card shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Returned Items & Value Reversal
            </h3>
            <span className="text-xs font-semibold text-cyan-600 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
              {supplyType}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/50 text-muted-foreground border-b border-border">
                <tr>
                  <th className="p-2.5">Item Name</th>
                  <th className="p-2.5 w-20">HSN</th>
                  <th className="p-2.5 w-20 text-right">Qty</th>
                  <th className="p-2.5 w-24 text-right">Rate (₹)</th>
                  <th className="p-2.5 w-28 text-right">Taxable (₹)</th>
                  <th className="p-2.5 w-20 text-right">GST %</th>
                  <th className="p-2.5 w-28 text-right">ITC Rev (₹)</th>
                  <th className="p-2.5 w-32 text-right">Total (₹)</th>
                  <th className="p-2.5 w-12 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {lines.map((line, idx) => (
                  <tr key={idx} className="hover:bg-muted/20">
                    <td className="p-2">
                      <select
                        value={line.itemId || ""}
                        onChange={(e) => handleItemChange(idx, e.target.value)}
                        className="w-full h-8 px-2 rounded-lg border border-input bg-background text-xs"
                      >
                        {itemsCatalog.map((i) => (
                          <option key={i.id} value={i.id}>
                            {i.name} ({i.code})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-2 font-mono">{line.hsnSac}</td>
                    <td className="p-2 text-right">
                      <input
                        type="number"
                        min="1"
                        value={line.qty}
                        onChange={(e) => handleQtyRateChange(idx, "qty", parseFloat(e.target.value) || 0)}
                        className="w-16 h-8 px-2 rounded-lg border border-input bg-background text-right text-xs"
                      />
                    </td>
                    <td className="p-2 text-right">
                      <input
                        type="number"
                        min="0"
                        value={line.rate}
                        onChange={(e) => handleQtyRateChange(idx, "rate", parseFloat(e.target.value) || 0)}
                        className="w-20 h-8 px-2 rounded-lg border border-input bg-background text-right text-xs"
                      />
                    </td>
                    <td className="p-2 text-right font-mono font-medium">{formatINR(line.taxableValue)}</td>
                    <td className="p-2 text-right font-mono">{line.gstRate}%</td>
                    <td className="p-2 text-right font-mono text-cyan-600 dark:text-cyan-400">
                      {formatINR(line.cgstAmount + line.sgstAmount + line.igstAmount)}
                    </td>
                    <td className="p-2 text-right font-mono font-bold text-foreground">{formatINR(line.totalAmount)}</td>
                    <td className="p-2 text-center">
                      <button
                        type="button"
                        onClick={() => removeLine(idx)}
                        disabled={lines.length <= 1}
                        className="text-muted-foreground hover:text-destructive disabled:opacity-30"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            onClick={addLine}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-dashed hover:bg-muted text-xs font-semibold text-foreground transition-colors"
          >
            <Plus className="h-3.5 w-3.5 text-cyan-500" />
            Add Another Returned Item
          </button>
        </div>

        {/* Summary and Notes Footer */}
        <div className="grid md:grid-cols-12 gap-5">
          <div className="md:col-span-7 p-5 rounded-2xl border border-border bg-card shadow-xs space-y-3">
            <label className="text-xs font-semibold text-foreground">Remarks / Narration</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-3 rounded-xl border bg-background text-xs border-input resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
            />
            <p className="text-[11px] text-muted-foreground">
              Amount in words: <strong className="text-foreground italic">{numberToWordsINR(grandTotal)}</strong>
            </p>
          </div>

          <div className="md:col-span-5 p-5 rounded-2xl border border-border bg-card shadow-xs space-y-2.5 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>Total Taxable:</span>
              <span className="font-mono text-foreground font-semibold">{formatINR(totalTaxable)}</span>
            </div>
            {supplyType.includes("Intra") ? (
              <>
                <div className="flex justify-between text-muted-foreground">
                  <span>ITC CGST Reversal:</span>
                  <span className="font-mono text-cyan-500 font-semibold">{formatINR(totalCgst)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>ITC SGST Reversal:</span>
                  <span className="font-mono text-cyan-500 font-semibold">{formatINR(totalSgst)}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between text-muted-foreground">
                <span>ITC IGST Reversal:</span>
                <span className="font-mono text-cyan-500 font-semibold">{formatINR(totalIgst)}</span>
              </div>
            )}
            <div className="pt-2 border-t border-border flex justify-between items-baseline">
              <span className="font-bold text-sm text-foreground">Total Debit Note:</span>
              <span className="text-lg font-black text-cyan-600 dark:text-cyan-400 font-mono">
                {formatINR(grandTotal)}
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 h-10 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md shadow-cyan-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? (
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Accept Debit Note (Ctrl+A)
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Printable Debit Note Modal */}
      {showPrintModal && savedNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-card w-full max-w-2xl rounded-2xl border border-border shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-border">
              <div className="flex items-center gap-2">
                <Printer className="h-5 w-5 text-cyan-500" />
                <h3 className="font-bold text-sm text-foreground">Debit Note Document Preview</h3>
              </div>
              <button onClick={() => setShowPrintModal(false)} className="p-1 rounded-lg hover:bg-muted text-muted-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div id="printable-debit-note" className="p-4 border rounded-xl bg-background space-y-4 text-xs font-sans">
              <div className="text-center border-b pb-3 border-border">
                <h2 className="text-base font-black uppercase text-foreground">{company?.name || "Your Company Pvt Ltd"}</h2>
                <p className="text-[10px] text-muted-foreground">{company?.addressLine1}, {company?.city} - {company?.pincode}</p>
                <p className="font-mono text-[10px]">GSTIN: <strong>{company?.gstin}</strong> | State: {company?.state} ({company?.stateCode})</p>
                <div className="mt-2 inline-block px-3 py-0.5 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-extrabold text-[11px] rounded border border-cyan-500/20">
                  DEBIT NOTE (PURCHASE RETURN)
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-[11px] border-b pb-3 border-border">
                <div>
                  <p><strong>Note No:</strong> {savedNote.noteNo}</p>
                  <p><strong>Date:</strong> {new Date(savedNote.noteDate).toLocaleDateString()}</p>
                  <p><strong>Against Vendor Bill:</strong> {savedNote.originalBillNo}</p>
                  <p><strong>Reason:</strong> {savedNote.reason}</p>
                </div>
                <div>
                  <p><strong>Issued to (Vendor):</strong> {savedNote.vendorName}</p>
                  <p><strong>Vendor GSTIN:</strong> {savedNote.vendorGstin || "Unregistered"}</p>
                  <p><strong>State / POS:</strong> {savedNote.vendorState} ({savedNote.vendorStateCode})</p>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between font-semibold border-b py-1">
                  <span>Particulars</span>
                  <span>Amount (₹)</span>
                </div>
                {savedNote.items?.map((it: any, i: number) => (
                  <div key={i} className="flex justify-between py-1 text-muted-foreground">
                    <span>{it.itemName} ({it.qty} {it.unit} @ ₹{it.rate})</span>
                    <span className="font-mono text-foreground">{formatINR(it.totalAmount)}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t flex justify-between font-black text-sm">
                <span>Net Debit Adjusted:</span>
                <span className="text-cyan-600 font-mono">{formatINR(savedNote.totalAmount)}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              {noteExportOptions && <ExportButtonGroup exportOptions={noteExportOptions} />}
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-foreground text-background font-semibold text-xs flex items-center gap-1.5"
              >
                <Printer className="h-3.5 w-3.5" />
                Print / Save PDF
              </button>
              <button
                onClick={() => setShowPrintModal(false)}
                className="px-4 py-2 rounded-xl border hover:bg-muted text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </SlideUp>
  );
};

export default DebitNotePage;
