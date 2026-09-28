import { useEffect, useState } from "react";
import {
  ArrowRight,
  BriefcaseBusiness,
  Clock,
  Code2,
  Sparkles,
  Video,
  Plus,
} from "lucide-react";
import { Link } from "react-router-dom";
import { getUserInterviews, InterviewSession } from "../services/interview";

const modes = [
  {
    icon: Code2,
    title: "Technical Interview",
    type: "technical",
    description: "Architecture, coding patterns, debugging, and system scalability.",
    tag: "Engineering",
  },
  {
    icon: BriefcaseBusiness,
    title: "Behavioral Interview",
    type: "behavioral",
    description: "STAR-style responses, team leadership, conflicts, and decision-making.",
    tag: "Leadership",
  },
  {
    icon: Video,
    title: "Full Mock Interview",
    type: "mixed",
    description: "Realistic multi-round simulation combining technical, behavioral, and culture fit.",
    tag: "Complete",
  },
];

export default function Interviews() {
  const [interviews, setInterviews] = useState<InterviewSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getUserInterviews()
      .then((res) => {
        if (active && res.data) setInterviews(res.data);
      })
      .catch((e) => console.error(e))
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="p-5 lg:p-8 text-slate-100">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-cyan text-sm font-semibold uppercase tracking-wider mb-1">
              <Sparkles size={16} /> Practice Lab
            </div>
            <h1 className="text-3xl font-black">Interview Sessions</h1>
            <p className="mt-1 text-sm text-slate-400">
              Select a format or launch a custom AI mock interview.
            </p>
          </div>

          <Link
            to="/interview-setup"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple to-cyan px-5 py-3 font-semibold shadow-glow hover:scale-[1.02] transition"
          >
            <Plus size={18} /> Configure New Session
          </Link>
        </div>

        {/* 3 Formats Cards */}
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {modes.map(({ icon: Icon, title, type, description, tag }) => (
            <div
              key={title}
              className="intervexa-card rounded-2xl border border-white/10 bg-card p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-purple/10 text-purple">
                    <Icon size={22} />
                  </span>
                  <span className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-slate-400 font-medium">
                    {tag}
                  </span>
                </div>

                <h2 className="mt-5 text-lg font-bold">{title}</h2>
                <p className="mt-2 text-xs leading-relaxed text-slate-400">
                  {description}
                </p>
              </div>

              <Link
                to={`/interview-room?type=${type}`}
                className="mt-6 flex items-center justify-between rounded-xl bg-white/5 px-4 py-3 text-sm font-medium hover:bg-white/10 transition"
              >
                Start Session <ArrowRight size={16} />
              </Link>
            </div>
          ))}
        </div>

        {/* Real Past Sessions List */}
        <div className="mt-10">
          <h2 className="text-xl font-bold">Past Recorded Sessions</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Full sessions stored in database with transcript and evaluations
          </p>

          <div className="mt-4 rounded-2xl border border-white/10 bg-card divide-y divide-white/5 shadow-xl">
            {interviews.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                No past sessions recorded yet. Launch a session above to begin practicing!
              </div>
            ) : (
              interviews.map((item) => (
                <div
                  key={item._id}
                  className="flex items-center justify-between p-5 hover:bg-white/[.01] transition"
                >
                  <div>
                    <p className="font-semibold text-white">{item.title || item.role}</p>
                    <p className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                      <Clock size={13} /> {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "Recent"} · {item.questions?.length || item.totalQuestions} Questions · Status: <span className="text-cyan font-medium">{item.status}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-400">
                      {item.overallScore ? `${item.overallScore}%` : "In Progress"}
                    </span>
                    <Link
                      to={`/interview-room?id=${item._id}`}
                      className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold hover:bg-white/10"
                    >
                      Resume / Review
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
