"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Undo2, 
  Plus, 
  Search, 
  Download, 
  FileSpreadsheet, 
  Hash, 
  BadgePercent
} from "lucide-react";
import { getCreditNotes } from "@/server/notes/creditNoteActions";
import { formatINR } from "@/lib/gstUtils";
import { SlideUp, StaggerContainer, StaggerItem } from "@/components/Motion/MotionContainer";

const CreditNotesRegisterPage = () => {
  const [creditNotes, setCreditNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadNotes = async () => {
    setLoading(true);
    const res = await getCreditNotes();
    if (res.success && res.data) {
      setCreditNotes(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadNotes();
  }, []);

  const filtered = creditNotes.filter((cn) => {
    const q = search.toLowerCase();
    return (
      cn.noteNo.toLowerCase().includes(q) ||
      cn.customerName.toLowerCase().includes(q) ||
      (cn.customerGstin && cn.customerGstin.toLowerCase().includes(q)) ||
      (cn.originalInvoiceNo && cn.originalInvoiceNo.toLowerCase().includes(q)) ||
      (cn.reason && cn.reason.toLowerCase().includes(q))
    );
  });

  const totalTaxable = filtered.reduce((s, c) => s + (Number(c.taxableValue) || 0), 0);
  const totalCgst = filtered.reduce((s, c) => s + (Number(c.cgstAmount) || 0), 0);
  const totalSgst = filtered.reduce((s, c) => s + (Number(c.sgstAmount) || 0), 0);
  const totalIgst = filtered.reduce((s, c) => s + (Number(c.igstAmount) || 0), 0);
  const totalGst = totalCgst + totalSgst + totalIgst;
  const totalAmount = filtered.reduce((s, c) => s + (Number(c.totalAmount) || 0), 0);

  const exportCSV = () => {
    const headers = [
      "Credit Note No",
      "Date",
      "Customer Name",
      "GSTIN",
      "Original Inv No",
      "Original Inv Date",
      "Reason",
      "Taxable Value",
      "CGST",
      "SGST",
      "IGST",
      "Total Amount",
    ];

    const rows = filtered.map((c) => [
      c.noteNo,
      new Date(c.noteDate).toLocaleDateString("en-IN"),
      `"${c.customerName}"`,
      c.customerGstin || "N/A",
      c.originalInvoiceNo || "N/A",
      c.originalInvoiceDate ? new Date(c.originalInvoiceDate).toLocaleDateString("en-IN") : "N/A",
      `"${c.reason || "Sales Return"}"`,
      c.taxableValue,
      c.cgstAmount,
      c.sgstAmount,
      c.igstAmount,
      c.totalAmount,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `credit-notes-register-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-16">
      <SlideUp>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Undo2 className="h-5 w-5" />
              </span>
              <h1 className="text-xl font-bold tracking-tight">Credit Note Register (Sales Return / GST Sec 34)</h1>
            </div>
            <p className="text-xs text-muted-foreground">
              Official ledger record of sales returns, rate reductions, and output GST reversals under GST law.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportCSV}
              disabled={filtered.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-secondary/80 hover:bg-secondary text-foreground border border-border disabled:opacity-50 transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </button>
            <Link
              href="/vouchers/credit-note"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-500/20 transition-all"
            >
              <Plus className="h-4 w-4" />
              New Credit Note (Alt+F6)
            </Link>
          </div>
        </div>
      </SlideUp>

      <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StaggerItem>
          <div className="p-4 rounded-2xl bg-card border border-border shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Total Notes</span>
              <Hash className="h-4 w-4 text-purple-400" />
            </div>
            <div className="mt-2 text-2xl font-bold font-mono text-foreground">{filtered.length}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Records in active company</div>
          </div>
        </StaggerItem>

        <StaggerItem>
          <div className="p-4 rounded-2xl bg-card border border-border shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Taxable Value</span>
              <FileSpreadsheet className="h-4 w-4 text-indigo-400" />
            </div>
            <div className="mt-2 text-2xl font-bold font-mono text-foreground">{formatINR(totalTaxable)}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Sales reduction before tax</div>
          </div>
        </StaggerItem>

        <StaggerItem>
          <div className="p-4 rounded-2xl bg-card border border-border shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">GST Reversed</span>
              <BadgePercent className="h-4 w-4 text-amber-400" />
            </div>
            <div className="mt-2 text-2xl font-bold font-mono text-amber-400">{formatINR(totalGst)}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">CGST+SGST+IGST reversed</div>
          </div>
        </StaggerItem>

        <StaggerItem>
          <div className="p-4 rounded-2xl bg-card border border-border shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Total Return Value</span>
              <Undo2 className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="mt-2 text-2xl font-bold font-mono text-emerald-400">{formatINR(totalAmount)}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Debtor balances adjusted</div>
          </div>
        </StaggerItem>
      </StaggerContainer>

      <SlideUp delay={0.15}>
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by Note No, Customer Name, GSTIN, Reason, or Invoice No..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-background border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40"
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
                  <th className="py-3 px-4">Customer & GSTIN</th>
                  <th className="py-3 px-4">Original Ref</th>
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
                      Loading credit notes register...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-muted-foreground text-sm">
                      No credit notes found. Create one using the button above.
                    </td>
                  </tr>
                ) : (
                  filtered.map((cn) => (
                    <tr key={cn.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 font-mono text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(cn.noteDate).toLocaleDateString("en-IN")}
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-purple-400 whitespace-nowrap">
                        {cn.noteNo}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-foreground">{cn.customerName}</div>
                        {cn.customerGstin && (
                          <div className="text-[11px] font-mono text-muted-foreground">
                            {cn.customerGstin}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs font-mono text-muted-foreground whitespace-nowrap">
                        {cn.originalInvoiceNo ? (
                          <div>
                            <div>{cn.originalInvoiceNo}</div>
                            {cn.originalInvoiceDate && (
                              <div className="text-[10px]">
                                {new Date(cn.originalInvoiceDate).toLocaleDateString("en-IN")}
                              </div>
                            )}
                          </div>
                        ) : (
                          "Direct"
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs">
                        <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[11px] font-medium">
                          {cn.reason || "Sales Return"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-xs">
                        {formatINR(cn.taxableValue)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-xs text-muted-foreground">
                        {formatINR(cn.cgstAmount)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-xs text-muted-foreground">
                        {formatINR(cn.sgstAmount)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-xs text-muted-foreground">
                        {formatINR(cn.igstAmount)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-xs text-foreground">
                        {formatINR(cn.totalAmount)}
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
                    <td className="py-3 px-4 text-right font-mono text-indigo-400">
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

export default CreditNotesRegisterPage;
