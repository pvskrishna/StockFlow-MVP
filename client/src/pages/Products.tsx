import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth";
import { can } from "../permissions";
import type { Product } from "../types";

export default function Products() {
  const { user, organization } = useAuth();
  const canWrite = can.writeProducts(user?.role);
  const canDelete = can.deleteProducts(user?.role);
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const defaultThreshold = organization?.defaultLowStockThreshold ?? 5;

  async function reload() {
    try {
      const { products } = await api<{ products: Product[] }>("/api/products");
      setProducts(products);
    } catch (e: any) {
      setError(e.message);
    }
  }

  useEffect(() => {
    reload();
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(needle) ||
        p.sku.toLowerCase().includes(needle)
    );
  }, [q, products]);

  async function adjust(id: string, delta: number) {
    setBusyId(id);
    try {
      await api(`/api/products/${id}/adjust`, {
        method: "POST",
        body: JSON.stringify({ delta }),
      });
      await reload();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setBusyId(id);
    try {
      await api(`/api/products/${id}`, { method: "DELETE" });
      await reload();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Products</h1>
        {canWrite && (
          <Link
            to="/products/new"
            className="bg-indigo-600 text-white rounded px-3 py-2 text-sm hover:bg-indigo-700"
          >
            + Add product
          </Link>
        )}
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="bg-white rounded-lg shadow">
        <div className="p-3 border-b border-slate-200">
          <input
            placeholder="Search by name or SKU..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full sm:w-80 border border-slate-300 rounded px-3 py-2 text-sm"
          />
        </div>
        {filtered.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">No products yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">SKU</th>
                <th className="px-4 py-2">Quantity</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Selling price</th>
                <th className="px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const threshold = p.lowStockThreshold ?? defaultThreshold;
                const low = p.quantityOnHand <= threshold;
                const busy = busyId === p.id;
                return (
                  <tr key={p.id} className="border-t border-slate-100">
                    <td className="px-4 py-2">
                      <Link
                        to={`/products/${p.id}`}
                        className="text-indigo-600 hover:underline"
                      >
                        {p.name}
                      </Link>
                    </td>
                    <td className="px-4 py-2">{p.sku}</td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-1">
                        <button
                          disabled={!canWrite || busy || p.quantityOnHand === 0}
                          onClick={() => adjust(p.id, -1)}
                          className="w-7 h-7 rounded border border-slate-300 hover:bg-slate-100 disabled:opacity-40"
                          aria-label="Decrease"
                        >
                          −
                        </button>
                        <span className="w-10 text-center font-medium">{p.quantityOnHand}</span>
                        <button
                          disabled={!canWrite || busy}
                          onClick={() => adjust(p.id, 1)}
                          className="w-7 h-7 rounded border border-slate-300 hover:bg-slate-100 disabled:opacity-40"
                          aria-label="Increase"
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      {low ? (
                        <span className="inline-block px-2 py-0.5 rounded bg-red-100 text-red-700 text-xs">
                          Low stock
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded bg-green-100 text-green-700 text-xs">
                          OK
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {p.sellingPrice != null ? p.sellingPrice.toFixed(2) : "—"}
                    </td>
                    <td className="px-4 py-2 text-right space-x-3">
                      <Link
                        to={`/products/${p.id}`}
                        className="text-indigo-600 hover:underline"
                      >
                        {canWrite ? "Edit" : "View"}
                      </Link>
                      {canDelete && (
                        <button
                          disabled={busy}
                          onClick={() => remove(p.id, p.name)}
                          className="text-red-600 hover:underline disabled:opacity-50"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
