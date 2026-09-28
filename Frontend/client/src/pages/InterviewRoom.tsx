import { useEffect, useRef, useState } from "react";
import {
  Camera,
  CameraOff,
  Mic,
  MicOff,
  PhoneOff,
  Send,
  Sparkles,
  Volume2,
  VolumeX,
  CheckCircle2,
  Activity,
  Layers,
  Award,
  ChevronRight,
  BookOpen,
  Keyboard,
  RotateCcw,
  Target,
  TrendingUp,
  BrainCircuit,
  ArrowRight,
} from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  startInterview,
  submitAnswer,
  completeInterview,
  getInterview,
  InterviewSession,
} from "../services/interview";

export default function InterviewRoom() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Media streams
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [camera, setCamera] = useState(true);
  const [mic, setMic] = useState(true);

  // Session state
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionText, setCurrentQuestionText] = useState("");
  const [currentQuestionId, setCurrentQuestionId] = useState("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(5);

  // Voice Interaction (STT & TTS)
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [aiStatus, setAiStatus] = useState<"idle" | "listening" | "thinking" | "speaking">("idle");
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);

  // Pro features state
  const [isSessionCompleted, setIsSessionCompleted] = useState(false);
  const [inputMode, setInputMode] = useState<"voice" | "text">("voice");
  const [manualAnswer, setManualAnswer] = useState("");
  const [showStarGuide, setShowStarGuide] = useState(false);

  // Silence Detection for Immediate Response
  const silenceTimerRef = useRef<any>(null);
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef<string>("");
  const lastSpokeTimeRef = useRef<number>(Date.now());
  const isSubmittingRef = useRef<boolean>(false);

  // Keep transcriptRef in sync
  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  // 1. Initialize or Load Interview Session
  useEffect(() => {
    let active = true;

    async function initSession() {
      try {
        setLoading(true);
        const urlId = searchParams.get("id");

        if (urlId) {
          const res = await getInterview(urlId);
          if (active && res.data) {
            setupActiveSession(res.data);
            return;
          }
        }

        // Start a fresh session with default or selected role
        const role = searchParams.get("role") || "Senior Full Stack Engineer";
        const type = (searchParams.get("type") as any) || "mixed";
        const level = (searchParams.get("level") as any) || "mid";

        const startRes = await startInterview({
          role,
          interviewType: type,
          experienceLevel: level,
          numberOfQuestions: 5,
        });

        if (active && startRes.data) {
          setupActiveSession(startRes.data);
        }
      } catch (err) {
        console.error("Failed to initialize session:", err);
      } finally {
        if (active) setLoading(false);
      }
    }

    initSession();

    return () => {
      active = false;
    };
  }, [searchParams]);

  function setupActiveSession(sess: InterviewSession) {
    setSession(sess);
    setTotalQuestions(sess.totalQuestions || sess.questions.length || 5);
    if (sess.status === "completed") {
      setIsSessionCompleted(true);
      return;
    }
    const qIndex = sess.currentQuestionIndex || 0;
    setCurrentQuestionIndex(qIndex);

    const activeQ = sess.questions[qIndex];
    if (activeQ) {
      setCurrentQuestionText(activeQ.question);
      setCurrentQuestionId(activeQ.questionId);
      // Auto-speak initial question
      speakAiResponse(activeQ.question);
    }
  }

  // 2. Camera Setup
  useEffect(() => {
    let active = true;

    navigator.mediaDevices
      ?.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (!active) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch((e) => {
        console.warn("Camera/mic access unavailable:", e);
        setCamera(false);
        setMic(false);
      });

    return () => {
      active = false;
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  // 3. Speech Recognition (STT) with Silence Detection
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("Speech recognition not supported in browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      let currentInterim = "";
      let currentFinal = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const part = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          currentFinal += part + " ";
        } else {
          currentInterim += part;
        }
      }

      if (currentFinal) {
        setTranscript((prev) => prev + currentFinal);
        lastSpokeTimeRef.current = Date.now();
      }
      setInterimTranscript(currentInterim);
      setAiStatus("listening");

      // Auto-detect when candidate stops speaking (Immediate response trigger: ~1.4s silence)
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        const fullAnswer = (transcriptRef.current + " " + currentInterim).trim();
        // If candidate spoke substantial answer (>= 5 words) and stopped speaking, auto-submit immediately
        if (fullAnswer.split(/\s+/).length >= 5 && !isSubmittingRef.current) {
          console.log("Candidate silence detected: submitting answer immediately without delay.");
          handleImmediateSubmit(fullAnswer);
        }
      }, 1400);
    };

    recognition.onerror = (event: any) => {
      if (event.error !== "no-speech") {
        console.warn("STT error:", event.error);
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      try {
        recognition.abort();
      } catch {}
    };
  }, []);

  function startListening() {
    if (!recognitionRef.current) return;
    try {
      setTranscript("");
      setInterimTranscript("");
      recognitionRef.current.start();
      setIsListening(true);
      setAiStatus("listening");
    } catch (e) {
      console.warn("Recognition already started or error:", e);
    }
  }

  function stopListening() {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
      setIsListening(false);
    } catch (e) {}
  }

  // 4. Text to Speech (TTS)
  function speakAiResponse(textToSpeak: string) {
    if (!ttsEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.rate = 1.05;

      const voices = window.speechSynthesis.getVoices();
      const natural = voices.find(
        (v) => v.lang.startsWith("en") && (v.name.includes("Natural") || v.name.includes("Google") || v.name.includes("Samantha"))
      ) || voices.find((v) => v.lang.startsWith("en"));
      if (natural) utterance.voice = natural;

      utterance.onstart = () => {
        setIsAiSpeaking(true);
        setAiStatus("speaking");
      };

      utterance.onend = () => {
        setIsAiSpeaking(false);
        setAiStatus("idle");
        // As soon as AI finishes speaking question, start listening to candidate!
        startListening();
      };

      utterance.onerror = () => {
        setIsAiSpeaking(false);
        setAiStatus("idle");
        startListening();
      };

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("TTS error:", e);
      startListening();
    }
  }

  // 5. Submit candidate answer immediately without delay
  async function handleImmediateSubmit(answerToSubmit?: string) {
    const finalAnswer = (answerToSubmit || (inputMode === "text" ? manualAnswer : transcript)).trim();
    if (!finalAnswer || !session || !currentQuestionId || isSubmittingRef.current) {
      return;
    }

    isSubmittingRef.current = true;
    stopListening();
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

    setAiStatus("thinking");
    const durationSeconds = Math.round((Date.now() - lastSpokeTimeRef.current) / 1000) || 25;

    try {
      const result = await submitAnswer(session._id, {
        questionId: currentQuestionId,
        answer: finalAnswer,
        audioDurationSeconds: durationSeconds,
      });

      // Update session object in real time
      setSession(result.data.session);
      setTranscript("");
      setInterimTranscript("");
      setManualAnswer("");

      if (result.data.isCompleted) {
        // Complete interview
        const completedRes = await completeInterview(session._id);
        if (completedRes?.data) setSession(completedRes.data);
        setAiStatus("idle");
        setIsSessionCompleted(true);
        speakAiResponse("Congratulations! You have completed all questions for this session. Review your evaluation report below.");
      } else {
        const nextQ = result.data.nextQuestion;
        const nextId = result.data.nextQuestionId;
        if (nextQ) {
          setCurrentQuestionText(nextQ);
          if (nextId) setCurrentQuestionId(nextId);
          setCurrentQuestionIndex((prev) => prev + 1);

          // AI immediately speaks the next question aloud using TTS!
          speakAiResponse(nextQ);
        }
      }
    } catch (error) {
      console.error("Failed to submit answer:", error);
      setAiStatus("idle");
    } finally {
      isSubmittingRef.current = false;
    }
  }

  function toggleCamera() {
    const next = !camera;
    streamRef.current?.getVideoTracks().forEach((track) => (track.enabled = next));
    setCamera(next);
  }

  function toggleMic() {
    const next = !mic;
    streamRef.current?.getAudioTracks().forEach((track) => (track.enabled = next));
    setMic(next);
    if (!next) stopListening();
    else startListening();
  }

  async function handleEndInterview() {
    if (session) {
      try {
        const completedRes = await completeInterview(session._id);
        if (completedRes?.data) setSession(completedRes.data);
      } catch {}
      setIsSessionCompleted(true);
    } else {
      navigate("/dashboard");
    }
  }

  return (
    <div className="min-h-screen bg-[#050812] text-slate-100 flex flex-col">
      {/* Header */}
      <header className="flex h-16 items-center justify-between border-b border-white/10 px-6 bg-[#070b14]/90 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
          <div>
            <p className="text-sm font-bold tracking-tight">
              {session?.title || "InterVexa Live Interview"}
            </p>
            <p className="text-xs text-slate-400">
              Role: <strong className="text-cyan">{session?.role || "Software Engineer"}</strong> · Question {currentQuestionIndex + 1} of {totalQuestions}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Real-time Status Badge */}
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs">
            {aiStatus === "listening" && (
              <>
                <span className="h-2 w-2 rounded-full bg-cyan animate-pulse" />
                <span className="text-cyan font-medium">Listening to you...</span>
              </>
            )}
            {aiStatus === "thinking" && (
              <>
                <Activity className="animate-spin text-purple" size={13} />
                <span className="text-purple font-medium">AI Evaluating...</span>
              </>
            )}
            {aiStatus === "speaking" && (
              <>
                <Volume2 className="text-emerald-400 animate-pulse" size={13} />
                <span className="text-emerald-400 font-medium">AI Speaking Question</span>
              </>
            )}
            {aiStatus === "idle" && (
              <>
                <span className="h-2 w-2 rounded-full bg-slate-500" />
                <span className="text-slate-400">Ready</span>
              </>
            )}
          </div>

          <button
            onClick={() => setTtsEnabled(!ttsEnabled)}
            className={`p-2 rounded-xl border border-white/10 ${ttsEnabled ? "bg-cyan/10 text-cyan" : "bg-white/5 text-slate-500"}`}
            title="Toggle AI Voice"
          >
            {ttsEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
        </div>
      </header>

      {/* Main Grid */}
      <main className="flex-1 mx-auto grid max-w-[1600px] w-full gap-5 p-4 lg:grid-cols-[1.65fr_1fr]">
        {/* Main Stage: AI Interviewer & Candidate Webcam Feed */}
        <section className="relative min-h-[72vh] flex flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-card shadow-2xl">
          {/* Top Stage Overlay: Category & Active AI Indicator */}
          <div className="absolute left-6 top-6 z-10 flex items-center gap-2 rounded-xl border border-white/10 bg-black/40 px-3.5 py-2 text-xs backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-white">AI Senior Interviewer (Gemini)</span>
          </div>

          {/* AI Avatar / Waveform Center */}
          <div className="flex-1 grid place-items-center p-8 text-center bg-gradient-to-br from-[#120e26] via-[#091122] to-[#051624]">
            <div className="max-w-2xl">
              {/* Dynamic Animated Avatar / Audio Orb */}
              <div className="relative mx-auto mb-8 grid h-32 w-32 place-items-center rounded-full bg-gradient-to-tr from-purple via-indigo-500 to-cyan shadow-glow">
                {isAiSpeaking ? (
                  <div className="flex items-center gap-1">
                    {[16, 32, 48, 30, 18].map((h, i) => (
                      <span
                        key={i}
                        className="w-1.5 rounded-full bg-white animate-pulse"
                        style={{ height: `${h}px`, animationDuration: "0.5s" }}
                      />
                    ))}
                  </div>
                ) : (
                  <Sparkles size={46} className="text-white" />
                )}
                {/* Glow ring */}
                <div className={`absolute -inset-2 rounded-full border border-cyan/40 ${isAiSpeaking ? "animate-ping opacity-30" : ""}`} />
              </div>

              {/* Spoken Question Text */}
              <h2 className="text-2xl font-bold leading-relaxed text-white">
                {currentQuestionText || "Preparing your custom interview syllabus..."}
              </h2>

              <p className="mt-3 text-xs uppercase tracking-wider text-slate-400">
                {aiStatus === "listening"
                  ? "Speak your answer. When you pause speaking, InterVexa automatically processes your response."
                  : aiStatus === "speaking"
                  ? "Listening to question... Speak once AI finishes."
                  : "Click Submit or pause speaking when finished."}
              </p>
            </div>
          </div>

          {/* Candidate Floating Webcam Preview Box */}
          <div className="absolute bottom-24 right-6 h-44 w-60 overflow-hidden rounded-2xl border-2 border-white/20 bg-black shadow-2xl z-20">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className={`h-full w-full object-cover ${camera ? "" : "hidden"}`}
            />
            {!camera && (
              <div className="grid h-full place-items-center text-slate-500 bg-[#0d1422]">
                <CameraOff size={28} />
              </div>
            )}
            <div className="absolute bottom-2 left-2 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-medium backdrop-blur">
              You {mic ? "(Mic on)" : "(Muted)"}
            </div>
          </div>

          {/* Controls Bar */}
          <div className="border-t border-white/10 bg-[#070b14]/80 p-4 backdrop-blur-md flex items-center justify-between z-20">
            <div className="flex items-center gap-2">
              <button
                onClick={toggleMic}
                className={`grid h-11 w-11 place-items-center rounded-xl transition ${
                  mic ? "bg-white/10 hover:bg-white/15 text-white" : "bg-red-500/20 text-red-400"
                }`}
                title="Toggle Mic"
              >
                {mic ? <Mic size={18} /> : <MicOff size={18} />}
              </button>

              <button
                onClick={toggleCamera}
                className={`grid h-11 w-11 place-items-center rounded-xl transition ${
                  camera ? "bg-white/10 hover:bg-white/15 text-white" : "bg-red-500/20 text-red-400"
                }`}
                title="Toggle Camera"
              >
                {camera ? <Camera size={18} /> : <CameraOff size={18} />}
              </button>

              <button
                onClick={() => speakAiResponse(currentQuestionText)}
                className="grid h-11 w-11 place-items-center rounded-xl bg-white/10 hover:bg-white/15 text-cyan"
                title="Replay Question Voice"
              >
                <Volume2 size={18} />
              </button>
            </div>

            {/* Instant Manual Submit Button */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleImmediateSubmit()}
                disabled={aiStatus === "thinking" || (!transcript.trim() && !interimTranscript.trim())}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple to-cyan px-5 py-2.5 text-sm font-semibold shadow-glow disabled:opacity-40"
              >
                {aiStatus === "thinking" ? (
                  <>
                    <Activity className="animate-spin" size={16} /> Processing...
                  </>
                ) : (
                  <>
                    <Send size={15} /> Submit Answer
                  </>
                )}
              </button>

              <button
                onClick={handleEndInterview}
                className="grid h-11 w-11 place-items-center rounded-xl bg-red-600 hover:bg-red-700 text-white"
                title="End Interview"
              >
                <PhoneOff size={18} />
              </button>
            </div>
          </div>
        </section>

        {/* Right Sidebar: Real-time Transcript & Live Scorecard */}
        <aside className="flex min-h-[72vh] flex-col rounded-3xl border border-white/10 bg-card overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="border-b border-white/10 p-5 bg-surface/50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan">
                Live Session Object
              </span>
              <span className="text-xs text-slate-400">
                Score: <strong className="text-emerald-400 text-sm">{session?.overallScore ? `${session.overallScore}%` : "Evaluating"}</strong>
              </span>
            </div>
            <h3 className="mt-1 font-bold text-base">Real-Time Interview Monitor</h3>
          </div>

          {/* Scrollable Transcript & Questions Body */}
          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            {/* Real-time Listening Badge */}
            <div className="rounded-2xl border border-purple/30 bg-purple/10 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-purple">
                  Candidate Speech (Live STT):
                </span>
                {isListening && (
                  <span className="flex items-center gap-1 text-[11px] text-cyan font-bold">
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan animate-ping" />
                    Recording
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-200 leading-relaxed min-h-[60px]">
                {transcript || interimTranscript || (
                  <span className="text-slate-500 italic">
                    Start speaking your answer. The STT engine transcribes speech with zero delay and auto-submits upon silence.
                  </span>
                )}
                {interimTranscript && (
                  <span className="text-cyan font-medium italic"> {interimTranscript}</span>
                )}
              </p>
            </div>

            {/* Past Evaluated Answers Accordion / Timeline */}
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Session Evaluations ({session?.answeredQuestions || 0} / {totalQuestions})
              </p>

              {session?.questions?.map((q, idx) => {
                const isCurrent = idx === currentQuestionIndex;
                const isEvaluated = Boolean(q.evaluation);

                return (
                  <div
                    key={q.questionId}
                    className={`rounded-2xl border p-4 transition ${
                      isCurrent
                        ? "border-cyan/50 bg-cyan/5 shadow-md"
                        : isEvaluated
                        ? "border-white/10 bg-white/[.02]"
                        : "border-white/5 bg-transparent opacity-60"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-cyan">Question {idx + 1}</span>
                      {isEvaluated && (
                        <span className="rounded-full bg-emerald-400/10 px-2 py-0.5 text-xs font-bold text-emerald-400">
                          {q.evaluation?.score}%
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs font-medium text-slate-200">{q.question}</p>

                    {q.evaluation && (
                      <div className="mt-3 border-t border-white/5 pt-2 text-[11px] text-slate-400">
                        <p className="text-slate-300">
                          <strong className="text-slate-400">Feedback:</strong> {q.evaluation.feedback}
                        </p>
                        <div className="mt-2 flex gap-3 text-[10px]">
                          <span>Clarity: <strong className="text-white">{q.evaluation.clarity}%</strong></span>
                          <span>Relevance: <strong className="text-white">{q.evaluation.relevance}%</strong></span>
                          <span>Structure: <strong className="text-white">{q.evaluation.structure}%</strong></span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer Complete button */}
          <div className="border-t border-white/10 p-4 bg-surface/50">
            <button
              onClick={handleEndInterview}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 py-3 text-sm font-semibold hover:bg-white/15"
            >
              Finish & View Performance Dashboard <ChevronRight size={16} />
            </button>
          </div>
        </aside>
      </main>
    </div>
  );
}
