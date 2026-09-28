import { useEffect, useState } from "react";
import { Activity, CheckCircle2, AlertCircle, Cpu, Database, Server } from "lucide-react";
import api from "../services/api";

interface HealthData {
  service: string;
  status: string;
  database?: { status: string };
  aiEngine?: {
    status: string;
    details?: {
      llm_provider?: string;
      gemini_model?: string;
      openai_configured?: boolean;
    };
  };
}

export default function SystemStatusBadge() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let active = true;

    async function checkHealth() {
      try {
        const res = await api.get<HealthData>("/health");
        if (active) setHealth(res.data);
      } catch {
        if (active) setHealth(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const isBackendOk = health?.status === "healthy";
  const isDbOk = health?.database?.status === "connected";
  const isAiOk = health?.aiEngine?.status === "healthy";
  const allConnected = isBackendOk && isDbOk && isAiOk;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs hover:bg-white/10 transition"
        title="View Services Connection Status"
      >
        <span
          className={`h-2 w-2 rounded-full ${
            loading
              ? "bg-amber-400 animate-pulse"
              : allConnected
              ? "bg-emerald-400"
              : isBackendOk
              ? "bg-cyan"
              : "bg-red-400"
          }`}
        />
        <span className="font-medium text-slate-300">
          {loading
            ? "Checking..."
            : allConnected
            ? "Full Stack Online"
            : isBackendOk
            ? "Connected"
            : "Offline"}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 w-72 rounded-2xl border border-white/10 bg-[#0d1422] p-4 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan">
              System Connections
            </span>
            <span className="text-[10px] text-slate-400">Live Diagnostics</span>
          </div>

          <div className="space-y-2.5 text-xs">
            {/* Backend */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-300">
                <Server size={14} className="text-purple" />
                <span>Backend Express API</span>
              </div>
              <span className={`font-semibold ${isBackendOk ? "text-emerald-400" : "text-red-400"}`}>
                {isBackendOk ? "Port 5000 OK" : "Offline"}
              </span>
            </div>

            {/* AI Engine */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-300">
                <Cpu size={14} className="text-cyan" />
                <span>AI Engine (LLM)</span>
              </div>
              <span className={`font-semibold ${isAiOk ? "text-emerald-400" : "text-amber-400"}`}>
                {isAiOk
                  ? health?.aiEngine?.details?.llm_provider
                    ? `${health.aiEngine.details.llm_provider.toUpperCase()} Active`
                    : "Port 8000 OK"
                  : "Standby"}
              </span>
            </div>

            {/* Database */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-300">
                <Database size={14} className="text-emerald-400" />
                <span>MongoDB Cloud</span>
              </div>
              <span className={`font-semibold ${isDbOk ? "text-emerald-400" : "text-slate-400"}`}>
                {isDbOk ? "Connected" : health?.database?.status || "Standby"}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
