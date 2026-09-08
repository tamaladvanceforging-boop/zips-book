"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Building2, 
  ArrowLeft, 
  Save, 
  Calendar, 
  CreditCard, 
  Sparkles
} from "lucide-react";
import { createCompanyAction } from "@/server/company/companyActions";
import { INDIAN_STATES } from "@/lib/gstUtils";
import { notify } from "@/lib/notify";

const CreateCompanyPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    mailingName: "",
    addressLine1: "123 Industrial Area",
    addressLine2: "Phase 2",
    city: "Kolkata",
    state: "West Bengal",
    stateCode: "19",
    pincode: "700001",
    country: "India",
    currencySymbol: "₹",
    currencyName: "INR",
    financialYearFrom: "2025-04-01",
    booksBeginningFrom: "2025-04-01",
    gstin: "19AAAAA0000A1Z5",
    pan: "AAAAA0000A",
    email: "accounts@company.com",
    phone: "9830000000",
    bankName: "State Bank of India",
    bankAccountNo: "30495839201",
    ifscCode: "SBIN0000092",
    bankBranch: "Main Branch",
    invoicePrefix: "INV-",
    purchasePrefix: "PUR-",
    paymentPrefix: "PMT-",
    receiptPrefix: "RCT-",
  });

  const handleStateChange = (stateName: string) => {
    const found = INDIAN_STATES.find(s => s.name === stateName);
    setForm(prev => ({
      ...prev,
      state: stateName,
      stateCode: found ? found.code : prev.stateCode,
    }));
  };

  const handleGstinChange = (gstin: string) => {
    const clean = gstin.toUpperCase().trim();
    let derivedPan = form.pan;
    let derivedStateCode = form.stateCode;

    if (clean.length >= 2) {
      const code = clean.substring(0, 2);
      const stateObj = INDIAN_STATES.find(s => s.code === code);
      if (stateObj) {
        derivedStateCode = code;
      }
    }
    if (clean.length >= 12) {
      derivedPan = clean.substring(2, 12);
    }

    setForm(prev => ({
      ...prev,
      gstin: clean,
      pan: derivedPan,
      stateCode: derivedStateCode,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Company Name is required.");
      notify.error("Company Name is required.");
      return;
    }

    setLoading(true);
    setError("");

    const res = await createCompanyAction(form);
    if (res.success) {
      notify.success("Company created successfully! All Tally standard chart of accounts initialized.");
      router.push("/dashboard" as any);
      router.refresh();
    } else {
      const msg = res.error || "Failed to create company.";
      setError(msg);
      notify.error(msg);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href={"/companies" as any}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Company Gateway
        </Link>
        <span className="text-xs text-muted-foreground font-mono">Tally Form F3 • Company Creation</span>
      </div>

      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-zinc-900 to-emerald-950 text-white border border-emerald-500/20 shadow-xl flex items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-semibold border border-emerald-500/30">
            <Sparkles className="h-3 w-3" />
            Provision New Books
          </div>
          <h1 className="text-xl md:text-2xl font-black tracking-tight text-zinc-100">
            Create Enterprise Company
          </h1>
          <p className="text-xs text-zinc-400">
            Creates isolated books of accounts and automatically initializes the Standard Tally Chart of Accounts.
          </p>
        </div>
        <Building2 className="h-10 w-10 text-emerald-400/40 shrink-0 hidden sm:block" />
      </div>

      {error && (
        <div className="p-3.5 text-xs rounded-xl bg-destructive/10 border border-destructive/30 text-destructive font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. Primary Company Information */}
        <div className="p-5 rounded-2xl border border-border bg-card space-y-4 shadow-sm">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <Building2 className="h-4 w-4 text-emerald-500" />
            <h3 className="text-sm font-bold text-foreground">1. Primary Company Identification</h3>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-foreground">
                Company Name *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value, mailingName: prev.mailingName || e.target.value }))}
                placeholder="e.g. ZIPS Precision Engineering Works Ltd"
                required
                className="w-full h-10 px-3.5 rounded-xl border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40 border-input font-medium"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-foreground">
                Mailing Name (for Invoices & Reports)
              </label>
              <input
                type="text"
                value={form.mailingName}
                onChange={(e) => setForm(prev => ({ ...prev, mailingName: e.target.value }))}
                placeholder="Mailing name as printed on bill"
                className="w-full h-9 px-3.5 rounded-xl border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40 border-input"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Address Line 1</label>
              <input
                type="text"
                value={form.addressLine1}
                onChange={(e) => setForm(prev => ({ ...prev, addressLine1: e.target.value }))}
                className="w-full h-9 px-3.5 rounded-xl border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40 border-input"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Address Line 2</label>
              <input
                type="text"
                value={form.addressLine2}
                onChange={(e) => setForm(prev => ({ ...prev, addressLine2: e.target.value }))}
                className="w-full h-9 px-3.5 rounded-xl border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40 border-input"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">City</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => setForm(prev => ({ ...prev, city: e.target.value }))}
                className="w-full h-9 px-3.5 rounded-xl border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40 border-input"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">State (Place of Supply)</label>
              <select
                value={form.state}
                onChange={(e) => handleStateChange(e.target.value)}
                className="w-full h-9 px-3.5 rounded-xl border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40 border-input"
              >
                {INDIAN_STATES.map((st) => (
                  <option key={st.code} value={st.name}>
                    {st.code} - {st.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Pincode</label>
              <input
                type="text"
                value={form.pincode}
                onChange={(e) => setForm(prev => ({ ...prev, pincode: e.target.value }))}
                className="w-full h-9 px-3.5 rounded-xl border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40 border-input"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Phone</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full h-9 px-3.5 rounded-xl border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40 border-input"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-foreground">Official Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                className="w-full h-9 px-3.5 rounded-xl border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40 border-input"
              />
            </div>
          </div>
        </div>

        {/* 2. Financial Year & Statutory Details */}
        <div className="p-5 rounded-2xl border border-border bg-card space-y-4 shadow-sm">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <Calendar className="h-4 w-4 text-blue-500" />
            <h3 className="text-sm font-bold text-foreground">2. Financial Year & GST Statutory Setup</h3>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Financial Year Beginning From
              </label>
              <input
                type="date"
                value={form.financialYearFrom}
                onChange={(e) => setForm(prev => ({ ...prev, financialYearFrom: e.target.value }))}
                className="w-full h-9 px-3.5 rounded-xl border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40 border-input font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Books Beginning From
              </label>
              <input
                type="date"
                value={form.booksBeginningFrom}
                onChange={(e) => setForm(prev => ({ ...prev, booksBeginningFrom: e.target.value }))}
                className="w-full h-9 px-3.5 rounded-xl border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40 border-input font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Company GSTIN (15 Digits)
              </label>
              <input
                type="text"
                value={form.gstin}
                onChange={(e) => handleGstinChange(e.target.value)}
                placeholder="19AAAAA0000A1Z5"
                maxLength={15}
                className="w-full h-9 px-3.5 rounded-xl border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40 border-input font-mono uppercase"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Company PAN (10 Digits)
              </label>
              <input
                type="text"
                value={form.pan}
                onChange={(e) => setForm(prev => ({ ...prev, pan: e.target.value.toUpperCase().trim() }))}
                placeholder="AAAAA0000A"
                maxLength={10}
                className="w-full h-9 px-3.5 rounded-xl border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40 border-input font-mono uppercase"
              />
            </div>
          </div>
        </div>

        {/* 3. Banking & Voucher Prefixes */}
        <div className="p-5 rounded-2xl border border-border bg-card space-y-4 shadow-sm">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <CreditCard className="h-4 w-4 text-amber-500" />
            <h3 className="text-sm font-bold text-foreground">3. Bank Account & Voucher Series</h3>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Bank Name</label>
              <input
                type="text"
                value={form.bankName}
                onChange={(e) => setForm(prev => ({ ...prev, bankName: e.target.value }))}
                className="w-full h-9 px-3.5 rounded-xl border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40 border-input"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Bank Account Number</label>
              <input
                type="text"
                value={form.bankAccountNo}
                onChange={(e) => setForm(prev => ({ ...prev, bankAccountNo: e.target.value }))}
                className="w-full h-9 px-3.5 rounded-xl border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40 border-input font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">IFSC Code</label>
              <input
                type="text"
                value={form.ifscCode}
                onChange={(e) => setForm(prev => ({ ...prev, ifscCode: e.target.value.toUpperCase().trim() }))}
                className="w-full h-9 px-3.5 rounded-xl border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40 border-input font-mono uppercase"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Branch</label>
              <input
                type="text"
                value={form.bankBranch}
                onChange={(e) => setForm(prev => ({ ...prev, bankBranch: e.target.value }))}
                className="w-full h-9 px-3.5 rounded-xl border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40 border-input"
              />
            </div>

            {/* Voucher prefixes */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Sales Invoice Prefix</label>
              <input
                type="text"
                value={form.invoicePrefix}
                onChange={(e) => setForm(prev => ({ ...prev, invoicePrefix: e.target.value }))}
                placeholder="INV-"
                className="w-full h-9 px-3.5 rounded-xl border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40 border-input font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Purchase Bill Prefix</label>
              <input
                type="text"
                value={form.purchasePrefix}
                onChange={(e) => setForm(prev => ({ ...prev, purchasePrefix: e.target.value }))}
                placeholder="PUR-"
                className="w-full h-9 px-3.5 rounded-xl border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40 border-input font-mono"
              />
            </div>
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href={"/companies" as any}
            className="px-4 py-2.5 rounded-xl border hover:bg-muted text-xs font-semibold transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs md:text-sm transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Save className="h-4 w-4" />
                Accept & Create Company (Ctrl+A)
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateCompanyPage;
