import {
  BarChart3,
  CalendarDays,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  UserRound,
  X,
  BrainCircuit,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Logo from "./Logo";
import SystemStatusBadge from "./SystemStatusBadge";

const links = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/interviews", label: "Interviews", icon: CalendarDays },
  { to: "/interview-setup", label: "New Interview", icon: Sparkles },
  { to: "/test-ai", label: "Test AI Sandbox", icon: BrainCircuit },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/profile", label: "Profile", icon: UserRound },
];

export default function AppShell() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  async function doLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-ink text-slate-100">
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 border-r border-white/10 bg-surface/95 p-5 backdrop-blur-xl transition-transform lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between">
          <Logo />
          <button
            className="text-slate-400 lg:hidden"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          >
            <X />
          </button>
        </div>

        <div className="mt-8 rounded-2xl border border-purple/20 bg-purple/5 p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-purple to-cyan font-bold text-white shadow-glow">
              {user?.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold text-white">{user?.name || "Candidate"}</p>
              <p className="truncate text-xs text-slate-500">{user?.email || "candidate@intervexa.io"}</p>
            </div>
          </div>
        </div>

        <nav className="mt-8 space-y-2">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition ${
                  isActive
                    ? "bg-purple/15 text-white ring-1 ring-purple/20 font-semibold"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-5 left-5 right-5">
          <button
            onClick={doLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-400 hover:bg-red-500/10 hover:text-red-300 transition"
          >
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      </aside>

      {open && (
        <button
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={() => setOpen(false)}
          aria-label="Close navigation"
        />
      )}

      <main className="lg:pl-72">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-white/10 bg-ink/80 px-5 backdrop-blur-xl lg:px-8">
          <button
            className="text-slate-300 lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <Menu />
          </button>

          <div className="hidden lg:block">
            <p className="text-xs text-slate-500">Smart Interview OS</p>
            <p className="text-sm font-medium">InterVexa · Real-Time AI Interviewer</p>
          </div>

          <div className="flex items-center gap-3">
            <SystemStatusBadge />

            <Link
              to="/test-ai"
              className="hidden sm:flex items-center gap-1.5 rounded-lg border border-purple/30 bg-purple/10 px-3 py-1.5 text-xs text-purple font-medium hover:bg-purple/20"
            >
              <BrainCircuit size={14} /> AI Diagnostics
            </Link>

            <Link
              to="/profile"
              className="rounded-xl border border-white/10 p-2 text-slate-300 hover:bg-white/5"
            >
              <Settings size={18} />
            </Link>
          </div>
        </header>

        <Outlet />
      </main>
    </div>
  );
}
