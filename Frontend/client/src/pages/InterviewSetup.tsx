import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, ArrowRight, Play, CheckCircle2 } from "lucide-react";
import { startInterview } from "../services/interview";

export default function InterviewSetup() {
  const navigate = useNavigate();
  const [role, setRole] = useState("Senior Full Stack Developer");
  const [type, setType] = useState<"technical" | "behavioral" | "hr" | "mixed">("mixed");
  const [level, setLevel] = useState<"fresher" | "junior" | "mid" | "senior">("mid");
  const [questionCount, setQuestionCount] = useState(5);
  const [skillsOrResume, setSkillsOrResume] = useState("React 19, TypeScript, Node.js, REST APIs, System Design");
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleStartSession() {
    try {
      setLoading(true);
      setError("");

      const res = await startInterview({
        role,
        interviewType: type,
        experienceLevel: level,
        numberOfQuestions: questionCount,
        skillsOrResume: skillsOrResume.trim() || undefined,
        jobDescription: jobDescription.trim() || undefined,
      });

      if (res.data?._id) {
        navigate(`/interview-room?id=${res.data._id}`);
      } else {
        navigate("/interview-room");
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || "Failed to start interview session. Redirecting...");
      // Graceful fallback to room
      setTimeout(() => {
        navigate(`/interview-room?role=${encodeURIComponent(role)}&type=${type}&level=${level}`);
      }, 1200);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-ink p-6 lg:p-10 text-white">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center gap-2 text-cyan text-sm font-semibold uppercase tracking-wider mb-2">
          <Sparkles size={16} /> Interview Configuration
        </div>
        <h1 className="text-4xl font-black">Configure Your AI Interview</h1>
        <p className="mt-2 text-slate-400">
          Customize target job role, format, and experience level. The Gemini AI engine will formulate tailored questions and conversational follow-ups.
        </p>

        <div className="mt-8 rounded-3xl border border-white/10 bg-card p-8 shadow-2xl space-y-6">
          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
              {error}
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-300">
              Target Job Role / Title
            </label>
            <input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-surface p-3.5 text-white outline-none focus:border-purple"
              placeholder="e.g. Senior Frontend Engineer, Node.js Backend Architect"
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-300">
                Interview Format
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full rounded-xl border border-white/10 bg-surface p-3.5 text-white outline-none focus:border-purple"
              >
                <option value="technical">Technical (Coding & Architecture)</option>
                <option value="behavioral">Behavioral (STAR Stories & Leadership)</option>
                <option value="hr">HR & Culture Fit</option>
                <option value="mixed">Mixed (Comprehensive Simulation)</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-300">
                Experience Level
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as any)}
                className="w-full rounded-xl border border-white/10 bg-surface p-3.5 text-white outline-none focus:border-purple"
              >
                <option value="fresher">Fresher / Graduate</option>
                <option value="junior">Junior (1-2 years)</option>
                <option value="mid">Mid-Level (3-5 years)</option>
                <option value="senior">Senior (6+ years)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-300">
              Key Skills, Technologies & Resume Highlights
            </label>
            <input
              value={skillsOrResume}
              onChange={(e) => setSkillsOrResume(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-surface p-3.5 text-white outline-none focus:border-purple text-sm"
              placeholder="e.g. React 19, TypeScript, Next.js, Node.js, GraphQL, Redis, Microservices"
            />
            <p className="mt-1 text-xs text-slate-500">
              AI questions will be dynamically adapted to probe these specific tools and core concepts.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-300">
              Target Job Description / Special Topics (Optional)
            </label>
            <textarea
              rows={2}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-surface p-3.5 text-white outline-none focus:border-purple text-sm"
              placeholder="Paste responsibilities from a target job posting to simulate an authentic company interview..."
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-300">
              Number of Questions ({questionCount})
            </label>
            <input
              type="range"
              min={3}
              max={10}
              value={questionCount}
              onChange={(e) => setQuestionCount(Number(e.target.value))}
              className="w-full accent-purple"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>3 Questions (Quick)</span>
              <span>5 Questions (Standard)</span>
              <span>10 Questions (In-depth)</span>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <CheckCircle2 className="text-cyan" size={16} />
              Real-time voice recognition & vocal AI responses enabled
            </div>

            <button
              onClick={handleStartSession}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple to-cyan px-7 py-4 font-bold shadow-glow hover:scale-[1.02] transition disabled:opacity-50"
            >
              {loading ? "Starting Interview Room..." : (
                <>
                  <Play size={18} /> Enter Live Interview Room
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}