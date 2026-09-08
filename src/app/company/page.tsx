"use client";

import React, { useEffect, useState, useTransition } from "react";
import { getCompanyProfile, updateCompanyProfile, CompanyData } from "@/server/company/companyActions";
import { INDIAN_STATES } from "@/lib/gstUtils";
import { notify } from "@/lib/notify";
import { Building2, Save, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";

const CompanySetupPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [formData, setFormData] = useState<CompanyData>({
    name: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "West Bengal",
    stateCode: "19",
    pincode: "",
    gstin: "",
    pan: "",
    email: "",
    phone: "",
    bankName: "",
    bankAccountNo: "",
    ifscCode: "",
    invoicePrefix: "INV-",
    nextInvoiceNo: 1,
    purchasePrefix: "PUR-",
    nextPurchaseNo: 1,
    paymentPrefix: "PMT-",
    nextPaymentNo: 1,
    receiptPrefix: "RCT-",
    nextReceiptNo: 1,
  });

  useEffect(() => {
    const load = async () => {
      const res = await getCompanyProfile();
      if (res.success && res.data) {
        setFormData({
          name: res.data.name || "",
          addressLine1: res.data.addressLine1 || "",
          addressLine2: res.data.addressLine2 || "",
          city: res.data.city || "",
          state: res.data.state || "West Bengal",
          stateCode: res.data.stateCode || "19",
          pincode: res.data.pincode || "",
          gstin: res.data.gstin || "",
          pan: res.data.pan || "",
          email: res.data.email || "",
          phone: res.data.phone || "",
          bankName: res.data.bankName || "",
          bankAccountNo: res.data.bankAccountNo || "",
          ifscCode: res.data.ifscCode || "",
          invoicePrefix: res.data.invoicePrefix || "INV-",
          nextInvoiceNo: res.data.nextInvoiceNo || 1,
          purchasePrefix: res.data.purchasePrefix || "PUR-",
          nextPurchaseNo: res.data.nextPurchaseNo || 1,
          paymentPrefix: res.data.paymentPrefix || "PMT-",
          nextPaymentNo: res.data.nextPaymentNo || 1,
          receiptPrefix: res.data.receiptPrefix || "RCT-",
          nextReceiptNo: res.data.nextReceiptNo || 1,
        });
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedState = INDIAN_STATES.find((s) => s.name === e.target.value);
    setFormData((prev) => ({
      ...prev,
      state: e.target.value,
      stateCode: selectedState ? selectedState.code : prev.stateCode,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    startTransition(async () => {
      const res = await updateCompanyProfile(formData);
      if (res.success) {
        setFeedback({ type: "success", message: "Company profile updated successfully!" });
        notify.success("Company profile updated successfully!");
      } else {
        setFeedback({ type: "error", message: res.error || "Failed to update profile." });
        notify.error(res.error || "Failed to update profile.");
      }
    });
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        <RefreshCw className="h-5 w-5 animate-spin mr-2" /> Loading company setup...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl pb-12">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-bold tracking-tight">Company Setup & Numbering</h1>
          </div>
          <p className="text-xs text-muted-foreground">
            Configure business identity, tax credentials, banking info, and voucher sequences.
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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Business Details */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-xs">
          <h2 className="text-sm font-semibold border-b border-border pb-2 text-foreground">
            1. Business Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5 md:col-span-2">
              <label className="font-medium text-foreground">Company / Trade Name *</label>
              <input
                required
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-foreground">Address Line 1</label>
              <input
                type="text"
                value={formData.addressLine1}
                onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-foreground">Address Line 2 / Landmark</label>
              <input
                type="text"
                value={formData.addressLine2 || ""}
                onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-foreground">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-foreground">State</label>
              <select
                value={formData.state}
                onChange={handleStateChange}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
              >
                {INDIAN_STATES.map((st) => (
                  <option key={st.code} value={st.name}>
                    {st.name} ({st.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-foreground">State Code (GST)</label>
              <input
                type="text"
                readOnly
                value={formData.stateCode}
                className="w-full rounded-md border border-input bg-muted px-3 py-2 text-sm font-mono text-muted-foreground outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-foreground">Pincode</label>
              <input
                type="text"
                value={formData.pincode}
                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
              />
            </div>
          </div>
        </div>

        {/* GST, Tax & Contact Credentials */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-xs">
          <h2 className="text-sm font-semibold border-b border-border pb-2 text-foreground">
            2. Tax Credentials & Contact
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-medium text-foreground">GSTIN *</label>
              <input
                required
                type="text"
                value={formData.gstin}
                onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                placeholder="19AAAAA0000A1Z5"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono uppercase focus:ring-1 focus:ring-primary outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-foreground">PAN</label>
              <input
                type="text"
                value={formData.pan}
                onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
                placeholder="AAAAA0000A"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono uppercase focus:ring-1 focus:ring-primary outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-foreground">Official Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-foreground">Phone Number</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
              />
            </div>
          </div>
        </div>

        {/* Banking Details */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-xs">
          <h2 className="text-sm font-semibold border-b border-border pb-2 text-foreground">
            3. Banking Details (Printed on Invoices)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-medium text-foreground">Bank Name</label>
              <input
                type="text"
                value={formData.bankName}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-foreground">Account Number</label>
              <input
                type="text"
                value={formData.bankAccountNo}
                onChange={(e) => setFormData({ ...formData, bankAccountNo: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono focus:ring-1 focus:ring-primary outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-foreground">IFSC Code</label>
              <input
                type="text"
                value={formData.ifscCode}
                onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value.toUpperCase() })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono uppercase focus:ring-1 focus:ring-primary outline-none"
              />
            </div>
          </div>
        </div>

        {/* Voucher Prefixes & Auto-Sequencing */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-xs">
          <h2 className="text-sm font-semibold border-b border-border pb-2 text-foreground">
            4. Voucher Numbering Sequences
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-medium text-foreground">Sales Inv Prefix</label>
              <input
                type="text"
                value={formData.invoicePrefix}
                onChange={(e) => setFormData({ ...formData, invoicePrefix: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono focus:ring-1 focus:ring-primary outline-none"
              />
              <div className="text-[11px] text-muted-foreground">Next: #{formData.nextInvoiceNo}</div>
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-foreground">Purchase Prefix</label>
              <input
                type="text"
                value={formData.purchasePrefix}
                onChange={(e) => setFormData({ ...formData, purchasePrefix: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono focus:ring-1 focus:ring-primary outline-none"
              />
              <div className="text-[11px] text-muted-foreground">Next: #{formData.nextPurchaseNo}</div>
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-foreground">Payment Prefix</label>
              <input
                type="text"
                value={formData.paymentPrefix}
                onChange={(e) => setFormData({ ...formData, paymentPrefix: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono focus:ring-1 focus:ring-primary outline-none"
              />
              <div className="text-[11px] text-muted-foreground">Next: #{formData.nextPaymentNo}</div>
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-foreground">Receipt Prefix</label>
              <input
                type="text"
                value={formData.receiptPrefix}
                onChange={(e) => setFormData({ ...formData, receiptPrefix: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono focus:ring-1 focus:ring-primary outline-none"
              />
              <div className="text-[11px] text-muted-foreground">Next: #{formData.nextReceiptNo}</div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition shadow-xs cursor-pointer"
          >
            {saving ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" /> Saving Changes...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" /> Save Company Setup
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CompanySetupPage;
