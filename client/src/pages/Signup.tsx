import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [organizationName, setOrg] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await signup(email, password, organizationName);
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      setError(err.message ?? "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="h-full flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-lg shadow p-6">
        <h1 className="text-xl font-semibold mb-1">Create your account</h1>
        <p className="text-sm text-slate-500 mb-5">Start tracking inventory in seconds</p>
        <form onSubmit={onSubmit} className="space-y-3">
          <label className="block">
            <span className="block text-sm mb-1">Organization name</span>
            <input
              required
              value={organizationName}
              onChange={(e) => setOrg(e.target.value)}
              placeholder="My Test Store"
              className="w-full border border-slate-300 rounded px-3 py-2"
            />
          </label>
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
            <span className="block text-sm mb-1">Password</span>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-slate-300 rounded px-3 py-2"
            />
          </label>
          <label className="block">
            <span className="block text-sm mb-1">Confirm password</span>
            <input
              type="password"
              required
              minLength={8}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full border border-slate-300 rounded px-3 py-2"
            />
          </label>
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white rounded py-2 hover:bg-indigo-700 disabled:opacity-60"
          >
            {loading ? "Creating..." : "Sign up"}
          </button>
        </form>
        <p className="text-sm text-slate-500 mt-4">
          Already have an account?{" "}
          <Link to="/login" className="text-indigo-600 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
