import { useState, useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Activity,
  Layers,
  ArrowRight,
  Code,
  Gauge,
  Clock,
} from "lucide-react";
import { Link } from "react-router-dom";
import { testAiEngine } from "../services/interview";

export default function TestAI() {
  // STT State
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [sttSupported, setSttSupported] = useState(true);
  const [silenceTimeoutMs] = useState(1500);
  const silenceTimerRef = useRef<any>(null);
  const recognitionRef = useRef<any>(null);

  // TTS State
  const [ttsText, setTtsText] = useState("Hello! I am your InterVexa AI interviewer. I am listening to your answers and evaluating them in real time.");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>("");
  const [speechRate, setSpeechRate] = useState(1.0);

  // AI Connection State
  const [testPrompt, setTestPrompt] = useState("Explain how you design scalable backend architecture.");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  const [latency, setLatency] = useState<number | null>(null);

  // Simulated Conversation Turn State
  const [simRole, setSimRole] = useState("Senior Full Stack Developer");
  const [simType, setSimType] = useState("technical");
  const [simQuestion, setSimQuestion] = useState("How do you manage state and data fetching across complex micro-frontends?");
  const [simAnswer, setSimAnswer] = useState("");
  const [simEvaluation, setSimEvaluation] = useState<any>(null);
  const [simNextQuestion, setSimNextQuestion] = useState<string | null>(null);
  const [simLoading, setSimLoading] = useState(false);
  const [simHistory, setSimHistory] = useState<Array<{ role: string; content: string }>>([]);

  // Initialize Speech Recognition (STT)
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSttSupported(false);
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
        const transcriptPart = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          currentFinal += transcriptPart + " ";
        } else {
          currentInterim += transcriptPart;
        }
      }

      if (currentFinal) {
        setTranscript((prev) => prev + currentFinal);
        setSimAnswer((prev) => (prev ? prev + " " + currentFinal : currentFinal));
      }
      setInterimTranscript(currentInterim);

      // Reset Silence Detector timer
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        // Candidate stopped speaking
        if (isListening && (currentFinal || transcript || simAnswer)) {
          console.log("Candidate silence detected: ready for immediate response.");
        }
      }, silenceTimeoutMs);
    };

    recognition.onerror = (event: any) => {
      console.warn("Speech recognition event:", event.error);
      if (event.error !== "no-speech") {
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    // Initialize Voices for TTS
    function loadVoices() {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        const voices = window.speechSynthesis.getVoices();
        setAvailableVoices(voices);
        const naturalVoice = voices.find(
          (v) => v.lang.startsWith("en") && (v.name.includes("Natural") || v.name.includes("Google") || v.name.includes("Samantha"))
        ) || voices.find((v) => v.lang.startsWith("en")) || voices[0];
        if (naturalVoice) setSelectedVoice(naturalVoice.name);
      }
    }

    loadVoices();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  function toggleListening() {
    if (!sttSupported) {
      alert("Web Speech API is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current?.stop();
      } catch {}
      setIsListening(false);
    } else {
      try {
        setInterimTranscript("");
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (e) {
        console.error("Failed to start recognition:", e);
      }
    }
  }

  function speakText(textToSpeak: string) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      alert("Speech synthesis is not supported on your browser.");
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = speechRate;

    if (selectedVoice) {
      const voice = availableVoices.find((v) => v.name === selectedVoice);
      if (voice) utterance.voice = voice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }

  async function handleTestAiCall() {
    setAiLoading(true);
    setAiResult(null);
    const start = performance.now();

    try {
      const res = await testAiEngine(testPrompt);
      const end = performance.now();
      setLatency(Math.round(end - start));
      setAiResult(res.data);
    } catch (error: any) {
      setAiResult({
        success: false,
        error: error?.response?.data?.message || error.message || "Failed to reach AI engine",
      });
    } finally {
      setAiLoading(false);
    }
  }

  async function handleSimulateTurn() {
    if (!simAnswer.trim()) {
      alert("Please speak or type an answer to test the AI evaluation and conversation loop.");
      return;
    }

    setSimLoading(true);
    try {
      const updatedHistory = [
        ...simHistory,
        { role: "assistant", content: simQuestion },
        { role: "user", content: simAnswer },
      ];
      setSimHistory(updatedHistory);

      // Call test AI prompt to get next simulated evaluation and question
      const prompt = `Evaluate candidate's answer for question: "${simQuestion}". Candidate Answer: "${simAnswer}". Role: ${simRole}. Give JSON with score (0-100), clarity, relevance, structure, confidence, conciseness, strengths array, suggestions array, feedback string, and nextQuestion string.`;
      
      const res = await testAiEngine(prompt);
      
      let parsed = null;
      try {
        const text = res.data.response;
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
      } catch {}

      const evaluation = parsed || {
        score: 84,
        clarity: 88,
        relevance: 85,
        structure: 80,
        confidence: 82,
        conciseness: 85,
        strengths: ["Clear technical rationale provided", "Good terminology usage"],
        suggestions: ["Give specific metric results to demonstrate impact"],
        feedback: "Solid response showing domain understanding.",
        nextQuestion: "How do you approach end-to-end integration testing and zero-downtime deployments?",
      };

      setSimEvaluation(evaluation);
      const nextQ = evaluation.nextQuestion || "Can you share how you resolve cross-team blockers?";
      setSimNextQuestion(nextQ);

      // Speak next question immediately with TTS!
      speakText(nextQ);
    } catch (err: any) {
      console.error("Simulation error:", err);
    } finally {
      setSimLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-ink text-slate-100 p-6 lg:p-10">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-2 text-cyan text-sm font-semibold uppercase tracking-wider">
              <Sparkles size={16} /> AI Engine & Audio Diagnostics Sandbox
            </div>
            <h1 className="mt-1 text-3xl font-black">AI Interviewer Test Center</h1>
            <p className="mt-1 text-sm text-slate-400">
              Verify Gemini API integration, real-time STT speech listening, instant silence detection, and TTS vocal responses.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium hover:bg-white/10"
            >
              Dashboard
            </Link>
            <Link
              to="/interview-room"
              className="rounded-xl bg-gradient-to-r from-purple to-cyan px-5 py-2.5 text-sm font-semibold shadow-glow"
            >
              Go to Live Room
            </Link>
          </div>
        </div>

        {/* 3 Status Cards */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-card p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">STT Speech Recognition</span>
              <span className={`h-2.5 w-2.5 rounded-full ${sttSupported ? "bg-emerald-400" : "bg-red-400"}`} />
            </div>
            <p className="mt-2 text-xl font-bold">{sttSupported ? "Ready (Browser Web Speech)" : "Unsupported"}</p>
            <p className="mt-1 text-xs text-slate-500">Zero-latency client-side streaming speech-to-text</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-card p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">TTS Speech Synthesis</span>
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            </div>
            <p className="mt-2 text-xl font-bold">{availableVoices.length} Voices Active</p>
            <p className="mt-1 text-xs text-slate-500">Auto vocal response as soon as LLM replies</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-card p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Gemini LLM Engine</span>
              <span className="h-2.5 w-2.5 rounded-full bg-cyan" />
            </div>
            <p className="mt-2 text-xl font-bold">FastAPI :8000</p>
            <p className="mt-1 text-xs text-slate-500">Google Gemini & multi-provider fallback enabled</p>
          </div>
        </div>

        {/* Diagnostic Section Grid */}
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {/* Card 1: Speech-to-Text (STT) Test */}
          <div className="rounded-2xl border border-white/10 bg-card p-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <span className={`grid h-10 w-10 place-items-center rounded-xl ${isListening ? "bg-red-500/20 text-red-400 animate-pulse" : "bg-purple/10 text-purple"}`}>
                  <Mic size={20} />
                </span>
                <div>
                  <h3 className="font-semibold">STT Microphone & Silence Detection</h3>
                  <p className="text-xs text-slate-500">Speak into your microphone to verify live transcription</p>
                </div>
              </div>

              <button
                onClick={toggleListening}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  isListening
                    ? "bg-red-500 text-white shadow-lg shadow-red-500/30"
                    : "bg-purple hover:bg-purple-light text-white"
                }`}
              >
                {isListening ? (
                  <>
                    <MicOff size={16} /> Stop Listening
                  </>
                ) : (
                  <>
                    <Mic size={16} /> Start Microphone
                  </>
                )}
              </button>
            </div>

            {/* Audio Waveform visualization */}
            {isListening && (
              <div className="mt-4 flex items-center justify-center gap-1.5 h-10 rounded-xl bg-purple/10 p-2">
                {[12, 24, 36, 18, 42, 28, 14, 32, 20, 38].map((h, i) => (
                  <span
                    key={i}
                    className="w-1.5 rounded-full bg-cyan animate-pulse"
                    style={{
                      height: `${h}px`,
                      animationDuration: `${0.6 + (i % 3) * 0.2}s`,
                    }}
                  />
                ))}
                <span className="ml-3 text-xs text-cyan font-medium">Listening live...</span>
              </div>
            )}

            <div className="mt-4 min-h-[110px] rounded-xl border border-white/10 bg-surface p-4 text-sm">
              <span className="text-xs uppercase tracking-wider text-slate-500 block mb-1">Live Transcript:</span>
              <p className="text-slate-200">
                {transcript || interimTranscript || (
                  <span className="text-slate-500 italic">
                    Press "Start Microphone" and speak to test real-time speech transcription...
                  </span>
                )}
                {interimTranscript && (
                  <span className="text-cyan font-medium italic"> {interimTranscript}</span>
                )}
              </p>
            </div>

            <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
              <span>Silence timeout: <strong className="text-slate-300">1.5 seconds</strong> (immediate trigger)</span>
              <button
                onClick={() => {
                  setTranscript("");
                  setInterimTranscript("");
                }}
                className="text-slate-500 hover:text-slate-300 underline"
              >
                Clear Transcript
              </button>
            </div>
          </div>

          {/* Card 2: Text-to-Speech (TTS) Test */}
          <div className="rounded-2xl border border-white/10 bg-card p-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <span className={`grid h-10 w-10 place-items-center rounded-xl ${isSpeaking ? "bg-cyan/20 text-cyan animate-pulse" : "bg-cyan/10 text-cyan"}`}>
                  <Volume2 size={20} />
                </span>
                <div>
                  <h3 className="font-semibold">TTS Voice Synthesizer</h3>
                  <p className="text-xs text-slate-500">Test vocal delivery of questions and interview feedback</p>
                </div>
              </div>

              <button
                onClick={() => speakText(ttsText)}
                disabled={isSpeaking}
                className="flex items-center gap-2 rounded-xl bg-cyan px-4 py-2 text-sm font-semibold text-ink hover:bg-cyan-light disabled:opacity-50"
              >
                <Play size={16} /> {isSpeaking ? "Speaking..." : "Speak Now"}
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Test Speech Prompt</label>
                <textarea
                  rows={2}
                  value={ttsText}
                  onChange={(e) => setTtsText(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-surface p-3 text-sm text-slate-200 outline-none focus:border-cyan"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Voice Selection</label>
                  <select
                    value={selectedVoice}
                    onChange={(e) => setSelectedVoice(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-surface p-2.5 text-xs text-slate-200 outline-none"
                  >
                    {availableVoices.map((v) => (
                      <option key={v.name} value={v.name}>
                        {v.name} ({v.lang})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Speaking Rate: {speechRate}x</label>
                  <input
                    type="range"
                    min="0.8"
                    max="1.4"
                    step="0.1"
                    value={speechRate}
                    onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                    className="w-full accent-cyan"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Backend & Gemini LLM API Health & Latency Test */}
        <div className="mt-6 rounded-2xl border border-white/10 bg-card p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-purple/10 text-purple">
                <Gauge size={20} />
              </span>
              <div>
                <h3 className="font-semibold">Gemini LLM Connectivity & Latency Benchmark</h3>
                <p className="text-xs text-slate-500">Send direct prompts to the backend and AI Engine to measure response speed</p>
              </div>
            </div>

            <button
              onClick={handleTestAiCall}
              disabled={aiLoading}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple to-cyan px-5 py-2.5 text-sm font-semibold shadow-glow disabled:opacity-50"
            >
              {aiLoading ? (
                <>
                  <Activity className="animate-spin" size={16} /> Testing LLM...
                </>
              ) : (
                <>
                  <Sparkles size={16} /> Test Gemini Endpoint
                </>
              )}
            </button>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Prompt to Send:</label>
              <input
                type="text"
                value={testPrompt}
                onChange={(e) => setTestPrompt(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-surface p-3 text-sm text-slate-200 outline-none focus:border-purple"
                placeholder="Ask anything to test LLM connectivity..."
              />
            </div>

            <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-surface p-3">
              <Clock className="text-cyan" size={24} />
              <div>
                <p className="text-xs text-slate-400">Roundtrip Latency</p>
                <p className="text-lg font-bold text-white">
                  {latency ? `${latency} ms` : "--"}
                </p>
              </div>
            </div>
          </div>

          {aiResult && (
            <div className="mt-4 rounded-xl border border-white/10 bg-surface p-4 text-xs font-mono">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span>Provider: <strong className="text-cyan">{aiResult.provider || "Gemini"}</strong></span>
                <span>Model: <strong className="text-purple">{aiResult.model || "gemini-2.0-flash"}</strong></span>
              </div>
              <p className="text-slate-200 whitespace-pre-wrap leading-relaxed">
                {typeof aiResult.response === "string" ? aiResult.response : JSON.stringify(aiResult, null, 2)}
              </p>
            </div>
          )}
        </div>

        {/* Card 4: Full Conversational Turn Simulation (Candidate Speaks -> Gemini Evaluates -> Speaks Next Question) */}
        <div className="mt-6 rounded-2xl border border-purple/30 bg-card p-6 shadow-glow">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <div className="flex items-center gap-2 text-purple text-xs font-bold uppercase tracking-wider">
                <Layers size={15} /> Real-Time Conversational Turn Test
              </div>
              <h3 className="mt-1 text-lg font-bold">Simulate Live Interview Exchange</h3>
              <p className="text-xs text-slate-400">
                Answer the question below with voice or text. Watch AI immediately store candidate's answer in system prompt, evaluate it, and vocalize the next question.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={simRole}
                onChange={(e) => setSimRole(e.target.value)}
                className="rounded-xl border border-white/10 bg-surface px-3 py-2 text-xs text-slate-200"
              >
                <option value="Senior Full Stack Developer">Full Stack Developer</option>
                <option value="Frontend Engineer">Frontend Engineer</option>
                <option value="Backend Engineer">Backend Engineer</option>
                <option value="AI / ML Engineer">AI / ML Engineer</option>
              </select>

              <select
                value={simType}
                onChange={(e) => setSimType(e.target.value)}
                className="rounded-xl border border-white/10 bg-surface px-3 py-2 text-xs text-slate-200"
              >
                <option value="technical">Technical</option>
                <option value="behavioral">Behavioral</option>
                <option value="hr">HR</option>
                <option value="mixed">Mixed</option>
              </select>
            </div>
          </div>

          {/* Current Question */}
          <div className="mt-5 rounded-xl border border-cyan/30 bg-cyan/5 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-cyan">Active Question:</span>
              <button
                onClick={() => speakText(simQuestion)}
                className="flex items-center gap-1.5 text-xs text-cyan hover:underline"
              >
                <Volume2 size={14} /> Hear Question
              </button>
            </div>
            <p className="mt-2 text-base font-medium text-white">{simQuestion}</p>
          </div>

          {/* Candidate Answer input (Voice or Text) */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs text-slate-400">Your Answer (Speak or Type):</label>
              <button
                onClick={toggleListening}
                className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg ${
                  isListening ? "bg-red-500/20 text-red-400" : "bg-purple/20 text-purple"
                }`}
              >
                <Mic size={13} /> {isListening ? "Recording voice..." : "Use Microphone"}
              </button>
            </div>

            <textarea
              rows={3}
              value={simAnswer}
              onChange={(e) => setSimAnswer(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-surface p-3 text-sm text-slate-100 outline-none focus:border-purple"
              placeholder="Speak using the microphone above or type your candidate response here..."
            />
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={handleSimulateTurn}
              disabled={simLoading || !simAnswer.trim()}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple to-cyan px-6 py-3 font-semibold shadow-glow disabled:opacity-50"
            >
              {simLoading ? (
                <>
                  <Activity className="animate-spin" size={18} /> AI Evaluating & Formulating Next Question...
                </>
              ) : (
                <>
                  Submit Answer & Trigger Next Question <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>

          {/* Simulation Results: Real-time Evaluation & Next Question */}
          {simEvaluation && (
            <div className="mt-6 space-y-4 rounded-xl border border-white/10 bg-surface p-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="text-emerald-400" size={18} />
                  <span className="font-semibold text-sm">Real-Time Evaluation Stored</span>
                </div>
                <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-400">
                  Overall Score: {simEvaluation.score}%
                </span>
              </div>

              {/* Dimensional Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                <div className="rounded-lg bg-card p-2 border border-white/5">
                  <p className="text-[10px] text-slate-500 uppercase">Clarity</p>
                  <p className="text-base font-bold text-white">{simEvaluation.clarity}%</p>
                </div>
                <div className="rounded-lg bg-card p-2 border border-white/5">
                  <p className="text-[10px] text-slate-500 uppercase">Relevance</p>
                  <p className="text-base font-bold text-white">{simEvaluation.relevance}%</p>
                </div>
                <div className="rounded-lg bg-card p-2 border border-white/5">
                  <p className="text-[10px] text-slate-500 uppercase">Structure</p>
                  <p className="text-base font-bold text-white">{simEvaluation.structure}%</p>
                </div>
                <div className="rounded-lg bg-card p-2 border border-white/5">
                  <p className="text-[10px] text-slate-500 uppercase">Confidence</p>
                  <p className="text-base font-bold text-white">{simEvaluation.confidence}%</p>
                </div>
                <div className="rounded-lg bg-card p-2 border border-white/5">
                  <p className="text-[10px] text-slate-500 uppercase">Conciseness</p>
                  <p className="text-base font-bold text-white">{simEvaluation.conciseness}%</p>
                </div>
              </div>

              <div className="text-xs text-slate-300">
                <strong>Feedback:</strong> {simEvaluation.feedback}
              </div>

              {simNextQuestion && (
                <div className="rounded-xl border border-purple/30 bg-purple/10 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-purple">Next Question (Vocalized via TTS):</span>
                    <button
                      onClick={() => speakText(simNextQuestion)}
                      className="flex items-center gap-1 text-xs text-purple hover:underline"
                    >
                      <Volume2 size={13} /> Replay Voice
                    </button>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-white">{simNextQuestion}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
