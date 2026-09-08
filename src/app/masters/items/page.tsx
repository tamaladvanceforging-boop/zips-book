"use client";

import React, { useEffect, useState, useTransition } from "react";
import { getItems, createItem, updateItem, deleteItem, ItemInput } from "@/server/items/itemActions";
import { formatINR } from "@/lib/gstUtils";
import { notify } from "@/lib/notify";
import { Package, Plus, Search, Edit2, Trash2, X, RefreshCw } from "lucide-react";

const ItemsPage = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [formData, setFormData] = useState<ItemInput>({
    code: "",
    name: "",
    hsnSac: "",
    unit: "PCS",
    rate: 0,
    gstRate: 18,
    stockQty: 0,
  });

  const loadItems = async () => {
    setLoading(true);
    const res = await getItems();
    if (res.success && res.data) {
      setItems(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadItems();
  }, []);

  const openAdd = () => {
    setIsEditing(false);
    setActiveId(null);
    setFormData({
      code: `ITM${String(items.length + 1).padStart(3, "0")}`,
      name: "",
      hsnSac: "",
      unit: "PCS",
      rate: 0,
      gstRate: 18,
      stockQty: 0,
    });
    setModalOpen(true);
  };

  const openEdit = (itm: any) => {
    setIsEditing(true);
    setActiveId(itm.id);
    setFormData({
      code: itm.code,
      name: itm.name,
      hsnSac: itm.hsnSac,
      unit: itm.unit,
      rate: itm.rate,
      gstRate: itm.gstRate,
      stockQty: itm.stockQty,
    });
    setModalOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;
    startTransition(async () => {
      const res = await deleteItem(id);
      if (res.success) {
        notify.success(`Item ${name} deleted.`);
      } else {
        notify.error("Failed to delete item.");
      }
      loadItems();
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      let res;
      if (isEditing && activeId) {
        res = await updateItem(activeId, formData);
      } else {
        res = await createItem(formData);
      }
      if (res?.success) {
        notify.success(`Item ${formData.name} saved successfully!`);
        setModalOpen(false);
        loadItems();
      } else {
        notify.error(res?.error || "Failed to save item.");
      }
    });
  };

  const filtered = items.filter(
    (i) =>
      i.code.toLowerCase().includes(search.toLowerCase()) ||
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.hsnSac.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-emerald-500" />
            <h1 className="text-xl font-bold tracking-tight">Item Master (Inventory & Services)</h1>
          </div>
          <p className="text-xs text-muted-foreground">
            Manage product catalog, HSN/SAC codes, default rates, GST slabs, and stock counts.
          </p>
        </div>

        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Item</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items by code, name, or HSN..."
            className="w-full rounded-lg border border-input bg-card pl-9 pr-4 py-2 text-xs outline-none focus:border-primary"
          />
        </div>
        <div className="text-xs text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{filtered.length}</span> items
        </div>
      </div>

      {/* Items Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase font-semibold text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Item / Service Name</th>
                <th className="px-4 py-3">HSN / SAC</th>
                <th className="px-4 py-3">Unit</th>
                <th className="px-4 py-3 text-right">Standard Rate</th>
                <th className="px-4 py-3 text-center">GST Slab</th>
                <th className="px-4 py-3 text-right">Stock Qty</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-muted-foreground">
                    <RefreshCw className="h-4 w-4 animate-spin mx-auto mb-1" /> Loading items...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-muted-foreground">
                    No items found. Click "+ Add New Item" to create one.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/30 transition">
                    <td className="px-4 py-3 font-mono font-medium text-foreground">{item.code}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{item.name}</td>
                    <td className="px-4 py-3 font-mono text-muted-foreground">{item.hsnSac}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded bg-muted text-[10px] font-mono border border-border">
                        {item.unit}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{formatINR(item.rate)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold text-[10px]">
                        {item.gstRate}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`font-semibold ${
                          item.stockQty > 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-muted-foreground"
                        }`}
                      >
                        {item.stockQty} {item.unit}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => openEdit(item)}
                          className="p-1 rounded text-muted-foreground hover:text-primary hover:bg-muted transition"
                          title="Edit"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id, item.name)}
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
                {isEditing ? "Edit Item" : "Add New Item"}
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
                  <label className="font-medium text-foreground">Item Code *</label>
                  <input
                    required
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs font-mono uppercase outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-foreground">Unit</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs outline-none focus:border-primary"
                  >
                    <option value="PCS">PCS (Pieces)</option>
                    <option value="NOS">NOS (Numbers)</option>
                    <option value="KGS">KGS (Kilograms)</option>
                    <option value="BOX">BOX (Boxes)</option>
                    <option value="MTR">MTR (Meters)</option>
                    <option value="SET">SET (Sets)</option>
                    <option value="HRS">HRS (Hours)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-foreground">Item / Service Name *</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Sample Product A"
                  className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-foreground">HSN / SAC Code *</label>
                  <input
                    required
                    type="text"
                    value={formData.hsnSac}
                    onChange={(e) => setFormData({ ...formData, hsnSac: e.target.value })}
                    placeholder="e.g. 8471"
                    className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs font-mono outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-foreground">GST Rate (%) *</label>
                  <select
                    value={formData.gstRate}
                    onChange={(e) => setFormData({ ...formData, gstRate: Number(e.target.value) })}
                    className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs outline-none focus:border-primary font-semibold"
                  >
                    <option value="0">0% (Nil / Exempted)</option>
                    <option value="5">5%</option>
                    <option value="12">12%</option>
                    <option value="18">18% (Standard)</option>
                    <option value="28">28% (Luxury)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-foreground">Standard Rate (₹) *</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    value={formData.rate}
                    onChange={(e) => setFormData({ ...formData, rate: Number(e.target.value) })}
                    className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-foreground">Stock Quantity</label>
                  <input
                    type="number"
                    step="1"
                    value={formData.stockQty}
                    onChange={(e) => setFormData({ ...formData, stockQty: Number(e.target.value) })}
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
                  {pending ? "Saving..." : isEditing ? "Update Item" : "Save Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemsPage;
