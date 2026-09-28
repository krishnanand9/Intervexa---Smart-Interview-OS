import { useState, type FormEvent } from "react";
import { ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Logo from "../components/Logo";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  });

  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setBusy(true);

    try {
      await register(form.name, form.email, form.password);
      navigate("/dashboard");
    } catch (error: any) {
      setError(
        error?.response?.data?.message ||
          "Registration failed. Please check your details."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-ink px-6 py-8 text-slate-100">
      <Logo />

      <div className="mx-auto grid min-h-[85vh] max-w-5xl place-items-center lg:grid-cols-2 lg:gap-16">
        <div className="hidden lg:block">
          <p className="text-sm font-medium text-cyan">YOUR INTERVIEW OS</p>
          <h1 className="mt-4 text-5xl font-black tracking-tight">
            Build confidence before the real interview.
          </h1>
          <p className="mt-5 max-w-md leading-7 text-slate-400">
            Create your workspace and start practicing with a clean, focused
            dashboard.
          </p>
        </div>

        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-card p-7 shadow-2xl sm:p-9">
          <h2 className="text-2xl font-bold">Create your account</h2>
          <p className="mt-2 text-sm text-slate-400">
            Your first practice session starts here.
          </p>

          <form onSubmit={submit} className="mt-7 space-y-5">
            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <label className="block">
              <span className="mb-2 block text-sm text-slate-300">
                Full name
              </span>
              <input
                required
                value={form.name}
                onChange={(event) =>
                  setForm({ ...form, name: event.target.value })
                }
                placeholder="Krishna Nand"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm text-slate-300">
                Email
              </span>
              <input
                required
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm({ ...form, email: event.target.value })
                }
                placeholder="you@example.com"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm text-slate-300">
                Password
              </span>
              <input
                required
                minLength={8}
                type="password"
                value={form.password}
                onChange={(event) =>
                  setForm({ ...form, password: event.target.value })
                }
                placeholder="At least 8 characters"
              />
            </label>

            <button
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple to-cyan py-3.5 font-semibold disabled:opacity-60"
            >
              {busy ? (
                "Creating account..."
              ) : (
                <>
                  Create account <ArrowRight size={17} />
                </>
              )}
            </button>

            <p className="text-center text-sm text-slate-500">
              Already have an account?{" "}
              <Link to="/login" className="text-cyan hover:underline">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
