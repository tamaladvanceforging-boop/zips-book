"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  BookOpen, 
  ArrowLeft, 
  Save, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Scale
} from "lucide-react";
import { createJournalVoucher, JournalLineInput } from "@/server/vouchers/journalActions";
import { getAccounts } from "@/server/accounts/accountActions";
import { formatINR, numberToWordsINR } from "@/lib/gstUtils";
import { formatInputDate } from "@/lib/dateUtils";
import { notify } from "@/lib/notify";
import { SlideUp, FadeIn } from "@/components/Motion/MotionContainer";

interface LineItemRow {
  id: string;
  type: "Dr" | "Cr";
  accountId: string;
  accountName: string;
  debit: number;
  credit: number;
  narration: string;
  closingBalance?: number;
  balanceType?: string;
}

const JournalVoucherPage = () => {
  const router = useRouter();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [voucherNo, setVoucherNo] = useState("");
  const [date, setDate] = useState(formatInputDate(new Date()));
  const [overallNarration, setOverallNarration] = useState("");

  const [rows, setRows] = useState<LineItemRow[]>([
    {
      id: "1",
      type: "Dr",
      accountId: "",
      accountName: "",
      debit: 0,
      credit: 0,
      narration: "",
    },
    {
      id: "2",
      type: "Cr",
      accountId: "",
      accountName: "",
      debit: 0,
      credit: 0,
      narration: "",
    },
  ]);

  useEffect(() => {
    const loadAccounts = async () => {
      const res = await getAccounts();
      if (res.success && res.data) {
        setAccounts(res.data);
      }
    };
    loadAccounts();
  }, []);

  const handleAccountChange = (rowId: string, accountName: string) => {
    const acc = accounts.find((a) => a.name === accountName);
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== rowId) return r;
        return {
          ...r,
          accountId: acc ? acc.id : "",
          accountName: accountName,
          closingBalance: acc ? (acc.closingDr > 0 ? acc.closingDr : acc.closingCr) : 0,
          balanceType: acc ? (acc.closingDr > 0 ? "Dr" : "Cr") : "Dr",
        };
      })
    );
  };

  const handleTypeChange = (rowId: string, type: "Dr" | "Cr") => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== rowId) return r;
        if (type === "Dr") {
          return { ...r, type, debit: r.credit || r.debit, credit: 0 };
        } else {
          return { ...r, type, credit: r.debit || r.credit, debit: 0 };
        }
      })
    );
  };

  const handleAmountChange = (rowId: string, amount: number) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== rowId) return r;
        if (r.type === "Dr") {
          return { ...r, debit: amount, credit: 0 };
        } else {
          return { ...r, credit: amount, debit: 0 };
        }
      })
    );
  };

  const addRow = () => {
    const totalDr = rows.reduce((s, r) => s + (Number(r.debit) || 0), 0);
    const totalCr = rows.reduce((s, r) => s + (Number(r.credit) || 0), 0);
    const diff = totalDr - totalCr;

    const newType: "Dr" | "Cr" = diff > 0 ? "Cr" : "Dr";
    const suggestedAmount = Math.abs(diff);

    const newRow: LineItemRow = {
      id: Date.now().toString(),
      type: newType,
      accountId: "",
      accountName: "",
      debit: newType === "Dr" ? suggestedAmount : 0,
      credit: newType === "Cr" ? suggestedAmount : 0,
      narration: "",
    };
    setRows((prev) => [...prev, newRow]);
  };

  const removeRow = (rowId: string) => {
    if (rows.length <= 2) {
      setFeedback({ type: "error", message: "Journal voucher requires at least two lines." });
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== rowId));
  };

  const totalDebit = rows.reduce((s, r) => s + (Number(r.debit) || 0), 0);
  const totalCredit = rows.reduce((s, r) => s + (Number(r.credit) || 0), 0);
  const difference = Math.abs(totalDebit - totalCredit);
  const isBalanced = difference < 0.01 && totalDebit > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isBalanced) {
      const msg = `Debit and Credit totals must match. Current difference: ${formatINR(difference)}`;
      setFeedback({
        type: "error",
        message: msg,
      });
      notify.error(msg);
      return;
    }

    const invalidRow = rows.find((r) => !r.accountName.trim());
    if (invalidRow) {
      setFeedback({ type: "error", message: "Please select an account for every row." });
      notify.error("Please select an account for every row.");
      return;
    }

    setLoading(true);
    setFeedback(null);

    const payloadLines: JournalLineInput[] = rows.map((r) => ({
      accountId: r.accountId || undefined,
      accountName: r.accountName,
      debit: r.type === "Dr" ? Number(r.debit) : 0,
      credit: r.type === "Cr" ? Number(r.credit) : 0,
      narration: r.narration || undefined,
    }));

    const res = await createJournalVoucher({
      voucherNo: voucherNo || undefined,
      date,
      narration: overallNarration || undefined,
      lines: payloadLines,
    });

    if (res.success) {
      const msg = `Journal Voucher ${res.voucherNo} posted successfully! Ledgers and Daybook updated.`;
      setFeedback({
        type: "success",
        message: msg,
      });
      notify.success(msg);
      setVoucherNo("");
      setOverallNarration("");
      setRows([
        { id: "1", type: "Dr", accountId: "", accountName: "", debit: 0, credit: 0, narration: "" },
        { id: "2", type: "Cr", accountId: "", accountName: "", debit: 0, credit: 0, narration: "" },
      ]);
      router.refresh();
    } else {
      setFeedback({ type: "error", message: res.error || "Failed to post Journal Voucher." });
      notify.error(res.error || "Failed to post Journal Voucher.");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <SlideUp>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-background p-6 rounded-2xl border border-indigo-500/20 shadow-xl backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="p-2.5 rounded-xl bg-secondary/80 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  F7 Hotkey
                </span>
                <span className="text-xs text-muted-foreground font-mono">Tally Prime Compatible</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2 mt-1">
                <BookOpen className="w-6 h-6 text-indigo-400" />
                Journal Voucher
              </h1>
              <p className="text-xs text-muted-foreground">
                Multi-line generic journal adjustments, depreciation, provisions, and transfer entries
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/registers/daybook"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-secondary/80 hover:bg-secondary text-foreground border border-border transition-colors"
            >
              View Day Book
            </Link>
          </div>
        </div>
      </SlideUp>

      {feedback && (
        <FadeIn>
          <div
            className={`p-4 rounded-xl border flex items-center gap-3 text-sm ${
              feedback.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : "bg-rose-500/10 border-rose-500/30 text-rose-400"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        </FadeIn>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <SlideUp delay={0.1}>
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  Voucher Number (Auto or Custom)
                </label>
                <input
                  type="text"
                  value={voucherNo}
                  onChange={(e) => setVoucherNo(e.target.value)}
                  placeholder="Auto-generated (e.g. JRN-00012)"
                  className="w-full px-3.5 py-2.5 bg-background border border-input rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  Voucher Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-background border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  Reference / Narration Summary
                </label>
                <input
                  type="text"
                  value={overallNarration}
                  onChange={(e) => setOverallNarration(e.target.value)}
                  placeholder="e.g. Month-end depreciation adjustment"
                  className="w-full px-3.5 py-2.5 bg-background border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
              </div>
            </div>
          </div>
        </SlideUp>

        <SlideUp delay={0.2}>
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-indigo-400" />
                <span className="text-sm font-semibold text-foreground">Double Entry Ledger Lines</span>
              </div>
              <button
                type="button"
                onClick={addRow}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Entry Line
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/10 text-xs font-semibold text-muted-foreground">
                    <th className="py-3 px-4 w-24">By / To</th>
                    <th className="py-3 px-4 min-w-[260px]">Particulars (Account)</th>
                    <th className="py-3 px-4 w-44 text-right">Debit (₹)</th>
                    <th className="py-3 px-4 w-44 text-right">Credit (₹)</th>
                    <th className="py-3 px-4 min-w-[200px]">Line Narration</th>
                    <th className="py-3 px-4 w-16 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm">
                  {rows.map((row) => (
                    <tr key={row.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-4">
                        <select
                          value={row.type}
                          onChange={(e) => handleTypeChange(row.id, e.target.value as "Dr" | "Cr")}
                          className={`w-full py-1.5 px-2 rounded-lg font-bold text-xs border border-input focus:outline-none focus:ring-2 ${
                            row.type === "Dr"
                              ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                          }`}
                        >
                          <option value="Dr">By (Dr)</option>
                          <option value="Cr">To (Cr)</option>
                        </select>
                      </td>

                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <input
                            type="text"
                            list={`accounts-list-${row.id}`}
                            value={row.accountName}
                            onChange={(e) => handleAccountChange(row.id, e.target.value)}
                            placeholder="Type or select account..."
                            className="w-full px-3 py-1.5 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                            required
                          />
                          <datalist id={`accounts-list-${row.id}`}>
                            {accounts.map((acc) => (
                              <option key={acc.id} value={acc.name}>
                                {acc.name} ({acc.category})
                              </option>
                            ))}
                          </datalist>

                          {row.closingBalance !== undefined && row.accountName && (
                            <div className="text-[11px] text-muted-foreground font-mono">
                              Cur Bal: {formatINR(row.closingBalance)} {row.balanceType}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          disabled={row.type === "Cr"}
                          value={row.type === "Dr" ? (row.debit || "") : ""}
                          onChange={(e) => handleAmountChange(row.id, parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                          className={`w-full px-3 py-1.5 rounded-lg text-right font-mono text-sm border focus:outline-none focus:ring-2 ${
                            row.type === "Dr"
                              ? "bg-background border-input focus:ring-indigo-500/40"
                              : "bg-muted/40 border-transparent text-muted-foreground cursor-not-allowed"
                          }`}
                        />
                      </td>

                      <td className="py-3 px-4">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          disabled={row.type === "Dr"}
                          value={row.type === "Cr" ? (row.credit || "") : ""}
                          onChange={(e) => handleAmountChange(row.id, parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                          className={`w-full px-3 py-1.5 rounded-lg text-right font-mono text-sm border focus:outline-none focus:ring-2 ${
                            row.type === "Cr"
                              ? "bg-background border-input focus:ring-indigo-500/40"
                              : "bg-muted/40 border-transparent text-muted-foreground cursor-not-allowed"
                          }`}
                        />
                      </td>

                      <td className="py-3 px-4">
                        <input
                          type="text"
                          value={row.narration}
                          onChange={(e) => {
                            const val = e.target.value;
                            setRows((prev) =>
                              prev.map((r) => (r.id === row.id ? { ...r, narration: val } : r))
                            );
                          }}
                          placeholder="Line narration (optional)"
                          className="w-full px-3 py-1.5 bg-background border border-input rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                        />
                      </td>

                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          disabled={rows.length <= 2}
                          onClick={() => removeRow(row.id)}
                          className="p-1.5 text-muted-foreground hover:text-rose-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-border bg-muted/40 font-semibold">
                    <td colSpan={2} className="py-3 px-4 text-sm text-foreground text-right">
                      Total:
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-sm text-blue-400">
                      {formatINR(totalDebit)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-sm text-amber-400">
                      {formatINR(totalCredit)}
                    </td>
                    <td colSpan={2} className="py-3 px-4">
                      {isBalanced ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Balanced
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/30">
                          <AlertCircle className="w-3.5 h-3.5" /> Diff: {formatINR(difference)}
                        </span>
                      )}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </SlideUp>

        <SlideUp delay={0.3}>
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <div className="text-xs text-muted-foreground">Amount in Words</div>
              <div className="text-sm font-semibold text-foreground">
                {totalDebit > 0 ? numberToWordsINR(totalDebit) : "Zero Rupees"}
              </div>
            </div>

            <div className="flex items-center gap-4 w-full md:w-auto">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-5 py-2.5 rounded-xl border border-input text-xs font-semibold hover:bg-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !isBalanced}
                className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all w-full md:w-auto"
              >
                <Save className="w-4 h-4" />
                {loading ? "Posting Journal..." : "Post Journal Voucher (Ctrl+Enter)"}
              </button>
            </div>
          </div>
        </SlideUp>
      </form>
    </div>
  );
};

export default JournalVoucherPage;
