import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth";
import { can } from "../permissions";
import type { Product } from "../types";

type Mode = "create" | "edit";

export default function ProductForm({ mode }: { mode: Mode }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canWrite = can.writeProducts(user?.role);

  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [description, setDescription] = useState("");
  const [quantityOnHand, setQty] = useState("0");
  const [costPrice, setCost] = useState("");
  const [sellingPrice, setSell] = useState("");
  const [lowStockThreshold, setLow] = useState("");

  useEffect(() => {
    if (mode !== "edit" || !id) return;
    api<{ product: Product }>(`/api/products/${id}`)
      .then(({ product }) => {
        setName(product.name);
        setSku(product.sku);
        setDescription(product.description ?? "");
        setQty(String(product.quantityOnHand));
        setCost(product.costPrice != null ? String(product.costPrice) : "");
        setSell(product.sellingPrice != null ? String(product.sellingPrice) : "");
        setLow(
          product.lowStockThreshold != null ? String(product.lowStockThreshold) : ""
        );
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [mode, id]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canWrite) return;
    setError(null);
    setSaving(true);
    const payload = {
      name,
      sku,
      description: description || null,
      quantityOnHand: Number(quantityOnHand),
      costPrice: costPrice === "" ? null : Number(costPrice),
      sellingPrice: sellingPrice === "" ? null : Number(sellingPrice),
      lowStockThreshold: lowStockThreshold === "" ? null : Number(lowStockThreshold),
    };
    try {
      if (mode === "edit" && id) {
        await api(`/api/products/${id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await api("/api/products", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      navigate("/products");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-slate-500 text-sm">Loading…</p>;

  if (mode === "create" && !canWrite) {
    return (
      <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded p-3 max-w-xl">
        You don't have permission to create products.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">
        {mode === "edit" ? (canWrite ? "Edit product" : "Product details") : "Add product"}
      </h1>
      {!canWrite && mode === "edit" && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded p-3 max-w-2xl">
          You have read-only access. Only admins and managers can edit products.
        </div>
      )}
      <form onSubmit={onSubmit} className="bg-white rounded-lg shadow p-6 max-w-2xl space-y-4">
        <Field label="Name *">
          <input
            required
            disabled={!canWrite}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-slate-300 rounded px-3 py-2 disabled:bg-slate-50 disabled:text-slate-500"
          />
        </Field>
        <Field label="SKU *">
          <input
            required
            disabled={!canWrite}
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            className="w-full border border-slate-300 rounded px-3 py-2 disabled:bg-slate-50 disabled:text-slate-500"
          />
        </Field>
        <Field label="Description">
          <textarea
            disabled={!canWrite}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full border border-slate-300 rounded px-3 py-2 disabled:bg-slate-50 disabled:text-slate-500"
          />
        </Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Quantity on hand *">
            <input
              type="number"
              min={0}
              step={1}
              required
              disabled={!canWrite}
              value={quantityOnHand}
              onChange={(e) => setQty(e.target.value)}
              className="w-full border border-slate-300 rounded px-3 py-2 disabled:bg-slate-50 disabled:text-slate-500"
            />
          </Field>
          <Field label="Low-stock threshold (optional)">
            <input
              type="number"
              min={0}
              step={1}
              disabled={!canWrite}
              value={lowStockThreshold}
              onChange={(e) => setLow(e.target.value)}
              placeholder="Uses org default if empty"
              className="w-full border border-slate-300 rounded px-3 py-2 disabled:bg-slate-50 disabled:text-slate-500"
            />
          </Field>
          <Field label="Cost price (optional)">
            <input
              type="number"
              min={0}
              step="0.01"
              disabled={!canWrite}
              value={costPrice}
              onChange={(e) => setCost(e.target.value)}
              className="w-full border border-slate-300 rounded px-3 py-2 disabled:bg-slate-50 disabled:text-slate-500"
            />
          </Field>
          <Field label="Selling price (optional)">
            <input
              type="number"
              min={0}
              step="0.01"
              disabled={!canWrite}
              value={sellingPrice}
              onChange={(e) => setSell(e.target.value)}
              className="w-full border border-slate-300 rounded px-3 py-2 disabled:bg-slate-50 disabled:text-slate-500"
            />
          </Field>
        </div>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <div className="flex gap-3">
          {canWrite && (
            <button
              type="submit"
              disabled={saving}
              className="bg-indigo-600 text-white rounded px-4 py-2 hover:bg-indigo-700 disabled:opacity-60"
            >
              {saving ? "Saving..." : mode === "edit" ? "Save changes" : "Create product"}
            </button>
          )}
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded px-4 py-2 border border-slate-300 hover:bg-slate-100"
          >
            {canWrite ? "Cancel" : "Back"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm mb-1">{label}</span>
      {children}
    </label>
  );
}
