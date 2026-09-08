"use client";

import React, { useEffect, useState, useTransition } from "react";
import { getVendors, createVendor, updateVendor, deleteVendor, VendorInput } from "@/server/vendors/vendorActions";
import { formatINR, INDIAN_STATES } from "@/lib/gstUtils";
import { Factory, Plus, Search, Edit2, Trash2, X, RefreshCw } from "lucide-react";

export default function VendorsPage() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [formData, setFormData] = useState<VendorInput>({
    code: "",
    name: "",
    address: "",
    state: "West Bengal",
    stateCode: "19",
    gstin: "",
    phone: "",
    email: "",
    pan: "",
    tdsApplicable: false,
    tdsSection: "194Q",
    tdsRate: 0.1,
    openingBalance: 0,
  });

  const loadVendors = async () => {
    setLoading(true);
    const res = await getVendors();
    if (res.success && res.data) {
      setVendors(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadVendors();
  }, []);

  const openAdd = () => {
    setIsEditing(false);
    setActiveId(null);
    setFormData({
      code: `VEN${String(vendors.length + 1).padStart(3, "0")}`,
      name: "",
      address: "",
      state: "West Bengal",
      stateCode: "19",
      gstin: "",
      phone: "",
      email: "",
      pan: "",
      tdsApplicable: false,
      tdsSection: "194Q",
      tdsRate: 0.1,
      openingBalance: 0,
    });
    setModalOpen(true);
  };

  const openEdit = (v: any) => {
    setIsEditing(true);
    setActiveId(v.id);
    setFormData({
      code: v.code,
      name: v.name,
      address: v.address,
      state: v.state,
      stateCode: v.stateCode,
      gstin: v.gstin || "",
      phone: v.phone || "",
      email: v.email || "",
      pan: v.pan || "",
      tdsApplicable: v.tdsApplicable,
      tdsSection: v.tdsSection || "194Q",
      tdsRate: v.tdsRate,
      openingBalance: v.openingBalance,
    });
    setModalOpen(true);
  };

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedState = INDIAN_STATES.find((s) => s.name === e.target.value);
    setFormData((prev) => ({
      ...prev,
      state: e.target.value,
      stateCode: selectedState ? selectedState.code : prev.stateCode,
    }));
  };

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete vendor ${name}?`)) return;
    startTransition(async () => {
      await deleteVendor(id);
      loadVendors();
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      if (isEditing && activeId) {
        await updateVendor(activeId, formData);
      } else {
        await createVendor(formData);
      }
      setModalOpen(false);
      loadVendors();
    });
  };

  const filtered = vendors.filter(
    (v) =>
      v.code.toLowerCase().includes(search.toLowerCase()) ||
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      (v.gstin && v.gstin.toLowerCase().includes(search.toLowerCase())) ||
      (v.pan && v.pan.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Factory className="h-5 w-5 text-amber-500" />
            <h1 className="text-xl font-bold tracking-tight">Vendor Master (Sundry Creditors)</h1>
          </div>
          <p className="text-xs text-muted-foreground">
            Manage vendor profiles, PAN, TDS rules (194Q), and live payable ledger balances.
          </p>
        </div>

        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Vendor</span>
        </button>
      </div>

      {/* Search and stats */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search vendors by code, name, PAN, or GSTIN..."
            className="w-full rounded-lg border border-input bg-card pl-9 pr-4 py-2 text-xs outline-none focus:border-primary"
          />
        </div>
        <div className="text-xs text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{filtered.length}</span> vendors
        </div>
      </div>

      {/* Vendors Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase font-semibold text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Vendor Name</th>
                <th className="px-4 py-3">Address & State</th>
                <th className="px-4 py-3">GSTIN & PAN</th>
                <th className="px-4 py-3 text-center">TDS Rule</th>
                <th className="px-4 py-3 text-right">Outstanding (₹)</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-muted-foreground">
                    <RefreshCw className="h-4 w-4 animate-spin mx-auto mb-1" /> Loading vendors...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-muted-foreground">
                    No vendors found. Click "+ Add New Vendor" to register one.
                  </td>
                </tr>
              ) : (
                filtered.map((v) => (
                  <tr key={v.id} className="hover:bg-muted/30 transition">
                    <td className="px-4 py-3 font-mono font-medium text-foreground">{v.code}</td>
                    <td className="px-4 py-3 font-semibold text-foreground">{v.name}</td>
                    <td className="px-4 py-3">
                      <div className="text-foreground truncate max-w-[200px]">{v.address}</div>
                      <div className="text-[10px] text-muted-foreground font-mono">
                        {v.state} (Code: {v.stateCode})
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono">
                      {v.gstin && <div className="text-foreground font-medium">{v.gstin}</div>}
                      {v.pan && <div className="text-[10px] text-muted-foreground">PAN: {v.pan}</div>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {v.tdsApplicable ? (
                        <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold text-[10px]">
                          {v.tdsSection} @ {v.tdsRate}%
                        </span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">No TDS</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      <span
                        className={
                          v.outstandingBalance > 0
                            ? "text-rose-600 dark:text-rose-400 font-bold"
                            : "text-muted-foreground"
                        }
                      >
                        {formatINR(v.outstandingBalance || 0)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => openEdit(v)}
                          className="p-1 rounded text-muted-foreground hover:text-primary hover:bg-muted transition"
                          title="Edit"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(v.id, v.name)}
                          className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-muted transition"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Dialog */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-sm font-bold text-foreground">
                {isEditing ? "Edit Vendor" : "Add New Vendor"}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-foreground">Vendor Code *</label>
                  <input
                    required
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs font-mono uppercase outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-foreground">State Code</label>
                  <input
                    readOnly
                    type="text"
                    value={formData.stateCode}
                    className="w-full rounded-md border border-input bg-muted px-3 py-1.5 text-xs font-mono text-muted-foreground outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-foreground">Vendor / Business Name *</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Ganguly Suppliers"
                  className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-foreground">Full Address *</label>
                <input
                  required
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="e.g. 22 Strand Road, Kolkata"
                  className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-foreground">State *</label>
                  <select
                    value={formData.state}
                    onChange={handleStateChange}
                    className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs outline-none focus:border-primary"
                  >
                    {INDIAN_STATES.map((st) => (
                      <option key={st.code} value={st.name}>
                        {st.name} ({st.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-foreground">GSTIN</label>
                  <input
                    type="text"
                    value={formData.gstin || ""}
                    onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                    placeholder="19DDDDD3333D1Z4"
                    className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs font-mono uppercase outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-foreground">PAN</label>
                  <input
                    type="text"
                    value={formData.pan || ""}
                    onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
                    placeholder="AABCG1234C"
                    className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs font-mono uppercase outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-foreground">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone || ""}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="98XXXXXXXX"
                    className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* TDS Configuration */}
              <div className="p-3 rounded-lg border border-border bg-muted/30 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-foreground">
                  <input
                    type="checkbox"
                    checked={formData.tdsApplicable}
                    onChange={(e) => setFormData({ ...formData, tdsApplicable: e.target.checked })}
                    className="rounded border-input text-primary"
                  />
                  <span>TDS Applicable on this Vendor</span>
                </label>

                {formData.tdsApplicable && (
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <label className="font-medium text-foreground">TDS Section</label>
                      <input
                        type="text"
                        value={formData.tdsSection || "194Q"}
                        onChange={(e) => setFormData({ ...formData, tdsSection: e.target.value })}
                        placeholder="194Q / 194C"
                        className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs font-mono outline-none focus:border-primary"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-medium text-foreground">TDS Rate (%)</label>
                      <input
                        type="number"
                        step="0.001"
                        value={formData.tdsRate}
                        onChange={(e) => setFormData({ ...formData, tdsRate: Number(e.target.value) })}
                        placeholder="0.1"
                        className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-50"
                >
                  {pending ? "Saving..." : isEditing ? "Update Vendor" : "Save Vendor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
