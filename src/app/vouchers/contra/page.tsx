"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeftRight, 
  ArrowLeft, 
  Save, 
  Sparkles, 
  Landmark, 
  Wallet,
  Coins
} from "lucide-react";
import { createContraVoucher } from "@/server/vouchers/contraActions";
import { getAccounts } from "@/server/accounts/accountActions";
import { numberToWordsINR } from "@/lib/gstUtils";
import { SlideUp, FadeIn } from "@/components/Motion/MotionContainer";

const ContraVoucherPage = () => {
  const router = useRouter();
  const [bankAndCashAccounts, setBankAndCashAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [voucherNo, setVoucherNo] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [transferType, setTransferType] = useState<"CASH_TO_BANK" | "BANK_TO_CASH" | "BANK_TO_BANK">("CASH_TO_BANK");
  const [sourceAccount, setSourceAccount] = useState("Cash-in-Hand");
  const [targetAccount, setTargetAccount] = useState("State Bank of India");
  const [amount, setAmount] = useState<number>(10000);
  const [narration, setNarration] = useState("Cash deposited into Current Bank Account");

  useEffect(() => {
    async function load() {
      const res = await getAccounts();
      if (res.success && res.data) {
        const filtered = res.data.filter(
          (a: any) =>
            a.category === "Bank Accounts" ||
            a.category === "Current Assets" ||
            a.name.toLowerCase().includes("bank") ||
            a.name.toLowerCase().includes("cash")
        );
        setBankAndCashAccounts(filtered);
      }
    }
    load();
  }, []);

  const handleTypeChange = (type: "CASH_TO_BANK" | "BANK_TO_CASH" | "BANK_TO_BANK") => {
    setTransferType(type);
    if (type === "CASH_TO_BANK") {
      setSourceAccount("Cash-in-Hand");
      setTargetAccount("State Bank of India");
      setNarration("Cash deposited into Bank");
    } else if (type === "BANK_TO_CASH") {
      setSourceAccount("State Bank of India");
      setTargetAccount("Cash-in-Hand");
      setNarration("Cash withdrawn from Bank for office expenses");
    } else {
      setSourceAccount("State Bank of India");
      setTargetAccount("HDFC Bank Account");
      setNarration("Fund transfer between Bank Accounts");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      setFeedback({ type: "error", message: "Transfer amount must be greater than zero." });
      return;
    }
    if (sourceAccount === targetAccount) {
      setFeedback({ type: "error", message: "Source and Target accounts cannot be the same." });
      return;
    }

    setLoading(true);
    setFeedback(null);

    const res = await createContraVoucher({
      voucherNo: voucherNo || undefined,
      date,
      transferType,
      sourceAccount,
      targetAccount,
      amount,
      narration,
    });

    if (res.success && res.data) {
      setFeedback({ type: "success", message: `Contra Voucher ${res.data.voucherNo} recorded successfully! Day Book updated.` });
      router.refresh();
    } else {
      setFeedback({ type: "error", message: res.error || "Failed to record Contra voucher." });
    }
    setLoading(false);
  };

  return (
    <SlideUp className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <Link
          href={"/dashboard" as any}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Gateway of Tally
        </Link>
        <span className="text-xs font-mono text-muted-foreground">Tally Voucher: F4 Contra</span>
      </div>

      {/* Main Title Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-zinc-900 to-indigo-950 text-white border border-indigo-500/20 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[11px] font-semibold border border-indigo-500/30">
            <Sparkles className="h-3 w-3" />
            Cash & Bank Liquidity
          </div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-100 flex items-center gap-2">
            <ArrowLeftRight className="h-6 w-6 text-indigo-400" />
            Contra Voucher (F4)
          </h1>
          <p className="text-xs text-zinc-400">
            Records internal transfers between Cash-in-Hand and Bank Accounts or inter-bank accounts.
          </p>
        </div>
      </div>

      {feedback && (
        <FadeIn className={`p-4 rounded-xl text-xs font-medium border ${feedback.type === "success" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500" : "bg-destructive/10 border-destructive/30 text-destructive"}`}>
          {feedback.message}
        </FadeIn>
      )}

      {/* Transfer Mode Selector Tabs */}
      <div className="grid grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => handleTypeChange("CASH_TO_BANK")}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            transferType === "CASH_TO_BANK"
              ? "border-indigo-500 bg-indigo-500/10 text-foreground shadow-sm"
              : "border-border bg-card hover:border-indigo-500/40 text-muted-foreground"
          }`}
        >
          <div className="flex items-center gap-2 font-bold text-xs text-foreground">
            <Landmark className="h-4 w-4 text-indigo-500" />
            Cash Deposit (Cash &rarr; Bank)
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">Dr Bank, Cr Cash-in-Hand</p>
        </button>

        <button
          type="button"
          onClick={() => handleTypeChange("BANK_TO_CASH")}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            transferType === "BANK_TO_CASH"
              ? "border-indigo-500 bg-indigo-500/10 text-foreground shadow-sm"
              : "border-border bg-card hover:border-indigo-500/40 text-muted-foreground"
          }`}
        >
          <div className="flex items-center gap-2 font-bold text-xs text-foreground">
            <Wallet className="h-4 w-4 text-emerald-500" />
            Cash Withdrawal (Bank &rarr; Cash)
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">Dr Cash-in-Hand, Cr Bank</p>
        </button>

        <button
          type="button"
          onClick={() => handleTypeChange("BANK_TO_BANK")}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            transferType === "BANK_TO_BANK"
              ? "border-indigo-500 bg-indigo-500/10 text-foreground shadow-sm"
              : "border-border bg-card hover:border-indigo-500/40 text-muted-foreground"
          }`}
        >
          <div className="flex items-center gap-2 font-bold text-xs text-foreground">
            <Coins className="h-4 w-4 text-amber-500" />
            Inter-Bank Transfer
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">Dr Target Bank, Cr Source Bank</p>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 rounded-2xl border border-border bg-card shadow-xs space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Contra Voucher No</label>
            <input
              type="text"
              value={voucherNo}
              onChange={(e) => setVoucherNo(e.target.value)}
              placeholder="Auto (CTR-00001)"
              className="w-full h-9 px-3 rounded-xl border bg-background text-xs font-mono border-input"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Voucher Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full h-9 px-3 rounded-xl border bg-background text-xs font-mono border-input"
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t border-border">
          {/* Source Account (Credit) */}
          <div className="space-y-1.5 p-4 rounded-xl bg-muted/40 border border-border">
            <label className="text-xs font-bold text-rose-500 uppercase tracking-wider">
              Source Account (Credit / Outflow) *
            </label>
            <select
              value={sourceAccount}
              onChange={(e) => setSourceAccount(e.target.value)}
              className="w-full h-9 px-3 rounded-xl border bg-background text-xs font-medium border-input"
            >
              {bankAndCashAccounts.map((a) => (
                <option key={a.id} value={a.name}>
                  {a.name} ({a.category})
                </option>
              ))}
            </select>
            <p className="text-[10px] text-muted-foreground">This ledger balance will decrease.</p>
          </div>

          {/* Target Account (Debit) */}
          <div className="space-y-1.5 p-4 rounded-xl bg-muted/40 border border-border">
            <label className="text-xs font-bold text-emerald-500 uppercase tracking-wider">
              Target Account (Debit / Inflow) *
            </label>
            <select
              value={targetAccount}
              onChange={(e) => setTargetAccount(e.target.value)}
              className="w-full h-9 px-3 rounded-xl border bg-background text-xs font-medium border-input"
            >
              {bankAndCashAccounts.map((a) => (
                <option key={a.id} value={a.name}>
                  {a.name} ({a.category})
                </option>
              ))}
            </select>
            <p className="text-[10px] text-muted-foreground">This ledger balance will increase.</p>
          </div>
        </div>

        {/* Transfer Amount */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">Transfer Amount (₹) *</label>
          <input
            type="number"
            min="1"
            value={amount}
            onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
            className="w-full h-10 px-3.5 rounded-xl border bg-background text-base font-bold font-mono border-input"
          />
          <p className="text-[11px] text-muted-foreground">
            In words: <strong className="text-foreground italic">{numberToWordsINR(amount)}</strong>
          </p>
        </div>

        {/* Narration */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">Narration / Transfer Notes</label>
          <input
            type="text"
            value={narration}
            onChange={(e) => setNarration(e.target.value)}
            className="w-full h-9 px-3 rounded-xl border bg-background text-xs border-input"
          />
        </div>

        {/* Action Button */}
        <div className="pt-3 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? (
              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Save className="h-4 w-4" />
                Post Contra Voucher (Ctrl+A)
              </>
            )}
          </button>
        </div>
      </form>
    </SlideUp>
  );
};

export default ContraVoucherPage;
