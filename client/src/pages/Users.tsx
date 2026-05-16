import { useEffect, useState } from "react";
import { api, HttpError } from "../api";
import { useAuth } from "../auth";
import { can } from "../permissions";
import { ROLES, type OrgUser, type Role } from "../types";

export default function Users() {
  const { user: currentUser } = useAuth();
  const isAdmin = can.manageUsers(currentUser?.role);

  const [users, setUsers] = useState<OrgUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New-user form state (admin only)
  const [email, setEmail] = useState("");
  const [newRole, setNewRole] = useState<Role>("GUEST");
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ email: string; tempPassword: string } | null>(null);

  async function reload() {
    try {
      const { users } = await api<{ users: OrgUser[] }>("/api/users");
      setUsers(users);
    } catch (e: any) {
      setError(e.message);
    }
  }

  useEffect(() => {
    reload().finally(() => setLoading(false));
  }, []);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setCreated(null);
    setCreating(true);
    try {
      const resp = await api<{
        user: OrgUser;
        tempPassword: string;
      }>("/api/users", {
        method: "POST",
        body: JSON.stringify({ email, role: newRole }),
      });
      setCreated({ email: resp.user.email, tempPassword: resp.tempPassword });
      setEmail("");
      setNewRole("GUEST");
      await reload();
    } catch (e: any) {
      setFormError(e.message);
    } finally {
      setCreating(false);
    }
  }

  async function onChangeRole(u: OrgUser, role: Role) {
    if (role === u.role) return;
    try {
      await api(`/api/users/${u.id}`, {
        method: "PATCH",
        body: JSON.stringify({ role }),
      });
      await reload();
    } catch (e: any) {
      alert(e instanceof HttpError ? e.message : String(e));
      await reload();
    }
  }

  async function onDelete(u: OrgUser) {
    if (!confirm(`Delete user "${u.email}"? This cannot be undone.`)) return;
    try {
      await api(`/api/users/${u.id}`, { method: "DELETE" });
      await reload();
    } catch (e: any) {
      alert(e.message);
    }
  }

  if (loading) return <p className="text-slate-500 text-sm">Loading…</p>;

  return (
    <div className="space-y-6">
      {!isAdmin && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded p-3">
          You can view users, but only admins can create, modify or delete them.
        </div>
      )}

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="bg-white rounded-lg shadow">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Role</th>
              <th className="px-4 py-2">Created</th>
              <th className="px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const isSelf = u.id === currentUser?.id;
              return (
                <tr key={u.id} className="border-t border-slate-100">
                  <td className="px-4 py-2">
                    {u.email}
                    {isSelf && (
                      <span className="ml-2 text-xs text-slate-500">(you)</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {isAdmin ? (
                      <select
                        value={u.role}
                        onChange={(e) => onChangeRole(u, e.target.value as Role)}
                        className="border border-slate-300 rounded px-2 py-1 text-sm"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs">
                        {u.role}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-slate-500">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {isAdmin && !isSelf ? (
                      <button
                        onClick={() => onDelete(u)}
                        className="text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {isAdmin && (
        <div className="bg-white rounded-lg shadow p-6 max-w-xl">
          <h2 className="font-semibold mb-1">Invite user</h2>
          <p className="text-xs text-slate-500 mb-4">
            A temporary password is generated automatically. Roles:{" "}
            <strong>ADMIN</strong> (full access), <strong>MANAGER</strong>{" "}
            (manage products & stock, no settings/users),{" "}
            <strong>GUEST</strong> (view only).
          </p>
          <form onSubmit={onCreate} className="space-y-3">
            <label className="block">
              <span className="block text-sm mb-1">Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-slate-300 rounded px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="block text-sm mb-1">Role</span>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as Role)}
                className="w-full border border-slate-300 rounded px-3 py-2"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>
            {formError && <div className="text-red-600 text-sm">{formError}</div>}
            {created && (
              <div className="bg-green-50 border border-green-200 rounded p-3 text-sm space-y-2">
                <div className="font-medium text-green-800">
                  User <span className="font-mono">{created.email}</span> created.
                </div>
                <div className="text-slate-700">
                  Temporary password (shown once — copy it now):
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-white border border-slate-300 rounded px-2 py-1 font-mono select-all">
                    {created.tempPassword}
                  </code>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard?.writeText(created.tempPassword)}
                    className="text-xs border border-slate-300 rounded px-2 py-1 hover:bg-slate-100"
                  >
                    Copy
                  </button>
                </div>
                <div className="text-xs text-slate-500">
                  Share this with the user. They should change it after first sign-in.
                </div>
              </div>
            )}
            <button
              type="submit"
              disabled={creating}
              className="bg-indigo-600 text-white rounded px-4 py-2 hover:bg-indigo-700 disabled:opacity-60"
            >
              {creating ? "Creating..." : "Invite user"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
