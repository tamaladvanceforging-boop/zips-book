"use client";

import React, { useEffect, useState, useTransition } from "react";
import { getCustomers, createCustomer, updateCustomer, deleteCustomer, CustomerInput } from "@/server/customers/customerActions";
import { formatINR, INDIAN_STATES } from "@/lib/gstUtils";
import { notify } from "@/lib/notify";
import { Users, Plus, Search, Edit2, Trash2, X, RefreshCw, Phone, Mail } from "lucide-react";

const CustomersPage = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [formData, setFormData] = useState<CustomerInput>({
    code: "",
    name: "",
    address: "",
    state: "West Bengal",
    stateCode: "19",
    gstin: "",
    phone: "",
    email: "",
    openingBalance: 0,
  });

  const loadCustomers = async () => {
    setLoading(true);
    const res = await getCustomers();
    if (res.success && res.data) {
      setCustomers(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const openAdd = () => {
    setIsEditing(false);
    setActiveId(null);
    setFormData({
      code: `CUS${String(customers.length + 1).padStart(3, "0")}`,
      name: "",
      address: "",
      state: "West Bengal",
      stateCode: "19",
      gstin: "",
      phone: "",
      email: "",
      openingBalance: 0,
    });
    setModalOpen(true);
  };

  const openEdit = (c: any) => {
    setIsEditing(true);
    setActiveId(c.id);
    setFormData({
      code: c.code,
      name: c.name,
      address: c.address,
      state: c.state,
      stateCode: c.stateCode,
      gstin: c.gstin || "",
      phone: c.phone || "",
      email: c.email || "",
      openingBalance: c.openingBalance,
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
    if (!confirm(`Are you sure you want to delete customer ${name}?`)) return;
    startTransition(async () => {
      const res = await deleteCustomer(id);
      if (res.success) {
        notify.success(`Customer ${name} deleted.`);
      } else {
        notify.error("Failed to delete customer.");
      }
      loadCustomers();
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      let res;
      if (isEditing && activeId) {
        res = await updateCustomer(activeId, formData);
      } else {
        res = await createCustomer(formData);
      }
      if (res?.success) {
        notify.success(`Customer ${formData.name} saved successfully!`);
        setModalOpen(false);
        loadCustomers();
      } else {
        notify.error(res?.error || "Failed to save customer.");
      }
    });
  };

  const filtered = customers.filter(
    (c) =>
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.gstin && c.gstin.toLowerCase().includes(search.toLowerCase())) ||
      (c.phone && c.phone.includes(search))
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-500" />
            <h1 className="text-xl font-bold tracking-tight">Customer Master (Sundry Debtors)</h1>
          </div>
          <p className="text-xs text-muted-foreground">
            Manage customer directories, addresses, GSTIN credentials, and live outstanding balances.
          </p>
        </div>

        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Customer</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customers by code, name, phone, or GSTIN..."
            className="w-full rounded-lg border border-input bg-card pl-9 pr-4 py-2 text-xs outline-none focus:border-primary"
          />
        </div>
        <div className="text-xs text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{filtered.length}</span> customers
        </div>
      </div>

      {/* Customers Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase font-semibold text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Customer Name</th>
                <th className="px-4 py-3">Address & State</th>
                <th className="px-4 py-3">GSTIN</th>
                <th className="px-4 py-3">Contact Details</th>
                <th className="px-4 py-3 text-right">Outstanding (₹)</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-muted-foreground">
                    <RefreshCw className="h-4 w-4 animate-spin mx-auto mb-1" /> Loading customers...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-muted-foreground">
                    No customers found. Click "+ Add New Customer" to create one.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/30 transition">
                    <td className="px-4 py-3 font-mono font-medium text-foreground">{c.code}</td>
                    <td className="px-4 py-3 font-semibold text-foreground">{c.name}</td>
                    <td className="px-4 py-3">
                      <div className="text-foreground truncate max-w-[200px]">{c.address}</div>
                      <div className="text-[10px] text-muted-foreground font-mono">
                        {c.state} (Code: {c.stateCode})
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono">
                      {c.gstin ? (
                        <span className="text-foreground font-medium">{c.gstin}</span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground italic">Unregistered</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {c.phone && (
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-mono">
                          <Phone className="h-3 w-3" /> {c.phone}
                        </div>
                      )}
                      {c.email && (
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Mail className="h-3 w-3" /> {c.email}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      <span
                        className={
                          c.outstandingBalance > 0
                            ? "text-amber-600 dark:text-amber-400 font-bold"
                            : "text-muted-foreground"
                        }
                      >
                        {formatINR(c.outstandingBalance || 0)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => openEdit(c)}
                          className="p-1 rounded text-muted-foreground hover:text-primary hover:bg-muted transition"
                          title="Edit"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(c.id, c.name)}
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
                {isEditing ? "Edit Customer" : "Add New Customer"}
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
                  <label className="font-medium text-foreground">Customer Code *</label>
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
                <label className="font-medium text-foreground">Customer / Business Name *</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Rahim Traders"
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
                  placeholder="e.g. 45 Park Street, Kolkata"
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
                  <label className="font-medium text-foreground">GSTIN (Optional)</label>
                  <input
                    type="text"
                    value={formData.gstin || ""}
                    onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                    placeholder="19BBBBB1111B1Z2"
                    className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs font-mono uppercase outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-foreground">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone || ""}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="98XXXXXXXX"
                    className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-foreground">Email Address</label>
                  <input
                    type="email"
                    value={formData.email || ""}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="client@mail.com"
                    className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-foreground">Opening Balance (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.openingBalance || 0}
                  onChange={(e) => setFormData({ ...formData, openingBalance: Number(e.target.value) })}
                  className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs outline-none focus:border-primary"
                />
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
                  {pending ? "Saving..." : isEditing ? "Update Customer" : "Save Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomersPage;
