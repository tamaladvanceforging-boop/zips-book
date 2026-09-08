"use client";

import React, { useEffect, useState, useTransition } from "react";
import { getCompanyProfile } from "@/server/company/companyActions";
import { getVendors } from "@/server/vendors/vendorActions";
import { getPaymentVouchers, createPaymentVoucher, CreatePaymentInput } from "@/server/vouchers/voucherActions";
import { formatINR } from "@/lib/gstUtils";
import { CreditCard, Save, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";

export default function PaymentVoucherPage() {
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [formData, setFormData] = useState<CreatePaymentInput>({
    voucherNo: "",
    date: new Date().toISOString().split("T")[0],
    paymentType: "VENDOR",
    vendorId: "",
    vendorCode: "",
    paidTo: "",
    expenseAccount: "Salary Expense",
    mode: "Bank",
    amount: 0,
    narration: "",
    debitAccount: "Sundry Creditors",
    creditAccount: "Bank Account",
    pan: "",
    tdsApplicable: false,
    tdsSection: "194Q",
    tdsRate: 0.1,
  });

  const loadData = async () => {
    setLoading(true);
    const [compRes, vendRes, vRes] = await Promise.all([
      getCompanyProfile(),
      getVendors(),
      getPaymentVouchers(),
    ]);

    if (compRes.success && compRes.data) {
      const prefix = compRes.data.paymentPrefix || "PMT-";
      const nextNo = compRes.data.nextPaymentNo || 1;
      setFormData((prev) => ({
        ...prev,
        voucherNo: `${prefix}${String(nextNo).padStart(5, "0")}`,
      }));
    }
    if (vendRes.success && vendRes.data) {
      setVendors(vendRes.data);
      if (vendRes.data.length > 0) {
        const v = vendRes.data[0];
        setFormData((prev) => ({
          ...prev,
          vendorId: v.id,
          vendorCode: v.code,
          paidTo: v.name,
          pan: v.pan || "",
          tdsApplicable: v.tdsApplicable,
          tdsSection: v.tdsSection || "194Q",
          tdsRate: v.tdsRate || 0.1,
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

  const handleVendorSelect = (vendorId: string) => {
    const v = vendors.find((vend) => vend.id === vendorId);
    if (v) {
      setFormData((prev) => ({
        ...prev,
        vendorId: v.id,
        vendorCode: v.code,
        paidTo: v.name,
        pan: v.pan || "",
        tdsApplicable: v.tdsApplicable,
        tdsSection: v.tdsSection || "194Q",
        tdsRate: v.tdsRate || 0.1,
        debitAccount: "Sundry Creditors",
      }));
    }
  };

  const handleModeChange = (mode: string) => {
    setFormData((prev) => ({
      ...prev,
      mode,
      creditAccount: mode.toLowerCase().includes("cash") ? "Cash-in-Hand" : "Bank Account",
    }));
  };

  const amount = Number(formData.amount) || 0;
  const tdsAmount = formData.tdsApplicable ? Math.round((amount * (formData.tdsRate || 0)) / 100 * 100) / 100 : 0;
  const netAmount = amount - tdsAmount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      setFeedback({ type: "error", message: "Please enter a valid amount greater than 0." });
      return;
    }
    setFeedback(null);
    startTransition(async () => {
      const res = await createPaymentVoucher(formData);
      if (res.success) {
        setFeedback({ type: "success", message: `Payment Voucher ${formData.voucherNo} posted to Day Book successfully!` });
        loadData();
      } else {
        setFeedback({ type: "error", message: res.error || "Failed to post payment voucher." });
      }
    });
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        <RefreshCw className="h-5 w-5 animate-spin mr-2" /> Loading Payment Voucher...
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-rose-500" />
            <h1 className="text-xl font-bold tracking-tight">Payment Voucher (Disbursements - F5)</h1>
          </div>
          <p className="text-xs text-muted-foreground">
            Disburse funds to vendors or record expense payments (Salary, Rent, Utilities) with automatic TDS & double-entry posting.
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
          New Payment Voucher
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
            <label className="font-medium text-foreground">Payment Type</label>
            <select
              value={formData.paymentType}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  paymentType: e.target.value as any,
                  debitAccount: e.target.value === "VENDOR" ? "Sundry Creditors" : formData.expenseAccount || "Salary Expense",
                })
              }
              className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs outline-none focus:border-primary font-medium"
            >
              <option value="VENDOR">To Vendor (Sundry Creditor)</option>
              <option value="EXPENSE">Direct Business Expense</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-medium text-foreground">Payment Mode *</label>
            <select
              value={formData.mode}
              onChange={(e) => handleModeChange(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs outline-none focus:border-primary font-medium"
            >
              <option value="Bank">Bank Transfer (NEFT/RTGS)</option>
              <option value="Cash">Cash-in-Hand</option>
              <option value="Cheque">Bank Cheque</option>
              <option value="UPI">UPI / Digital</option>
            </select>
          </div>
        </div>

        {formData.paymentType === "VENDOR" ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs pt-2">
            <div className="space-y-1">
              <label className="font-medium text-foreground">Select Vendor *</label>
              <select
                value={formData.vendorId}
                onChange={(e) => handleVendorSelect(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs outline-none focus:border-primary font-semibold"
              >
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.code}) - Bal: {formatINR(v.outstandingBalance || 0)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-medium text-foreground">Paid To (Beneficiary Name)</label>
              <input
                type="text"
                value={formData.paidTo}
                onChange={(e) => setFormData({ ...formData, paidTo: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs outline-none focus:border-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-foreground">PAN</label>
              <input
                type="text"
                value={formData.pan || ""}
                onChange={(e) => setFormData({ ...formData, pan: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs font-mono uppercase outline-none focus:border-primary"
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
            <div className="space-y-1">
              <label className="font-medium text-foreground">Expense Ledger Account *</label>
              <select
                value={formData.expenseAccount || "Salary Expense"}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    expenseAccount: e.target.value,
                    debitAccount: e.target.value,
                  })
                }
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs outline-none focus:border-primary font-medium"
              >
                <option value="Salary Expense">5020 - Salary Expense</option>
                <option value="Rent Expense">5030 - Rent Expense</option>
                <option value="Other Expenses">5040 - Other Expenses</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-medium text-foreground">Paid To (Recipient)</label>
              <input
                required
                type="text"
                value={formData.paidTo}
                onChange={(e) => setFormData({ ...formData, paidTo: e.target.value })}
                placeholder="e.g. Landlord / Employee"
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs outline-none focus:border-primary"
              />
            </div>
          </div>
        )}

        {/* Amount & Double-Entry Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs pt-2">
          <div className="space-y-1">
            <label className="font-medium text-foreground">Payment Amount (₹) *</label>
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
            <label className="font-medium text-foreground">Debit Ledger (Recipient)</label>
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

        {/* TDS Options */}
        {formData.paymentType === "VENDOR" && (
          <div className="p-3 rounded-lg border border-border bg-muted/30 space-y-2 text-xs">
            <label className="flex items-center gap-2 cursor-pointer font-medium text-foreground">
              <input
                type="checkbox"
                checked={formData.tdsApplicable}
                onChange={(e) => setFormData({ ...formData, tdsApplicable: e.target.checked })}
                className="rounded border-input text-primary"
              />
              <span>Deduct TDS on this Payment (e.g. 194Q)</span>
            </label>

            {formData.tdsApplicable && (
              <div className="grid grid-cols-3 gap-3 pt-1">
                <div>
                  <span className="text-muted-foreground">TDS Section:</span>
                  <input
                    type="text"
                    value={formData.tdsSection || "194Q"}
                    onChange={(e) => setFormData({ ...formData, tdsSection: e.target.value })}
                    className="w-full rounded border border-input bg-background px-2 py-1 text-xs font-mono mt-0.5"
                  />
                </div>
                <div>
                  <span className="text-muted-foreground">TDS Rate (%):</span>
                  <input
                    type="number"
                    step="0.001"
                    value={formData.tdsRate || 0.1}
                    onChange={(e) => setFormData({ ...formData, tdsRate: Number(e.target.value) })}
                    className="w-full rounded border border-input bg-background px-2 py-1 text-xs mt-0.5"
                  />
                </div>
                <div>
                  <span className="text-muted-foreground">TDS Deducted:</span>
                  <div className="font-mono font-bold text-amber-600 dark:text-amber-400 mt-1">
                    {formatINR(tdsAmount)}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="space-y-1 text-xs">
          <label className="font-medium text-foreground">Narration / Remarks</label>
          <input
            type="text"
            value={formData.narration || ""}
            onChange={(e) => setFormData({ ...formData, narration: e.target.value })}
            placeholder="e.g. Payment made via RTGS against bill"
            className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs outline-none focus:border-primary"
          />
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="text-xs">
            <span className="text-muted-foreground">Net Disbursed:</span>{" "}
            <span className="font-mono font-bold text-rose-600 dark:text-rose-400 text-sm">
              {formatINR(netAmount)}
            </span>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-5 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50 transition shadow-xs cursor-pointer"
          >
            {saving ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" /> Recording Payment...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" /> Save Payment Voucher (F5)
              </>
            )}
          </button>
        </div>
      </form>

      {/* Payment Vouchers History Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs space-y-2">
        <div className="p-4 border-b border-border">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
            Payment Vouchers History
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase font-semibold text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-2.5">Voucher No</th>
                <th className="px-4 py-2.5">Date</th>
                <th className="px-4 py-2.5">Paid To</th>
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
                    No payment vouchers recorded yet.
                  </td>
                </tr>
              ) : (
                vouchers.map((v) => (
                  <tr key={v.id} className="hover:bg-muted/20 transition">
                    <td className="px-4 py-2.5 font-mono font-bold text-foreground">{v.voucherNo}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {new Date(v.date).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-4 py-2.5 font-semibold text-foreground">{v.paidTo}</td>
                    <td className="px-4 py-2.5">
                      <span className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono border border-border">
                        {v.mode}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">{v.debitAccount}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{v.creditAccount}</td>
                    <td className="px-4 py-2.5 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
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
