"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Redo2, 
  Plus, 
  Search, 
  FileSpreadsheet, 
  Hash, 
  ShieldAlert
} from "lucide-react";
import { getDebitNotes } from "@/server/notes/debitNoteActions";
import { formatINR } from "@/lib/gstUtils";
import { formatDisplayDate, formatInputDate } from "@/lib/dateUtils";
import { ExportButtonGroup } from "@/components/UI/ExportButtonGroup";
import { SlideUp, StaggerContainer, StaggerItem } from "@/components/Motion/MotionContainer";

const DebitNotesRegisterPage = () => {
  const [debitNotes, setDebitNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadNotes = async () => {
    setLoading(true);
    const res = await getDebitNotes();
    if (res.success && res.data) {
      setDebitNotes(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadNotes();
  }, []);

  const filtered = debitNotes.filter((dn) => {
    const q = search.toLowerCase();
    return (
      dn.noteNo.toLowerCase().includes(q) ||
      dn.vendorName.toLowerCase().includes(q) ||
      (dn.vendorGstin && dn.vendorGstin.toLowerCase().includes(q)) ||
      (dn.originalBillNo && dn.originalBillNo.toLowerCase().includes(q)) ||
      (dn.reason && dn.reason.toLowerCase().includes(q))
    );
  });

  const totalTaxable = filtered.reduce((s, d) => s + (Number(d.taxableValue) || 0), 0);
  const totalCgst = filtered.reduce((s, d) => s + (Number(d.cgstAmount) || 0), 0);
  const totalSgst = filtered.reduce((s, d) => s + (Number(d.sgstAmount) || 0), 0);
  const totalIgst = filtered.reduce((s, d) => s + (Number(d.igstAmount) || 0), 0);
  const totalGst = totalCgst + totalSgst + totalIgst;
  const totalAmount = filtered.reduce((s, d) => s + (Number(d.totalAmount) || 0), 0);

  const exportOptions = {
    filename: `debit-notes-register-${formatInputDate(new Date())}`,
    title: "Debit Note Register (Purchase Return / ITC Reversal)",
    subtitle: `Total Notes: ${filtered.length} | Taxable: ${formatINR(totalTaxable)} | ITC Reversed: ${formatINR(totalGst)} | Total Return: ${formatINR(totalAmount)}`,
    sheetName: "Debit_Notes",
    headers: [
      "Debit Note No",
      "Date",
      "Vendor Name",
      "GSTIN",
      "Original Bill No",
      "Original Bill Date",
      "Reason",
      "Taxable Value (₹)",
      "CGST (ITC Reversal) (₹)",
      "SGST (ITC Reversal) (₹)",
      "IGST (ITC Reversal) (₹)",
      "Total Amount (₹)",
    ],
    data: filtered.map((d) => [
      d.noteNo,
      formatDisplayDate(d.noteDate),
      d.vendorName,
      d.vendorGstin || "N/A",
      d.originalBillNo || "N/A",
      d.originalBillDate ? formatDisplayDate(d.originalBillDate) : "N/A",
      d.reason || "Purchase Return",
      d.taxableValue,
      d.cgstAmount,
      d.sgstAmount,
      d.igstAmount,
      d.totalAmount,
    ]),
  };

  return (
    <div className="space-y-6 pb-16">
      <SlideUp>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Redo2 className="h-5 w-5" />
              </span>
              <h1 className="text-xl font-bold tracking-tight">Debit Note Register (Purchase Return / ITC Reversal)</h1>
            </div>
            <p className="text-xs text-muted-foreground">
              Official record of goods returned to suppliers, vendor chargebacks, and Input Tax Credit reversals.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ExportButtonGroup options={exportOptions} disabled={filtered.length === 0} />
            <Link
              href="/vouchers/debit-note"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-lg shadow-amber-500/20 transition-all"
            >
              <Plus className="h-4 w-4" />
              New Debit Note (Alt+F5)
            </Link>
          </div>
        </div>
      </SlideUp>

      <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StaggerItem>
          <div className="p-4 rounded-2xl bg-card border border-border shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Total Notes</span>
              <Hash className="h-4 w-4 text-amber-400" />
            </div>
            <div className="mt-2 text-2xl font-bold font-mono text-foreground">{filtered.length}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Records in active company</div>
          </div>
        </StaggerItem>

        <StaggerItem>
          <div className="p-4 rounded-2xl bg-card border border-border shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Taxable Value</span>
              <FileSpreadsheet className="h-4 w-4 text-orange-400" />
            </div>
            <div className="mt-2 text-2xl font-bold font-mono text-foreground">{formatINR(totalTaxable)}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Purchase value returned</div>
          </div>
        </StaggerItem>

        <StaggerItem>
          <div className="p-4 rounded-2xl bg-card border border-border shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">ITC Reversed</span>
              <ShieldAlert className="h-4 w-4 text-rose-400" />
            </div>
            <div className="mt-2 text-2xl font-bold font-mono text-rose-400">{formatINR(totalGst)}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Input tax credit surrendered</div>
          </div>
        </StaggerItem>

        <StaggerItem>
          <div className="p-4 rounded-2xl bg-card border border-border shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Total Note Value</span>
              <Redo2 className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="mt-2 text-2xl font-bold font-mono text-emerald-400">{formatINR(totalAmount)}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Creditor liabilities reduced</div>
          </div>
        </StaggerItem>
      </StaggerContainer>

      <SlideUp delay={0.15}>
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by Note No, Vendor Name, GSTIN, Reason, or Bill No..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-background border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            />
          </div>
        </div>
      </SlideUp>

      <SlideUp delay={0.2}>
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/20 text-xs font-semibold text-muted-foreground">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Note No</th>
                  <th className="py-3 px-4">Vendor & GSTIN</th>
                  <th className="py-3 px-4">Original Bill Ref</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4 text-right">Taxable (₹)</th>
                  <th className="py-3 px-4 text-right">CGST (₹)</th>
                  <th className="py-3 px-4 text-right">SGST (₹)</th>
                  <th className="py-3 px-4 text-right">IGST (₹)</th>
                  <th className="py-3 px-4 text-right">Total (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-muted-foreground text-sm">
                      Loading debit notes register...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-muted-foreground text-sm">
                      No debit notes found. Create one using the button above.
                    </td>
                  </tr>
                ) : (
                  filtered.map((dn) => (
                    <tr key={dn.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 font-mono text-xs text-muted-foreground whitespace-nowrap">
                        {formatDisplayDate(dn.noteDate)}
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-amber-400 whitespace-nowrap">
                        {dn.noteNo}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-foreground">{dn.vendorName}</div>
                        {dn.vendorGstin && (
                          <div className="text-[11px] font-mono text-muted-foreground">
                            {dn.vendorGstin}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs font-mono text-muted-foreground whitespace-nowrap">
                        {dn.originalBillNo ? (
                          <div>
                            <div>{dn.originalBillNo}</div>
                            {dn.originalBillDate && (
                              <div className="text-[10px]">
                                {formatDisplayDate(dn.originalBillDate)}
                              </div>
                            )}
                          </div>
                        ) : (
                          "Direct"
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs">
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[11px] font-medium">
                          {dn.reason || "Purchase Return"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-xs">
                        {formatINR(dn.taxableValue)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-xs text-muted-foreground">
                        {formatINR(dn.cgstAmount)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-xs text-muted-foreground">
                        {formatINR(dn.sgstAmount)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-xs text-muted-foreground">
                        {formatINR(dn.igstAmount)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-xs text-foreground">
                        {formatINR(dn.totalAmount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {filtered.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-border bg-muted/40 font-semibold text-xs">
                    <td colSpan={5} className="py-3 px-4 text-foreground text-right">
                      Total ({filtered.length} notes):
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-orange-400">
                      {formatINR(totalTaxable)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono">
                      {formatINR(totalCgst)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono">
                      {formatINR(totalSgst)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono">
                      {formatINR(totalIgst)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-400 font-bold">
                      {formatINR(totalAmount)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </SlideUp>
    </div>
  );
};

export default DebitNotesRegisterPage;
