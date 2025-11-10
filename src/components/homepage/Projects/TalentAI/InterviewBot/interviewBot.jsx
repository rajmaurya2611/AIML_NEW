import { useState, useEffect, useRef, useMemo } from "react";
import { flushSync } from "react-dom";
import { useParams } from "react-router-dom";
import "./interviewBot.css";
import CameraRecorder from "./cameraRecorder.jsx";
import mothersonLogo from "../assets_talentAI/motherson_logo.svg";
import ThankYouPage from "./thankYouPage.jsx";
import axios from "axios";
import * as SpeechSDK from "microsoft-cognitiveservices-speech-sdk";
import AvatarPanel from "./AvatarPanel";
import InterviewInstruction from "./interviewInstruction.jsx";

const PHASE = Object.freeze({
  IDLE: "IDLE",
  LISTENING: "LISTENING",
  THINKING: "THINKING",
  BOT_SPEAKING: "BOT_SPEAKING",
  BARGE_IN: "BARGE_IN",
});

// ---------- QUICK BARGE SETTINGS ----------
const QUICK_BARGE = {
  ENABLED: true,
  MIN_WORDS: 1,
  COOLDOWN_MS: 250,
  MICRO_HOLD_MS: 120,
};

// ---------- Aggregation timing ----------
const AGGREGATION = {
  FLUSH_DEBOUNCE_MS: 600,
  FAST_FLUSH_MS: 40,
};

// ---------- CONTROL WORDS (instant interrupt) ----------
const CONTROL_WORDS = /\b(stop|wait|hold on|pause|please stop|can you stop|one sec|one second)\b/i;

// ---------- Post-barge partial suppression ----------
const POST_BARGE_IGNORE_MS = 1200; // ignore STT partials briefly after an interrupt

// ------- DIAGNOSTICS -------
const DEBUG = true;
function dbg(tag, info = {}) {
  if (!DEBUG) return;
  const ts = new Date().toISOString();
  try { console.log(`[IB ${ts}] ${tag}`, info); }
  catch { console.log(`[IB ${ts}] ${tag}`, String(info)); }
}

const BARGE_AVATAR_ONLY = true;

export default function InterviewBot() {
  const { uuid } = useParams();
  const avatarRef = useRef(null);

  const API_BASE = import.meta.env.VITE_TALENTAI_API_INTERVIEW_BASE_URL;

  const [loading, setLoading] = useState(false);
  const [cvText, setCvText] = useState("");
  const [jdText, setJdText] = useState("");

  const [interviewStarted, setInterviewStarted] = useState(false);
  const [history, setHistory] = useState([]); // [{role, content}]
  const historyRef = useRef(history);

  const [timeLeft, setTimeLeft] = useState(1800);
  const timerRef = useRef(null);

  // STT
  const recognizerRef = useRef(null);
  const lastFinalRef = useRef(""); // last sent FULL utterance

  // Conversation phase UI
  const [phase, setPhase] = useState(PHASE.IDLE);
  const [bargeFlash, setBargeFlash] = useState(false);

  // Keep current phase available in SDK callbacks
  const phaseRef = useRef(PHASE.IDLE);
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  // Speaking / interruption
  const isBotSpeakingRef = useRef(false);   // bot speaking (avatar or TTS)
  const avatarSpeakingRef = useRef(false);  // avatar speaking
  const interruptionInProgressRef = useRef(false);
  const lastInterruptAtRef = useRef(0);
  const lastBargeAtRef = useRef(0);         // for post-barge suppression

  // Speech session tokens (avoid race)
  const speakSessionIdRef = useRef(0);

  // Discard-on-barge guard
  const discardCurrentUtteranceRef = useRef(false);
  const discardSafetyTimerRef = useRef(null);

  // Fallback TTS
  const synthesizerRef = useRef(null);

  // Abortable LLM
  const inflightAbortRef = useRef(null);

  // First-message avatar-only control
  const firstPendingRef = useRef("");
  const firstSpokenRef = useRef(false);

  // End-page state
  const [record, setRecord] = useState(false);
  const [interviewStatus, setInterviewStatus] = useState(false);
  const [showPopup, setShowPopup] = useState(true);

  // Utterance aggregation buffer
  const utteranceBufRef = useRef("");
  const flushTimerRef = useRef(null);

  // QUICK BARGE helpers
  const microHoldTimerRef  = useRef(null);
  const lastPartialAtRef   = useRef(0);

  useEffect(() => { historyRef.current = history; }, [history]);

  function markSpeaking(on) {
    isBotSpeakingRef.current = !!on;
    setPhase((prev) => (on ? PHASE.BOT_SPEAKING : (prev === PHASE.THINKING ? PHASE.THINKING : PHASE.LISTENING)));
  }

  function speakBot(text) {
    if (!text) return;
    flushSync(() => {
      isBotSpeakingRef.current = true;
      setPhase(PHASE.BOT_SPEAKING);
    });
    dbg("speakBot.start", { len: text.length });

    if (avatarRef.current?.isConnected?.() && avatarRef.current?.speak) {
      try {
        avatarRef.current.speak(text);
        return;
      } catch (e) {
        console.warn("Avatar speak failed, falling back to TTS:", e);
      }
    }

    if (synthesizerRef.current) {
      try {
        synthesizerRef.current.speakTextAsync(
          text,
          () => { dbg("tts.end"); markSpeaking(false); },
          (err) => { console.error("Fallback TTS failed:", err); markSpeaking(false); }
        );
      } catch (e) {
        console.error("TTS error:", e);
        markSpeaking(false);
      }
    } else {
      markSpeaking(false);
    }
  }

  // best-effort stop with timeout; always flip flags immediately
  async function interruptBotNow() {
    dbg("interruptBotNow.begin", { isBotSpeaking: isBotSpeakingRef.current, avatarSpeaking: avatarSpeakingRef.current });

    // Flip flags immediately to gate recognizing
    isBotSpeakingRef.current = false;
    avatarSpeakingRef.current = false;

    // Try to stop avatar speech, but don't hang
    try {
      const stopP = avatarRef.current?.stopSpeaking?.();
      if (stopP && typeof stopP.then === "function") {
        await Promise.race([
          stopP,
          new Promise((resolve) => setTimeout(resolve, 300)) // 300ms timeout
        ]);
      }
    } catch {}

    // Stop TTS best-effort (non-blocking)
    try { synthesizerRef.current?.stopSpeakingAsync?.(() => {}, () => {}); } catch {}

    // Abort any inflight LLM stream
    try { inflightAbortRef.current?.abort?.(); } catch {}
    inflightAbortRef.current = null;

    dbg("interruptBotNow.done");
  }

  function cancelInFlightLLM() {
    try { inflightAbortRef.current?.abort?.(); } catch {}
    inflightAbortRef.current = null;
  }

  // ---- STT config helper ----
  function createSpeechConfig(key, region) {
    const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(key, region);
    speechConfig.speechRecognitionLanguage = "en-IN";

    // Better punctuation/casing
    speechConfig.setProperty(
      SpeechSDK.PropertyId.SpeechServiceResponse_PostProcessingOption,
      "TrueText"
    );

    // Allow a bit more silence to finalize a single utterance
    speechConfig.setProperty(
      SpeechSDK.PropertyId.SpeechServiceConnection_EndSilenceTimeoutMs,
      "2500"
    );

    // Reduce mid-utterance splits by tolerating short pauses
    speechConfig.setProperty(
      SpeechSDK.PropertyId.Speech_SegmentationSilenceTimeoutMs,
      "2000"
    );

    // Optional: if first words get clipped, increase initial silence
    speechConfig.setProperty(
      SpeechSDK.PropertyId.SpeechServiceConnection_InitialSilenceTimeoutMs,
      "6000"
    );

    return speechConfig;
  }

  // ---- aggregation helpers ----
  function appendFinalChunk(chunk) {
    const prev = utteranceBufRef.current;
    if (!prev) { utteranceBufRef.current = chunk; return; }

    const tail = prev.slice(-40);
    if (chunk === prev) return;
    if (prev.endsWith(chunk)) return;
    if (chunk.startsWith(tail)) {
      utteranceBufRef.current = (prev + chunk.slice(tail.length)).trim();
    } else {
      utteranceBufRef.current = (prev + " " + chunk).trim();
    }
  }

  function scheduleFlushToBackend(delayMs = AGGREGATION.FLUSH_DEBOUNCE_MS) {
    if (flushTimerRef.current) window.clearTimeout(flushTimerRef.current);
    flushTimerRef.current = window.setTimeout(async () => {
      const finalUtterance = (utteranceBufRef.current || "").trim();
      if (!finalUtterance) { dbg("flush.skip.empty"); return; }

      // reset buffer before network
      utteranceBufRef.current = "";
      lastFinalRef.current = finalUtterance;

      setHistory((h) => [...h, { role: "user", content: finalUtterance }]);
      dbg("flush.send", { text: finalUtterance });

      flushSync(() => setPhase(PHASE.THINKING));

      try {
        cancelInFlightLLM();
        const ctrl = new AbortController();
        inflightAbortRef.current = ctrl;

        const { data: newHist } = await axios.post(
          `${API_BASE}/api/chat`,
          {
            messages: [...historyRef.current, { role: "user", content: finalUtterance }],
            userText: finalUtterance,
          },
          { signal: ctrl.signal }
        );

        inflightAbortRef.current = null;
        setHistory(newHist);
        const reply = newHist.slice(-1)?.[0]?.content || "";
        dbg("flush.recv", { ok: !!reply, len: reply?.length ?? 0 });
        reply ? speakBot(reply) : flushSync(() => setPhase(PHASE.LISTENING));
      } catch (err) {
        const canceled = err?.name === "CanceledError" || err?.name === "AbortError" || axios.isCancel?.(err);
        dbg("flush.err", { canceled, err: String(err) });
        if (!canceled) {
          console.error("LLM error:", err);
          flushSync(() => setPhase(PHASE.LISTENING));
        }
        inflightAbortRef.current = null;
      }
    }, delayMs);
  }

  function startSTT() {
    const key = import.meta.env.VITE_AZURE_SPEECH_KEY;
    const region = import.meta.env.VITE_AZURE_SPEECH_REGION;
    if (!key || !region) {
      console.warn("Missing VITE_AZURE_SPEECH_KEY/REGION; STT disabled.");
      return;
    }

    const speechConfig = createSpeechConfig(key, region);
    const audioCfg = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
    const recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioCfg);
    recognizerRef.current = recognizer;

    flushSync(() => setPhase(PHASE.LISTENING));

    // ----------- STRICT AVATAR-ONLY, SESSION-SAFE BARGE-IN -----------
    recognizer.recognizing = async (_, e) => {
      const partial = (e?.result?.text || "").trim();
      if (!partial) return;

      const curPhase = phaseRef.current;

      // post-barge suppression: ignore tail partials
      if (Date.now() - lastBargeAtRef.current < POST_BARGE_IGNORE_MS) {
        dbg("recognizing.partial", { partial, note: "post-barge-ignore", curPhase, avatarSpeaking: avatarSpeakingRef.current, isBotSpeaking: isBotSpeakingRef.current });
        return;
      }

      if (curPhase !== PHASE.LISTENING && curPhase !== PHASE.BOT_SPEAKING) {
        flushSync(() => setPhase(PHASE.LISTENING));
      }

      lastPartialAtRef.current = Date.now();

      const eligible =
        (!BARGE_AVATAR_ONLY || avatarSpeakingRef.current) &&
        avatarSpeakingRef.current &&
        isBotSpeakingRef.current &&
        !interruptionInProgressRef.current;

      if (!eligible) {
        dbg("recognizing.partial", {
          partial, note: "no-barge",
          curPhase,
          avatarSpeaking: avatarSpeakingRef.current,
          isBotSpeaking: isBotSpeakingRef.current,
          interruptionInProgress: interruptionInProgressRef.current
        });
        return;
      }

      // Control-word instant interrupt
      if (CONTROL_WORDS.test(partial)) {
        interruptionInProgressRef.current = true;
        lastInterruptAtRef.current = Date.now();
        lastBargeAtRef.current = Date.now();

        discardCurrentUtteranceRef.current = true;
        utteranceBufRef.current = "";
        if (flushTimerRef.current) { clearTimeout(flushTimerRef.current); flushTimerRef.current = null; }

        if (discardSafetyTimerRef.current) clearTimeout(discardSafetyTimerRef.current);
        discardSafetyTimerRef.current = setTimeout(() => {
          dbg("discard.safetyTimeout.reset");
          discardCurrentUtteranceRef.current = false;
        }, 4000);

        flushSync(() => { setPhase(PHASE.BARGE_IN); setBargeFlash(true); });
        setTimeout(() => setBargeFlash(false), 300);

        dbg("barge.trigger.control", { partial });
        await interruptBotNow();
        flushSync(() => setPhase(PHASE.LISTENING));
        interruptionInProgressRef.current = false;
        return;
      }

      // Quick-barge on first word
      const wordCount = partial.split(/\s+/).filter(Boolean).length;
      const now = Date.now();
      if (now - (lastInterruptAtRef.current || 0) < QUICK_BARGE.COOLDOWN_MS) return;

      const mySession = speakSessionIdRef.current;

      if (microHoldTimerRef.current) {
        clearTimeout(microHoldTimerRef.current);
        microHoldTimerRef.current = null;
      }

      microHoldTimerRef.current = setTimeout(async () => {
        if (!avatarSpeakingRef.current || speakSessionIdRef.current !== mySession) {
          dbg("barge.skipped", { reason: "session-changed-or-avatar-stopped", mySession, currentSession: speakSessionIdRef.current });
          return;
        }
        if (interruptionInProgressRef.current) return;

        if (wordCount >= QUICK_BARGE.MIN_WORDS) {
          interruptionInProgressRef.current = true;
          lastInterruptAtRef.current = Date.now();
          lastBargeAtRef.current = Date.now();

          discardCurrentUtteranceRef.current = true;
          utteranceBufRef.current = "";
          if (flushTimerRef.current) { clearTimeout(flushTimerRef.current); flushTimerRef.current = null; }

          if (discardSafetyTimerRef.current) clearTimeout(discardSafetyTimerRef.current);
          discardSafetyTimerRef.current = setTimeout(() => {
            dbg("discard.safetyTimeout.reset");
            discardCurrentUtteranceRef.current = false;
          }, 4000);

          flushSync(() => { setPhase(PHASE.BARGE_IN); setBargeFlash(true); });
          setTimeout(() => setBargeFlash(false), 300);

          dbg("barge.trigger.quick", { partial, mySession });
          await interruptBotNow();
          flushSync(() => setPhase(PHASE.LISTENING));
          interruptionInProgressRef.current = false;
        }
      }, QUICK_BARGE.MICRO_HOLD_MS);
    };

    // FINALS
    recognizer.recognized = async (_, e) => {
      if (e.result.reason !== SpeechSDK.ResultReason.RecognizedSpeech) return;
      const chunk = (e.result.text || "").trim();
      interruptionInProgressRef.current = false;

      if (discardCurrentUtteranceRef.current) {
        dbg("recognized.drop", { chunk });
        return;
      }

      if (!chunk) { flushSync(() => setPhase(PHASE.LISTENING)); return; }

      appendFinalChunk(chunk);
      dbg("recognized.append", { chunk, bufferLen: utteranceBufRef.current.length });
      scheduleFlushToBackend(AGGREGATION.FLUSH_DEBOUNCE_MS);
    };

    // Speech end: reset discard flag OR fast-flush
    recognizer.speechEndDetected = () => {
      dbg("speechEndDetected", { discarding: discardCurrentUtteranceRef.current });

      if (discardCurrentUtteranceRef.current) {
        discardCurrentUtteranceRef.current = false;
        utteranceBufRef.current = "";
        if (flushTimerRef.current) { clearTimeout(flushTimerRef.current); flushTimerRef.current = null; }
        if (discardSafetyTimerRef.current) { clearTimeout(discardSafetyTimerRef.current); discardSafetyTimerRef.current = null; }
        dbg("discard.reset.onSpeechEnd");
        return; // do not flush anything from barged utterance
      }

      if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
      dbg("flush.fast");
      scheduleFlushToBackend(AGGREGATION.FAST_FLUSH_MS);
    };

    // Resilience
    recognizer.canceled = (_, e) => {
      dbg("stt.canceled", { err: e?.errorDetails });
      discardCurrentUtteranceRef.current = false;
      if (discardSafetyTimerRef.current) { clearTimeout(discardSafetyTimerRef.current); discardSafetyTimerRef.current = null; }
      interruptionInProgressRef.current = false;
      recognizer.stopContinuousRecognitionAsync(
        () => recognizer.startContinuousRecognitionAsync(() => {}, console.error),
        console.error
      );
      flushSync(() => setPhase(PHASE.LISTENING));
    };

    recognizer.sessionStopped = () => {
      dbg("stt.sessionStopped");
      discardCurrentUtteranceRef.current = false;
      if (discardSafetyTimerRef.current) { clearTimeout(discardSafetyTimerRef.current); discardSafetyTimerRef.current = null; }
      interruptionInProgressRef.current = false;
      recognizer.stopContinuousRecognitionAsync(
        () => recognizer.startContinuousRecognitionAsync(() => {}, console.error),
        console.error
      );
      flushSync(() => setPhase(PHASE.LISTENING));
    };

    recognizer.startContinuousRecognitionAsync(
      () => console.log("STT started"),
      (err) => console.error("STT error", err)
    );
  }

  async function speakFirstWithAvatar(text) {
    if (!text) { startSTT(); return; }
    firstPendingRef.current = text;

    const trySpeak = () => {
      if (avatarRef.current?.isConnected?.() && avatarRef.current?.speak) {
        const id = ++speakSessionIdRef.current;
        avatarSpeakingRef.current = true;
        isBotSpeakingRef.current = true;
        dbg("avatar.firstSpeak.try", { speakSessionId: id });
        flushSync(() => { setPhase(PHASE.BOT_SPEAKING); });
        avatarRef.current.speak(firstPendingRef.current);
        firstSpokenRef.current = true;
        firstPendingRef.current = "";
        setTimeout(() => startSTT(), 50);
        return true;
      }
      return false;
    };

    if (trySpeak()) return;

    let attempts = 0;
    const maxAttempts = 40; // ~8s
    const id = setInterval(() => {
      if (trySpeak() || ++attempts >= maxAttempts) {
        clearInterval(id);
        if (!firstSpokenRef.current) {
          console.warn("Avatar did not connect in time. First message not spoken (avatar-only).");
          startSTT();
        }
      }
    }, 200);
  }

  const startInterview = async () => {
    flushSync(() => setPhase(PHASE.THINKING));
    setLoading(true);
    try {
      const resp = await axios.post(`${API_BASE}/api/hr/get-status-active`, { UID: uuid });
      const { jdText: jdTxt, cvText: cvTxt } = resp.data || {};
      setCvText(cvTxt || "");
      setJdText(jdTxt || "");

      // Prepare fallback TTS
      const key = import.meta.env.VITE_AZURE_SPEECH_KEY;
      const region = import.meta.env.VITE_AZURE_SPEECH_REGION;
      if (key && region) {
        const ttsCfg = SpeechSDK.SpeechConfig.fromSubscription(key, region);
        ttsCfg.speechSynthesisLanguage = "en-IN";
        const ttsAudioCfg = SpeechSDK.AudioConfig.fromDefaultSpeakerOutput();
        synthesizerRef.current = new SpeechSDK.SpeechSynthesizer(ttsCfg, ttsAudioCfg);
      }

      // Get opening line
      const { data } = await axios.post(`${API_BASE}/api/chat`, {
        cv: cvTxt || "",
        jd: jdTxt || "",
        messages: [],
      });

      setHistory(data);
      const first = data.slice(-1)?.[0]?.content || "";

      setInterviewStarted(true);

      try { avatarRef.current?.start?.(); } catch (e) { console.warn("Avatar start error:", e); }
      if (first) speakFirstWithAvatar(first);
      else startSTT();
    } catch (err) {
      console.error("Start error:", err);
      alert("Could not start interview. See console.");
      flushSync(() => setPhase(PHASE.IDLE));
    } finally {
      setTimeout(() => setLoading(false), 6000);
    }
  };

  const handleEndInterview = async () => {
    try {
      recognizerRef.current?.stopContinuousRecognitionAsync(
        () => console.log("STT stopped"),
        (err) => console.error(err)
      );
    } catch {}

    if (flushTimerRef.current) { clearTimeout(flushTimerRef.current); flushTimerRef.current = null; }
    if (discardSafetyTimerRef.current) { clearTimeout(discardSafetyTimerRef.current); discardSafetyTimerRef.current = null; }
    utteranceBufRef.current = "";
    discardCurrentUtteranceRef.current = false;

    clearInterval(timerRef.current);
    await interruptBotNow();
    try { avatarRef.current?.stop?.(); } catch {}

    const name = window.prompt("Please enter your name to save your transcript:");
    if (!name) {
      alert("Name is required to save your transcript.");
      return;
    }
    try {
      await axios.post(`${API_BASE}/api/chat/save`, { name, conversation: history });
    } catch (err) {
      console.error("Save error", err);
      alert("Failed to save transcript & scorecard.");
    }
    setRecord(false);
    flushSync(() => setPhase(PHASE.IDLE));
    setTimeout(() => setInterviewStatus(true), 5000);
  };

  const closePopup = () => {
    setShowPopup(false);
    setRecord(true);
    timerRef.current = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timerRef.current);
          setRecord(false);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    return () => {
      try { recognizerRef.current?.stopContinuousRecognitionAsync(() => {}, () => {}); } catch {}
      try { avatarRef.current?.stop?.(); } catch {}
      try { synthesizerRef.current?.close?.(); } catch {}
      cancelInFlightLLM();
      if (timerRef.current) clearInterval(timerRef.current);
      if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
      if (microHoldTimerRef.current) clearTimeout(microHoldTimerRef.current);
      if (discardSafetyTimerRef.current) clearTimeout(discardSafetyTimerRef.current);
      utteranceBufRef.current = "";
      discardCurrentUtteranceRef.current = false;
      avatarSpeakingRef.current = false;
      isBotSpeakingRef.current = false;
    };
  }, []);

  const handlePreventCopyPaste = (e) => {
    e.preventDefault();
    alert(`🔕Warning, "${e.type}" action is disabled!`);
  };

  const phaseMeta = useMemo(() => {
    switch (phase) {
      case PHASE.BARGE_IN:    return { label: "Barge-in",  bg: "#FFF4E5", fg: "#8A4B00", icon: "⏹️" };
      case PHASE.LISTENING:   return { label: "Listening", bg: "#E6F4EA", fg: "#137333", icon: "🎤" };
      case PHASE.THINKING:    return { label: "Thinking",  bg: "#E8F0FE", fg: "#174EA6", icon: "⌛" };
      case PHASE.BOT_SPEAKING:return { label: "Speaking",  bg: "#FCE8E6", fg: "#B80606", icon: "🔊" };
      default:                return { label: "Idle",      bg: "#F1F3F4", fg: "#3C4043", icon: "⏸️" };
    }
  }, [phase]);

  const StatusPill = () => (
    <div
      style={{
        position: "absolute",
        top: 12, right: 12, zIndex: 10,
        display: "inline-flex", gap: 8, alignItems: "center",
        padding: "6px 10px", borderRadius: 999,
        background: phaseMeta.bg, color: phaseMeta.fg,
        fontSize: 13, fontWeight: 600,
        boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
        transform: bargeFlash ? "scale(1.06)" : "scale(1.0)",
        transition: "transform 120ms ease",
      }}
      aria-live="polite"
    >
      <span>{phaseMeta.icon}</span>
      <span>{phaseMeta.label}</span>
      {phase === PHASE.THINKING && (
        <span className="spinner" style={{
          width: 12, height: 12, borderRadius: "50%",
          border: "2px solid rgba(0,0,0,0.15)",
          borderTopColor: phaseMeta.fg,
          display: "inline-block",
          animation: "spin 0.9s linear infinite"
        }}/>
      )}
      {phase === PHASE.LISTENING && (
        <span className="pulse" style={{
          width: 10, height: 10, borderRadius: "50%",
          background: phaseMeta.fg, opacity: 0.9,
          boxShadow: "0 0 0 0 rgba(19,115,51,0.7)",
          animation: "pulse 1.4s infinite"
        }}/>
      )}
    </div>
  );

  return (
    <main
      onPaste={handlePreventCopyPaste}
      onCut={handlePreventCopyPaste}
      style={{ height: "100vh", display: "flex", flexDirection: "column", position: "relative" }}
    >
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(19,115,51,0.7); }
          70% { box-shadow: 0 0 0 8px rgba(19,115,51,0); }
          100% { box-shadow: 0 0 0 0 rgba(19,115,51,0); }
        }
      `}</style>

      {loading && (
        <div className="loading-overlay"><div className="loading-spinner" /></div>
      )}

      {/* Header */}
      <div className="mainHeader" style={{ flex: "0 0 auto", position: "relative" }}>
        <img className="mothersonLogo" src={mothersonLogo} alt="mothersonLogo" />
        <div className="vertical-line"></div>
        <h3 className="appName">Talent AI</h3>
        <StatusPill />
      </div>

      {interviewStatus && <ThankYouPage />}

      {!interviewStatus && (
        <>
          {showPopup && !interviewStarted && (
            <InterviewInstruction
              recordStatus={record}
              closePopup={closePopup}
              setShowPopup={setShowPopup}
            />
          )}

          {/* 2/3 : 1/3 split */}
          <div
            style={{
              flex: "1 1 auto",
              display: "flex",
              gap: 12,
              background: "white",
              padding: 12,
              position: "relative",
            }}
          >
            {/* Left: Avatar 2/3 */}
            <div style={{ flex: 2, minWidth: 0, position: "relative" }}>
              <AvatarPanel
                ref={avatarRef}
                captionAlign="center"
                captionMaxWidth={900}
                onSpeechStart={() => {
                  isBotSpeakingRef.current = true;
                  avatarSpeakingRef.current = true;
                  const id = ++speakSessionIdRef.current;
                  dbg("avatar.onSpeechStart", { speakSessionId: id });
                  flushSync(() => setPhase(PHASE.BOT_SPEAKING));
                }}
                onSpeechEnd={() => {
                  avatarSpeakingRef.current = false;
                  isBotSpeakingRef.current = false;
                  dbg("avatar.onSpeechEnd", { lastSpeakSessionId: speakSessionIdRef.current });
                  flushSync(() => setPhase(PHASE.LISTENING));
                }}
              />
            </div>

            {/* Right rail 1/3 */}
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
                <div
                  style={{
                    flex: "0 0 auto",
                    background: "white",
                    borderRadius: 8,
                    padding: 8,
                  }}
                >
                  <CameraRecorder
                    setShowPopup={setShowPopup}
                    recordStatus={record}
                    setRecord={setRecord}
                    timerRef={timerRef}
                    startInterview={startInterview}
                  />
                </div>

                <div style={{ flex: 1 }} />

                <button
                  className="interview-bot-end-interview-button"
                  onClick={handleEndInterview}
                  style={{ alignSelf: "stretch" }}
                >
                  End Interview
                </button>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
