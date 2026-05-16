import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function onLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  const navCls = ({ isActive }: { isActive: boolean }) =>
    `hover:text-indigo-600 ${isActive ? "text-indigo-600 font-medium" : "text-slate-600"}`;

  return (
    <div className="min-h-full flex flex-col">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-6">
          <Link to="/dashboard" className="font-bold text-lg text-indigo-600">
            StockFlow
          </Link>
          <nav className="flex gap-4 text-sm">
            <NavLink to="/dashboard" className={navCls}>Dashboard</NavLink>
            <NavLink to="/products" className={navCls}>Products</NavLink>
            <NavLink to="/settings" className={navCls}>Settings</NavLink>
          </nav>
          <div className="ml-auto flex items-center gap-3 text-sm text-slate-500">
            <span className="hidden sm:inline">{user?.email}</span>
            <button
              onClick={onLogout}
              className="px-2 py-1 rounded border border-slate-300 hover:bg-slate-100"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
