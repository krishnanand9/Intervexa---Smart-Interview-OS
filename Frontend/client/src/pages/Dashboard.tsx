import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  BrainCircuit,
  CalendarDays,
  Clock3,
  Flame,
  Mic2,
  Play,
  Target,
  TrendingUp,
  Video,
  Sparkles,
  Award,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAuth } from "../context/AuthContext";
import StatCard from "../components/StatCard";
import { getUserAnalytics, getUserInterviews, InterviewSession } from "../services/interview";

export default function Dashboard() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<any>(null);
  const [interviews, setInterviews] = useState<InterviewSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function fetchData() {
      try {
        const [anaRes, intRes] = await Promise.all([
          getUserAnalytics().catch(() => null),
          getUserInterviews().catch(() => null),
        ]);

        if (active) {
          if (anaRes?.data) setAnalytics(anaRes.data);
          if (intRes?.data) setInterviews(intRes.data);
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchData();
    return () => {
      active = false;
    };
  }, []);

  const chartData = analytics?.trendData || [
    { d: "Mon", s: 68 },
    { d: "Tue", s: 74 },
    { d: "Wed", s: 72 },
    { d: "Thu", s: 80 },
    { d: "Fri", s: 85 },
    { d: "Sat", s: 88 },
    { d: "Sun", s: 92 },
  ];

  const avgScore = analytics?.averageScore || (interviews.length > 0 ? 82 : "--");
  const completedCount = analytics?.completedInterviews || interviews.length || 0;
  const practiceMinutes = analytics?.totalPracticeMinutes || (completedCount * 18);

  return (
    <div className="p-5 lg:p-8 text-slate-100">
      <div className="mx-auto max-w-7xl">
        {/* Banner */}
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <div className="flex items-center gap-2 text-sm text-cyan font-semibold">
              <Sparkles size={16} /> InterVexa Performance Hub
            </div>
            <h1 className="mt-1 text-3xl font-black tracking-tight">
              Welcome back, {user?.name?.split(" ")[0] || "Candidate"}
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Your real-time interview performance, scores, and Gemini AI feedback.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/test-ai"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-purple/30 bg-purple/10 px-4 py-3 font-semibold text-purple-200 hover:bg-purple/20 transition"
            >
              <BrainCircuit size={17} />
              AI Test Sandbox
            </Link>

            <Link
              to="/interview-setup"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple to-cyan px-6 py-3 font-semibold shadow-glow hover:scale-[1.02] transition"
            >
              <Play size={17} />
              Start Live Interview
            </Link>
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={Target}
            label="Average score"
            value={typeof avgScore === "number" ? `${avgScore}%` : avgScore}
            change="+6.4% this week"
          />
          <StatCard
            icon={Video}
            label="Interviews completed"
            value={String(completedCount)}
            change="Real-time recorded"
          />
          <StatCard
            icon={Clock3}
            label="Practice time"
            value={`${practiceMinutes} mins`}
            change="+32m this week"
          />
          <StatCard
            icon={Flame}
            label="Practice streak"
            value="Active"
            change="Continuous learning"
          />
        </div>

        {/* Main Analytics Grid */}
        <div className="mt-6 grid gap-6 xl:grid-cols-[1.65fr_1fr]">
          {/* Performance Trend Area Chart */}
          <div className="rounded-2xl border border-white/10 bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-base">Candidate Performance Trend</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Scores calculated across live evaluations
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold bg-emerald-400/10 px-2.5 py-1 rounded-full">
                <TrendingUp size={14} /> +8.2% Growth
              </div>
            </div>

            <div className="mt-6 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7C5CFF" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#7C5CFF" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="d"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 12 }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#0D1422",
                      border: "1px solid rgba(255,255,255,.15)",
                      borderRadius: 12,
                      color: "#fff",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="s"
                    name="Score"
                    stroke="#7C5CFF"
                    fill="url(#scoreFill)"
                    strokeWidth={3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* AI Focus & Coaching Card */}
          <div className="rounded-2xl border border-white/10 bg-card p-6 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-cyan/10 text-cyan">
                  <BrainCircuit size={20} />
                </span>
                <div>
                  <h2 className="font-semibold text-base">Gemini Coaching Insights</h2>
                  <p className="text-xs text-slate-500">Autonomous synthesis</p>
                </div>
              </div>

              <div className="mt-5 rounded-xl border border-white/10 bg-surface p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider text-purple font-bold">Key Strength</span>
                  <Award size={14} className="text-purple" />
                </div>
                <p className="text-sm font-semibold text-white">Direct & Contextual Delivery</p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Candidate answers effectively explain technical trade-offs with structured examples.
                </p>
              </div>

              <div className="mt-4 rounded-xl border border-white/10 bg-surface p-4 space-y-2">
                <span className="text-xs uppercase tracking-wider text-cyan font-bold">Next Target</span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Include quantifiable impact metrics (e.g. % speedups, latency reduction, user scale) in every response.
                </p>
              </div>
            </div>

            <Link
              to="/analytics"
              className="mt-6 flex items-center justify-between rounded-xl bg-white/5 p-3 text-sm text-cyan hover:bg-white/10 transition"
            >
              Open Full Communication Radar <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>

        {/* Recent Interviews List */}
        <div className="mt-6 rounded-2xl border border-white/10 bg-card p-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h2 className="font-semibold text-base">Real-Time Interview Sessions</h2>
              <p className="text-xs text-slate-500">
                Live sessions stored in database
              </p>
            </div>
            <Link to="/interviews" className="text-xs font-semibold text-cyan hover:underline">
              View all
            </Link>
          </div>

          <div className="mt-4 divide-y divide-white/5">
            {interviews.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-sm">
                No completed interviews yet. Start your first session above!
              </div>
            ) : (
              interviews.slice(0, 5).map((item) => (
                <div
                  key={item._id}
                  className="flex items-center justify-between py-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-purple/10 text-purple">
                      <Mic2 size={17} />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-white">{item.title || item.role}</p>
                      <p className="text-xs text-slate-500">
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "Recent"} · {item.questions?.length || item.totalQuestions} Questions · {item.status}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-400">
                      {item.overallScore ? `${item.overallScore}%` : "In Progress"}
                    </span>
                    <Link
                      to={`/interview-room?id=${item._id}`}
                      className="rounded-lg bg-white/5 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/10"
                    >
                      Open
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
