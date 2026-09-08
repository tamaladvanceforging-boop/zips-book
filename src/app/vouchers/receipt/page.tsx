"use client";

import React, { useEffect, useState, useTransition } from "react";
import { getCompanyProfile } from "@/server/company/companyActions";
import { getCustomers } from "@/server/customers/customerActions";
import { getReceiptVouchers, createReceiptVoucher, CreateReceiptInput } from "@/server/vouchers/voucherActions";
import { formatINR } from "@/lib/gstUtils";
import { Wallet, Save, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";

export default function ReceiptVoucherPage() {
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [formData, setFormData] = useState<CreateReceiptInput>({
    voucherNo: "",
    date: new Date().toISOString().split("T")[0],
    receiptType: "CUSTOMER",
    customerId: "",
    customerCode: "",
    receivedFrom: "",
    incomeAccount: "Sales Account",
    mode: "Bank",
    amount: 0,
    narration: "",
    debitAccount: "Bank Account",
    creditAccount: "Sundry Debtors",
  });

  const loadData = async () => {
    setLoading(true);
    const [compRes, custRes, vRes] = await Promise.all([
      getCompanyProfile(),
      getCustomers(),
      getReceiptVouchers(),
    ]);

    if (compRes.success && compRes.data) {
      const prefix = compRes.data.receiptPrefix || "RCT-";
      const nextNo = compRes.data.nextReceiptNo || 1;
      setFormData((prev) => ({
        ...prev,
        voucherNo: `${prefix}${String(nextNo).padStart(5, "0")}`,
      }));
    }
    if (custRes.success && custRes.data) {
      setCustomers(custRes.data);
      if (custRes.data.length > 0) {
        const c = custRes.data[0];
        setFormData((prev) => ({
          ...prev,
          customerId: c.id,
          customerCode: c.code,
          receivedFrom: c.name,
        }));
      }
    }
    if (vRes.success && vRes.data) {
      setVouchers(vRes.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCustomerSelect = (customerId: string) => {
    const c = customers.find((cust) => cust.id === customerId);
    if (c) {
      setFormData((prev) => ({
        ...prev,
        customerId: c.id,
        customerCode: c.code,
        receivedFrom: c.name,
        creditAccount: "Sundry Debtors",
      }));
    }
  };

  const handleModeChange = (mode: string) => {
    setFormData((prev) => ({
      ...prev,
      mode,
      debitAccount: mode.toLowerCase().includes("cash") ? "Cash-in-Hand" : "Bank Account",
    }));
  };

  const amount = Number(formData.amount) || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      setFeedback({ type: "error", message: "Please enter a valid amount greater than 0." });
      return;
    }
    setFeedback(null);
    startTransition(async () => {
      const res = await createReceiptVoucher(formData);
      if (res.success) {
        setFeedback({
          type: "success",
          message: `Receipt Voucher ${formData.voucherNo} posted to Day Book successfully!`,
        });
        loadData();
      } else {
        setFeedback({ type: "error", message: res.error || "Failed to post receipt voucher." });
      }
    });
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        <RefreshCw className="h-5 w-5 animate-spin mr-2" /> Loading Receipt Voucher...
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-emerald-500" />
            <h1 className="text-xl font-bold tracking-tight">Receipt Voucher (Collections - F6)</h1>
          </div>
          <p className="text-xs text-muted-foreground">
            Record inflows from customers or other revenue into bank or cash account with automatic double-entry journal posting.
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

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-xs">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground border-b border-border pb-2">
          New Receipt Voucher
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div className="space-y-1">
            <label className="font-medium text-foreground">Voucher No *</label>
            <input
              required
              type="text"
              value={formData.voucherNo}
              onChange={(e) => setFormData({ ...formData, voucherNo: e.target.value })}
              className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs font-mono font-bold outline-none focus:border-primary"
            />
          </div>

          <div className="space-y-1">
            <label className="font-medium text-foreground">Date *</label>
            <input
              required
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs outline-none focus:border-primary"
            />
          </div>

          <div className="space-y-1">
            <label className="font-medium text-foreground">Receipt Type</label>
            <select
              value={formData.receiptType}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  receiptType: e.target.value as any,
                  creditAccount: e.target.value === "CUSTOMER" ? "Sundry Debtors" : formData.incomeAccount || "Sales Account",
                })
              }
              className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs outline-none focus:border-primary font-medium"
            >
              <option value="CUSTOMER">From Customer (Sundry Debtor)</option>
              <option value="INCOME">Other Business Income</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-medium text-foreground">Receipt Mode *</label>
            <select
              value={formData.mode}
              onChange={(e) => handleModeChange(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs outline-none focus:border-primary font-medium"
            >
              <option value="Bank">Bank Account (Deposit/Transfer)</option>
              <option value="Cash">Cash-in-Hand</option>
              <option value="Cheque">Bank Cheque</option>
              <option value="UPI">UPI / QR Code</option>
            </select>
          </div>
        </div>

        {formData.receiptType === "CUSTOMER" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
            <div className="space-y-1">
              <label className="font-medium text-foreground">Select Customer *</label>
              <select
                value={formData.customerId}
                onChange={(e) => handleCustomerSelect(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs outline-none focus:border-primary font-semibold"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code}) - Due: {formatINR(c.outstandingBalance || 0)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-medium text-foreground">Received From (Payer Name)</label>
              <input
                type="text"
                value={formData.receivedFrom}
                onChange={(e) => setFormData({ ...formData, receivedFrom: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs outline-none focus:border-primary"
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
            <div className="space-y-1">
              <label className="font-medium text-foreground">Income Ledger Account *</label>
              <select
                value={formData.incomeAccount || "Sales Account"}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    incomeAccount: e.target.value,
                    creditAccount: e.target.value,
                  })
                }
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs outline-none focus:border-primary font-medium"
              >
                <option value="Sales Account">4010 - Sales Account</option>
                <option value="Capital Account">3010 - Capital Account</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-medium text-foreground">Received From</label>
              <input
                required
                type="text"
                value={formData.receivedFrom}
                onChange={(e) => setFormData({ ...formData, receivedFrom: e.target.value })}
                placeholder="e.g. Client / Depositor"
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs outline-none focus:border-primary"
              />
            </div>
          </div>
        )}

        {/* Amount & Double-Entry Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs pt-2">
          <div className="space-y-1">
            <label className="font-medium text-foreground">Receipt Amount (₹) *</label>
            <input
              required
              type="number"
              step="0.01"
              value={formData.amount || ""}
              onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
              placeholder="0.00"
              className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm font-bold text-foreground outline-none focus:border-primary font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="font-medium text-foreground">Debit Ledger (Destination)</label>
            <input
              readOnly
              value={formData.debitAccount}
              className="w-full rounded-md border border-input bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="font-medium text-foreground">Credit Ledger (Source)</label>
            <input
              readOnly
              value={formData.creditAccount}
              className="w-full rounded-md border border-input bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground outline-none"
            />
          </div>
        </div>

        <div className="space-y-1 text-xs">
          <label className="font-medium text-foreground">Narration / Remarks</label>
          <input
            type="text"
            value={formData.narration || ""}
            onChange={(e) => setFormData({ ...formData, narration: e.target.value })}
            placeholder="e.g. Receipt against invoice clearance"
            className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs outline-none focus:border-primary"
          />
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="text-xs">
            <span className="text-muted-foreground">Amount Collected:</span>{" "}
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
              {formatINR(amount)}
            </span>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition shadow-xs cursor-pointer"
          >
            {saving ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" /> Recording Collection...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" /> Save Receipt Voucher (F6)
              </>
            )}
          </button>
        </div>
      </form>

      {/* Receipt Vouchers History Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs space-y-2">
        <div className="p-4 border-b border-border">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
            Receipt Vouchers History
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase font-semibold text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-2.5">Voucher No</th>
                <th className="px-4 py-2.5">Date</th>
                <th className="px-4 py-2.5">Received From</th>
                <th className="px-4 py-2.5">Mode</th>
                <th className="px-4 py-2.5">Debit Account</th>
                <th className="px-4 py-2.5">Credit Account</th>
                <th className="px-4 py-2.5 text-right">Amount (₹)</th>
                <th className="px-4 py-2.5">Narration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {vouchers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-6 text-muted-foreground">
                    No receipt vouchers recorded yet.
                  </td>
                </tr>
              ) : (
                vouchers.map((v) => (
                  <tr key={v.id} className="hover:bg-muted/20 transition">
                    <td className="px-4 py-2.5 font-mono font-bold text-foreground">{v.voucherNo}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {new Date(v.date).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-4 py-2.5 font-semibold text-foreground">{v.receivedFrom}</td>
                    <td className="px-4 py-2.5">
                      <span className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono border border-border">
                        {v.mode}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">{v.debitAccount}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{v.creditAccount}</td>
                    <td className="px-4 py-2.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {formatINR(v.amount)}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground text-[11px] truncate max-w-[200px]">
                      {v.narration || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
