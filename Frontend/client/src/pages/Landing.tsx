import {
  ArrowRight,
  BrainCircuit,
  ShieldCheck,
  Sparkles,
  Video
} from "lucide-react";
import { Link } from "react-router-dom";
import Logo from "../components/Logo";

export default function Landing() {
  const features = [
    {
      icon: Video,
      title: "Real interview room",
      text: "A focused workspace for camera, voice, transcript, and interview feedback."
    },
    {
      icon: BrainCircuit,
      title: "AI coaching",
      text: "Measure clarity, confidence, relevance, structure, and communication."
    },
    {
      icon: ShieldCheck,
      title: "Protected workspace",
      text: "Your account is connected to the InterVexa Express authentication API."
    }
  ];

  return (
    <div className="min-h-screen overflow-hidden bg-ink text-slate-100">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Logo />
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="rounded-xl px-4 py-2 text-sm text-slate-300 hover:text-white"
          >
            Sign in
          </Link>
          <Link
            to="/register"
            className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-ink hover:bg-slate-200"
          >
            Get started
          </Link>
        </div>
      </nav>

      <section className="relative mx-auto max-w-7xl px-6 pb-24 pt-20 text-center lg:pt-28">
        <div className="pointer-events-none absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-purple/20 blur-3xl" />
        <div className="relative">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-purple/20 bg-purple/5 px-4 py-2 text-xs text-purple-200">
            <Sparkles size={14} />
            AI-powered interview practice
          </div>

          <h1 className="mx-auto mt-7 max-w-5xl text-5xl font-black tracking-tight sm:text-6xl lg:text-7xl">
            Turn interview anxiety into{" "}
            <span className="gradient-text">interview readiness.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-400">
            Practice realistic interviews, sharpen your answers, and get
            structured feedback in one focused workspace.
          </p>

          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple to-cyan px-6 py-3.5 font-semibold shadow-glow"
            >
              Start practicing
              <ArrowRight size={18} />
            </Link>
            <Link
              to="/login"
              className="rounded-xl border border-white/10 px-6 py-3.5 font-semibold text-slate-200 hover:bg-white/5"
            >
              I already have an account
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-5 px-6 pb-24 md:grid-cols-3">
        {features.map(({ icon: Icon, title, text }) => (
          <div
            key={title}
            className="intervexa-card rounded-2xl border border-white/10 bg-card p-6"
          >
            <Icon className="text-cyan" />
            <h3 className="mt-5 font-semibold">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
