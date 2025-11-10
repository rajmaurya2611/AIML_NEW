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
  const lastFinalRef = useRef("");

  // Conversation phase UI
  const [phase, setPhase] = useState(PHASE.IDLE);
  const [bargeFlash, setBargeFlash] = useState(false); // brief “BARGED” flash

  // Speaking / interruption
  const isBotSpeakingRef = useRef(false);
  const interruptionInProgressRef = useRef(false);

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

  useEffect(() => { historyRef.current = history; }, [history]);

  function markSpeaking(on) {
    isBotSpeakingRef.current = !!on;
    // Don’t override THINKING/BARGE_IN here; only flip between Speaking/Listening.
    setPhase(prev => {
      if (on) return PHASE.BOT_SPEAKING;
      // if we just stopped speaking, default to LISTENING unless we’re already THINKING
      return prev === PHASE.THINKING ? PHASE.THINKING : PHASE.LISTENING;
    });
  }

  function speakBot(text) {
    if (!text) return;
    // IMMEDIATE UI flip before any async begins
    flushSync(() => {
      isBotSpeakingRef.current = true;
      setPhase(PHASE.BOT_SPEAKING);
    });

    // Prefer Avatar
    if (avatarRef.current?.isConnected?.() && avatarRef.current?.speak) {
      try {
        avatarRef.current.speak(text);
        return;
      } catch (e) {
        console.warn("Avatar speak failed, falling back to TTS:", e);
      }
    }

    // Fallback TTS
    if (synthesizerRef.current) {
      try {
        synthesizerRef.current.speakTextAsync(
          text,
          () => markSpeaking(false),
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

  async function interruptBotNow() {
    try { await avatarRef.current?.stopSpeaking?.(); } catch {}
    try { synthesizerRef.current?.stopSpeakingAsync?.(() => {}, () => {}); } catch {}
    try { inflightAbortRef.current?.abort?.(); } catch {}
    inflightAbortRef.current = null;
    isBotSpeakingRef.current = false;
    // phase handled by partial handler
  }

  function cancelInFlightLLM() {
    try { inflightAbortRef.current?.abort?.(); } catch {}
    inflightAbortRef.current = null;
  }

  function startSTT() {
    const key = import.meta.env.VITE_AZURE_SPEECH_KEY;
    const region = import.meta.env.VITE_AZURE_SPEECH_REGION;
    if (!key || !region) {
      console.warn("Missing VITE_AZURE_SPEECH_KEY/REGION; STT disabled.");
      return;
    }

    const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(key, region);
    speechConfig.speechRecognitionLanguage = "en-IN";
    // Faster finalization
    speechConfig.setProperty(
      SpeechSDK.PropertyId.SpeechServiceConnection_EndSilenceTimeoutMs,
      "2500"
    );

    const audioCfg = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
    const recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioCfg);
    recognizerRef.current = recognizer;

    flushSync(() => setPhase(PHASE.LISTENING));

    // PARTIALS → IMMEDIATE UI + barge-in once
    recognizer.recognizing = async (_, e) => {
      const partial = (e?.result?.text || "").trim();
      if (!partial) return;
      if (partial.length < 2) return; // ignore micro-partials

      // show Listening immediately if not already
      if (phase !== PHASE.LISTENING && phase !== PHASE.BOT_SPEAKING) {
        flushSync(() => setPhase(PHASE.LISTENING));
      }

      if (isBotSpeakingRef.current && !interruptionInProgressRef.current) {
        interruptionInProgressRef.current = true;

        // Flash a quick “Barged” badge for 600ms
        flushSync(() => {
          setPhase(PHASE.BARGE_IN);
          setBargeFlash(true);
        });
        setTimeout(() => setBargeFlash(false), 600);

        await interruptBotNow();
        // snap UI back to Listening right away
        flushSync(() => setPhase(PHASE.LISTENING));
      }
    };

    // FINAL → LLM
    recognizer.recognized = async (_, e) => {
      if (e.result.reason !== SpeechSDK.ResultReason.RecognizedSpeech) return;

      const finalText = (e.result.text || "").trim();
      interruptionInProgressRef.current = false;

      if (!finalText) {
        flushSync(() => setPhase(PHASE.LISTENING));
        return;
      }
      if (finalText === lastFinalRef.current) {
        flushSync(() => setPhase(PHASE.LISTENING));
        return;
      }
      lastFinalRef.current = finalText;

      setHistory((h) => [...h, { role: "user", content: finalText }]);

      // Show THINKING before any network call
      flushSync(() => setPhase(PHASE.THINKING));

      try {
        cancelInFlightLLM();
        const ctrl = new AbortController();
        inflightAbortRef.current = ctrl;

        const { data: newHist } = await axios.post(
          `${API_BASE}/api/chat`,
          {
            messages: [...historyRef.current, { role: "user", content: finalText }],
            userText: finalText,
          },
          { signal: ctrl.signal }
        );

        inflightAbortRef.current = null;
        setHistory(newHist);
        const reply = newHist.slice(-1)?.[0]?.content || "";

        if (reply) {
          // Speak now (UI flips to Speaking immediately inside speakBot)
          speakBot(reply);
        } else {
          flushSync(() => setPhase(PHASE.LISTENING));
        }
      } catch (err) {
        if (err?.name === "CanceledError" || err?.name === "AbortError" || axios.isCancel?.(err)) {
          // likely due to barge-in; partial handler already set UI
        } else {
          console.error("LLM error:", err);
          flushSync(() => setPhase(PHASE.LISTENING));
        }
        inflightAbortRef.current = null;
      }
    };

    // Resilience
    recognizer.canceled = (_, e) => {
      console.warn("STT canceled:", e?.errorDetails);
      interruptionInProgressRef.current = false;
      recognizer.stopContinuousRecognitionAsync(
        () => recognizer.startContinuousRecognitionAsync(() => {}, console.error),
        console.error
      );
      flushSync(() => setPhase(PHASE.LISTENING));
    };

    recognizer.sessionStopped = () => {
      console.warn("STT session stopped — restarting");
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
        // IMMEDIATE UI flip
        flushSync(() => {
          isBotSpeakingRef.current = true;
          setPhase(PHASE.BOT_SPEAKING);
        });
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
    flushSync(() => setPhase(PHASE.THINKING)); // immediate feedback while loading/opening
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
    };
  }, []);

  const handlePreventCopyPaste = (e) => {
    e.preventDefault();
    alert(`🔕Warning, "${e.type}" action is disabled!`);
  };

  // ---------- Status pill UI ----------
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
                onSpeechStart={() => { isBotSpeakingRef.current = true; flushSync(() => setPhase(PHASE.BOT_SPEAKING)); }}
                onSpeechEnd={()   => { isBotSpeakingRef.current = false; flushSync(() => setPhase(PHASE.LISTENING)); }}
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
