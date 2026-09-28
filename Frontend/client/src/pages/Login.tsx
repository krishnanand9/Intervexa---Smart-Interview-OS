import {
  useState,
  type FormEvent,
  type ReactNode
} from "react";
import { ArrowRight, Eye, EyeOff, Sparkles } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Logo from "../components/Logo";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setBusy(true);

    try {
      await login(email, password);

      const state = location.state as { from?: string } | null;
      navigate(state?.from || "/dashboard");
    } catch (error: any) {
      setError(
        error?.response?.data?.message ||
          "Login failed. Check your credentials."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to continue your interview practice."
    >
      <form onSubmit={submit} className="space-y-5">
        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <Field label="Email">
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            required
            placeholder="you@example.com"
          />
        </Field>

        <Field label="Password">
          <div className="relative">
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type={show ? "text" : "password"}
              required
              placeholder="••••••••"
              className="pr-12"
            />
            <button
              type="button"
              onClick={() => setShow((value) => !value)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
            >
              {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </Field>

        <button
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple to-cyan py-3.5 font-semibold disabled:opacity-60"
        >
          {busy ? "Signing in..." : <>Sign in <ArrowRight size={17} /></>}
        </button>

        <p className="text-center text-sm text-slate-500">
          Don't have an account?{" "}
          <Link to="/register" className="text-cyan hover:underline">
            Create one
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm text-slate-300">{label}</span>
      {children}
    </label>
  );
}

function AuthLayout({
  title,
  subtitle,
  children
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-ink px-6 py-8 text-slate-100">
      <Logo />

      <div className="mx-auto grid min-h-[85vh] max-w-5xl place-items-center lg:grid-cols-2 lg:gap-16">
        <div className="hidden lg:block">
          <div className="mb-5 inline-flex rounded-full border border-purple/20 bg-purple/5 p-3 text-purple">
            <Sparkles />
          </div>
          <h1 className="text-5xl font-black tracking-tight">
            Practice with a system, not guesswork.
          </h1>
          <p className="mt-5 max-w-md leading-7 text-slate-400">
            InterVexa gives you one workspace for realistic interview practice
            and measurable progress.
          </p>
        </div>

        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-card p-7 shadow-2xl sm:p-9">
          <h2 className="text-2xl font-bold">{title}</h2>
          <p className="mt-2 text-sm text-slate-400">{subtitle}</p>
          <div className="mt-7">{children}</div>
        </div>
      </div>
    </div>
  );
}
