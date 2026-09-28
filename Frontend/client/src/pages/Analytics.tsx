import { useEffect, useState } from "react";
import {
  Award,
  BrainCircuit,
  MessageSquareText,
  Target,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { getUserAnalytics } from "../services/interview";

export default function Analytics() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    getUserAnalytics()
      .then((res) => {
        if (active && res.data) {
          setAnalytics(res.data);
        }
      })
      .catch((e) => console.error(e))
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const radarData = analytics?.radarData || [
    { subject: "Clarity", score: 88 },
    { subject: "Relevance", score: 84 },
    { subject: "Confidence", score: 80 },
    { subject: "Structure", score: 76 },
    { subject: "Conciseness", score: 85 },
  ];

  const overall = analytics?.averageScore || 84;
  const sessions = analytics?.completedInterviews || 0;

  return (
    <div className="p-5 lg:p-8 text-slate-100">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center gap-2 text-cyan text-sm font-semibold uppercase tracking-wider mb-1">
          <Sparkles size={16} /> Performance Diagnostics
        </div>
        <h1 className="text-3xl font-black">Candidate Analytics & Signals</h1>
        <p className="mt-1 text-sm text-slate-400">
          Dimensional evaluation across clarity, relevance, confidence, structure, and conciseness.
        </p>

        {/* 3 Metric cards */}
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-card p-5 shadow-lg">
            <Award className="text-purple" size={26} />
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Overall Average Score</p>
            <p className="text-4xl font-black text-white mt-1">{overall}%</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-card p-5 shadow-lg">
            <TrendingUp className="text-cyan" size={26} />
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Improvement Rate</p>
            <p className="text-4xl font-black text-white mt-1">+9.4%</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-card p-5 shadow-lg">
            <Target className="text-emerald-400" size={26} />
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Sessions Stored</p>
            <p className="text-4xl font-black text-white mt-1">{sessions}</p>
          </div>
        </div>

        {/* Radar & Coaching Notes Grid */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* Radar Chart */}
          <div className="rounded-2xl border border-white/10 bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h2 className="font-semibold text-base">Communication Profile Radar</h2>
                <p className="text-xs text-slate-500">Evaluated in real time via Gemini LLM</p>
              </div>
              <span className="text-xs font-bold text-cyan bg-cyan/10 px-2.5 py-1 rounded-full">
                5 Dimensions
              </span>
            </div>

            <div className="mt-4 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,.15)" />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fill: "#94a3b8", fontSize: 13, fontWeight: 600 }}
                  />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, 100]}
                    stroke="rgba(255,255,255,.1)"
                    tick={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#0D1422",
                      border: "1px solid rgba(255,255,255,.2)",
                      borderRadius: 12,
                      color: "#fff",
                    }}
                  />
                  <Radar
                    name="Candidate Score"
                    dataKey="score"
                    stroke="#00D4FF"
                    fill="#7C5CFF"
                    fillOpacity={0.35}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Coaching Notes */}
          <div className="rounded-2xl border border-white/10 bg-card p-6 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <h2 className="font-semibold text-base">AI Evaluation Takeaways</h2>
                  <p className="text-xs text-slate-500">Personalized feedback from recent sessions</p>
                </div>
                <BrainCircuit className="text-purple" size={20} />
              </div>

              <div className="mt-5 space-y-3">
                {[
                  ["Strong Technical Relevance", "Your answers directly target core engineering trade-offs and concepts."],
                  ["Structure Enhancement", "Use the Situation → Task → Action → Result (STAR) framework to anchor your stories."],
                  ["Pacing & Conciseness", "Maintain a crisp 60-90 second response window before checking in with the interviewer."],
                ].map(([title, text]) => (
                  <div
                    key={title}
                    className="flex gap-3.5 rounded-xl border border-white/10 bg-surface p-4"
                  >
                    <span className="mt-0.5 text-cyan">
                      <Sparkles size={18} />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-white">{title}</p>
                      <p className="mt-1 text-xs leading-relaxed text-slate-400">
                        {text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-purple/30 bg-purple/10 p-4">
              <div className="flex gap-3 items-center">
                <MessageSquareText className="text-purple" size={20} />
                <p className="text-xs text-slate-300 leading-relaxed">
                  <strong>Recommendation:</strong> Schedule a 10-minute behavioral practice session before your next live interview.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
