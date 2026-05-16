import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import type { DashboardData } from "../types";

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<DashboardData>("/api/dashboard")
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="text-red-600 text-sm">{error}</p>;
  if (!data) return <p className="text-slate-500 text-sm">Loading…</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-slate-500">{data.organizationName}</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Card label="Total products" value={data.totalProducts.toString()} />
        <Card label="Total units on hand" value={data.totalQuantity.toString()} />
        <Card
          label="Low-stock items"
          value={data.lowStock.length.toString()}
          accent="text-red-600"
        />
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-semibold">Low stock items</h2>
          <Link to="/products" className="text-sm text-indigo-600 hover:underline">
            View all products
          </Link>
        </div>
        {data.lowStock.length === 0 ? (
          <p className="px-4 py-6 text-sm text-slate-500">No low-stock items.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">SKU</th>
                <th className="px-4 py-2">Qty on hand</th>
                <th className="px-4 py-2">Threshold</th>
              </tr>
            </thead>
            <tbody>
              {data.lowStock.map((p) => (
                <tr key={p.id} className="border-t border-slate-100">
                  <td className="px-4 py-2">
                    <Link to={`/products/${p.id}`} className="text-indigo-600 hover:underline">
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2">{p.sku}</td>
                  <td className="px-4 py-2 text-red-600 font-medium">{p.quantityOnHand}</td>
                  <td className="px-4 py-2">
                    {p.lowStockThreshold}
                    {p.usesDefaultThreshold && (
                      <span className="ml-1 text-slate-400 text-xs">(default)</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Card({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="text-sm text-slate-500">{label}</div>
      <div className={`text-3xl font-semibold mt-1 ${accent ?? ""}`}>{value}</div>
    </div>
  );
}
