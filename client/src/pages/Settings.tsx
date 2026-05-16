import { useEffect, useState } from "react";
import { api } from "../api";
import { useAuth } from "../auth";
import { can } from "../permissions";
import Users from "./Users";

type Tab = "general" | "users";

export default function Settings() {
  const { user, organization, refresh } = useAuth();
  const isAdmin = can.editSettings(user?.role);
  const [tab, setTab] = useState<Tab>("general");

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <p className="text-sm text-slate-500">
        Organization: {organization?.name} · Your role:{" "}
        <span className="font-medium text-slate-700">{user?.role}</span>
      </p>

      <div className="border-b border-slate-200 flex gap-4 text-sm">
        <TabButton active={tab === "general"} onClick={() => setTab("general")}>
          General
        </TabButton>
        <TabButton active={tab === "users"} onClick={() => setTab("users")}>
          Users & roles
        </TabButton>
      </div>

      {tab === "general" ? (
        <GeneralSettings canEdit={isAdmin} onSaved={refresh} />
      ) : (
        <Users />
      )}
    </div>
  );
}

function TabButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`pb-2 -mb-px border-b-2 ${
        active
          ? "border-indigo-600 text-indigo-600 font-medium"
          : "border-transparent text-slate-500 hover:text-slate-700"
      }`}
    >
      {children}
    </button>
  );
}

function GeneralSettings({
  canEdit,
  onSaved,
}: {
  canEdit: boolean;
  onSaved: () => Promise<void>;
}) {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    api<{ organizationName: string; defaultLowStockThreshold: number }>("/api/settings")
      .then((d) => setValue(String(d.defaultLowStockThreshold)))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setSaving(true);
    try {
      await api("/api/settings", {
        method: "PUT",
        body: JSON.stringify({ defaultLowStockThreshold: Number(value) }),
      });
      setMessage("Saved.");
      await onSaved();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-slate-500 text-sm">Loading…</p>;

  return (
    <div className="max-w-xl">
      {!canEdit && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded p-3 mb-4">
          You have read-only access to settings. Only admins can change them.
        </div>
      )}
      <form onSubmit={onSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
        <label className="block">
          <span className="block text-sm mb-1">Default low-stock threshold</span>
          <input
            type="number"
            min={0}
            step={1}
            required
            disabled={!canEdit}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full border border-slate-300 rounded px-3 py-2 disabled:bg-slate-50 disabled:text-slate-500"
          />
          <span className="block text-xs text-slate-500 mt-1">
            Used when a product has no individual threshold set.
          </span>
        </label>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        {message && <div className="text-green-700 text-sm">{message}</div>}
        {canEdit && (
          <button
            type="submit"
            disabled={saving}
            className="bg-indigo-600 text-white rounded px-4 py-2 hover:bg-indigo-700 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        )}
      </form>
    </div>
  );
}
