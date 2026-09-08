"use client";

import React, { useEffect, useState, useTransition } from "react";
import { getAccounts, createAccount, AccountInput } from "@/server/accounts/accountActions";
import { formatINR } from "@/lib/gstUtils";
import { notify } from "@/lib/notify";
import { BookOpen, Plus, Search, RefreshCw, X } from "lucide-react";

const ChartOfAccountsPage = () => {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [modalOpen, setModalOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const [formData, setFormData] = useState<AccountInput>({
    code: "",
    name: "",
    type: "Expense",
    category: "Indirect Expenses",
    openingDr: 0,
    openingCr: 0,
  });

  const loadAccounts = async () => {
    setLoading(true);
    const res = await getAccounts();
    if (res.success && res.data) {
      setAccounts(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const openAdd = () => {
    setFormData({
      code: "",
      name: "",
      type: "Expense",
      category: "Indirect Expenses",
      openingDr: 0,
      openingCr: 0,
    });
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await createAccount(formData);
      if (res.success) {
        notify.success(`Ledger account ${formData.name} created successfully!`);
        setModalOpen(false);
        loadAccounts();
      } else {
        notify.error(res.error || "Failed to create ledger account.");
      }
    });
  };

  const filtered = accounts.filter((acc) => {
    const matchSearch =
      acc.code.toLowerCase().includes(search.toLowerCase()) ||
      acc.name.toLowerCase().includes(search.toLowerCase()) ||
      acc.category.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "ALL" || acc.type === typeFilter;
    return matchSearch && matchType;
  });

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "Asset":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
      case "Liability":
        return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";
      case "Equity":
        return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20";
      case "Income":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
      case "Expense":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-indigo-500" />
            <h1 className="text-xl font-bold tracking-tight">Chart of Accounts (COA)</h1>
          </div>
          <p className="text-xs text-muted-foreground">
            Master ledger list supporting standard double-entry bookkeeping (Assets, Liabilities, Equity, Income, Expenses).
          </p>
        </div>

        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Add Ledger Account</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <div className="relative w-full">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ledgers by code, name, category..."
              className="w-full rounded-lg border border-input bg-card pl-9 pr-4 py-2 text-xs outline-none focus:border-primary"
            />
          </div>
        </div>

        <div className="flex items-center gap-1 overflow-x-auto text-xs">
          {["ALL", "Asset", "Liability", "Equity", "Income", "Expense"].map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition cursor-pointer ${
                typeFilter === type
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Accounts Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase font-semibold text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Account Name</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-right">Opening Dr (₹)</th>
                <th className="px-4 py-3 text-right">Opening Cr (₹)</th>
                <th className="px-4 py-3 text-right">Closing Dr (₹)</th>
                <th className="px-4 py-3 text-right">Closing Cr (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-muted-foreground">
                    <RefreshCw className="h-4 w-4 animate-spin mx-auto mb-1" /> Loading Chart of Accounts...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-muted-foreground">
                    No ledger accounts matching the criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((acc) => (
                  <tr key={acc.id} className="hover:bg-muted/30 transition">
                    <td className="px-4 py-3 font-mono font-bold text-foreground">{acc.code}</td>
                    <td className="px-4 py-3 font-semibold text-foreground">
                      <div className="flex items-center gap-1.5">
                        <span>{acc.name}</span>
                        {acc.isSystem && (
                          <span className="text-[9px] font-mono px-1 rounded bg-muted text-muted-foreground border border-border">
                            SYS
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${getTypeBadge(
                          acc.type
                        )}`}
                      >
                        {acc.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{acc.category}</td>
                    <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                      {acc.openingDr > 0 ? formatINR(acc.openingDr) : "-"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                      {acc.openingCr > 0 ? formatINR(acc.openingCr) : "-"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold">
                      {acc.closingDr > 0 ? (
                        <span className="text-blue-600 dark:text-blue-400">{formatINR(acc.closingDr)}</span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold">
                      {acc.closingCr > 0 ? (
                        <span className="text-emerald-600 dark:text-emerald-400">
                          {formatINR(acc.closingCr)}
                        </span>
                      ) : (
                        "-"
                      )}
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
              <h2 className="text-sm font-bold text-foreground">Add Ledger Account</h2>
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
                  <label className="font-medium text-foreground">Account Code *</label>
                  <input
                    required
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="e.g. 5050"
                    className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs font-mono outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-foreground">Type *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs outline-none focus:border-primary font-medium"
                  >
                    <option value="Asset">Asset</option>
                    <option value="Liability">Liability</option>
                    <option value="Equity">Equity</option>
                    <option value="Income">Income</option>
                    <option value="Expense">Expense</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-foreground">Account / Ledger Name *</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Electricity Expense"
                  className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-foreground">Category / Group *</label>
                <input
                  required
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g. Indirect Expenses"
                  className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-foreground">Opening Debit (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.openingDr || 0}
                    onChange={(e) => setFormData({ ...formData, openingDr: Number(e.target.value) })}
                    className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-foreground">Opening Credit (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.openingCr || 0}
                    onChange={(e) => setFormData({ ...formData, openingCr: Number(e.target.value) })}
                    className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs outline-none focus:border-primary"
                  />
                </div>
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
                  {pending ? "Saving..." : "Save Ledger Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChartOfAccountsPage;
