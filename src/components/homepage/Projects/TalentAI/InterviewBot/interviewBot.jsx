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

// ================== PHASES ==================
const PHASE = Object.freeze({
  IDLE: "IDLE",
  LISTENING: "LISTENING",
  THINKING: "THINKING",
  BOT_SPEAKING: "BOT_SPEAKING",
  BARGE_IN: "BARGE_IN",
});

// ---------- CONTROL WORDS (instant interrupt) ----------
const CONTROL_WORDS = /\b(stop|wait|hold on|pause|please stop|can you stop|one sec|one second)\b/i;

// ---------- Post-barge partial suppression ----------
const POST_BARGE_IGNORE_MS = 1200; // ignore STT partials briefly after an interrupt

// ------- DIAGNOSTICS -------
const DEBUG = true;
function dbg(tag, info = {}) {
  if (!DEBUG) return;
  const ts = new Date().toISOString();
  try {
    console.log(`[IB ${ts}] ${tag}`, info);
  } catch {
    console.log(`[IB ${ts}] ${tag}`, String(info));
  }
}

// Only barge when avatar is actually speaking (flip to false to barge TTS too)
const BARGE_AVATAR_ONLY = true;

export default function InterviewBot() {
  const { uuid } = useParams();
  const avatarRef = useRef(null);

  const API_BASE = import.meta.env.VITE_TALENTAI_API_INTERVIEW_BASE_URL;

  // -------------- App State --------------
  const [loading, setLoading] = useState(false);
  const [cvText, setCvText] = useState("");
  const [jdText, setJdText] = useState("");

  const [interviewStarted, setInterviewStarted] = useState(false);
  const [history, setHistory] = useState([]); // [{role, content}]
  const historyRef = useRef(history);

  const [timeLeft, setTimeLeft] = useState(1800);
  const timerRef = useRef(null);

  // -------------- STT & Speech --------------
  const recognizerRef = useRef(null);
  const lastFinalRef = useRef("");

  const [phase, setPhase] = useState(PHASE.IDLE);
  const phaseRef = useRef(PHASE.IDLE);
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const [bargeFlash, setBargeFlash] = useState(false);

  // Speaking / interruption flags
  const isBotSpeakingRef = useRef(false);
  const avatarSpeakingRef = useRef(false);
  const ttsSpeakingRef = useRef(false);
  const interruptionInProgressRef = useRef(false);
  const lastInterruptAtRef = useRef(0);
  const lastBargeAtRef = useRef(0);

  // Speak session tokens (avoid race)
  const speakSessionIdRef = useRef(0);

  // Speak watchdog to avoid sticky states
  const speakWatchdogRef = useRef(null);

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

  // Utterance aggregation buffer (accumulate Azure finals here)
  const utteranceBufRef = useRef("");

  // FIRST-PARTIAL / VAD BARGE carryover store
  const bargedCarryRef = useRef(""); // persistent across turns
  const bargedCollectingRef = useRef(false); // true while collecting during barged turn

  // Track whether we heard any human speech this turn
  const hadUserSpeechThisTurnRef = useRef(false);

  // legacy helper handles
  const microHoldTimerRef = useRef(null);
  const lastPartialAtRef = useRef(0);

  useEffect(() => {
    historyRef.current = history;
  }, [history]);

  // ================== Helpers: Phase & Flags ==================
  function normalizeToListening() {
    avatarSpeakingRef.current = false;
    ttsSpeakingRef.current = false;
    isBotSpeakingRef.current = false;
    flushSync(() => setPhase(PHASE.LISTENING));
  }

  function markSpeakingOn() {
    isBotSpeakingRef.current = true;
    flushSync(() => setPhase(PHASE.BOT_SPEAKING));
  }

  // ✅ UPDATED: allow barge in THINKING as well as BOT_SPEAKING
  function canBargeNow() {
    const phase = phaseRef.current;

    const speaking = BARGE_AVATAR_ONLY
      ? avatarSpeakingRef.current
      : avatarSpeakingRef.current || ttsSpeakingRef.current;

    const inSpeakingMode =
      phase === PHASE.BOT_SPEAKING &&
      isBotSpeakingRef.current === true &&
      speaking === true;

    const inThinkingMode = phase === PHASE.THINKING;

    return (
      (inSpeakingMode || inThinkingMode) &&
      !interruptionInProgressRef.current
    );
  }

  // ================== Speak Session Guard + Watchdog ==================
  function clearSpeakWatchdog() {
    if (speakWatchdogRef.current) {
      clearTimeout(speakWatchdogRef.current);
      speakWatchdogRef.current = null;
    }
  }

  function beginSpeakSessionGuard(text) {
    const id = ++speakSessionIdRef.current;
    // ~160wpm → ~420ms/word + buffer, bounded
    const estMs = Math.min(
      30000,
      Math.max(1400, text.split(/\s+/).filter(Boolean).length * 420 + 900)
    );
    clearSpeakWatchdog();
    speakWatchdogRef.current = setTimeout(() => {
      if (
        speakSessionIdRef.current === id &&
        (avatarSpeakingRef.current || ttsSpeakingRef.current) &&
        phaseRef.current === PHASE.BOT_SPEAKING
      ) {
        console.warn("Speak watchdog fired — forcing stop");
        normalizeToListening();
      }
    }, estMs);
    return id;
  }

  function endSpeakSessionGuard(sessionId) {
    if (speakSessionIdRef.current !== sessionId) return;
    clearSpeakWatchdog();
    normalizeToListening();
  }

  // ================== LLM Control ==================
  function cancelInFlightLLM() {
    try {
      inflightAbortRef.current?.abort?.();
    } catch {}
    inflightAbortRef.current = null;
  }

  // ================== Speech: Avatar/TTS ==================
  function speakBot(text) {
    if (!text) return;
    markSpeakingOn();
    const sessionId = beginSpeakSessionGuard(text);

    // Avatar first
    if (avatarRef.current?.isConnected?.() && avatarRef.current?.speak) {
      try {
        avatarSpeakingRef.current = true;
        isBotSpeakingRef.current = true;
        dbg("avatar.speak", { sessionId });
        avatarRef.current.speak(text);
        return; // onSpeechEnd -> endSpeakSessionGuard(sessionId)
      } catch (e) {
        console.warn("Avatar speak failed, falling back to TTS:", e);
      }
    }

    // Fallback TTS
    if (synthesizerRef.current) {
      try {
        ttsSpeakingRef.current = true;
        isBotSpeakingRef.current = true;
        synthesizerRef.current.speakTextAsync(
          text,
          () => {
            dbg("tts.end");
            endSpeakSessionGuard(sessionId);
          },
          (err) => {
            console.error("Fallback TTS failed:", err);
            endSpeakSessionGuard(sessionId);
          }
        );
      } catch (e) {
        console.error("TTS error:", e);
        endSpeakSessionGuard(sessionId);
      }
    } else {
      endSpeakSessionGuard(sessionId);
    }
  }

  async function interruptBotNow() {
    dbg("interruptBotNow.begin", {
      isBotSpeaking: isBotSpeakingRef.current,
      avatarSpeaking: avatarSpeakingRef.current,
      ttsSpeaking: ttsSpeakingRef.current,
    });

    // Flip flags & clear watchdog immediately to gate recognition
    clearSpeakWatchdog();
    avatarSpeakingRef.current = false;
    ttsSpeakingRef.current = false;
    isBotSpeakingRef.current = false;

    // Try to stop avatar speech, but don't hang
    try {
      const stopP = avatarRef.current?.stopSpeaking?.();
      if (stopP && typeof stopP.then === "function") {
        await Promise.race([
          stopP,
          new Promise((resolve) => setTimeout(resolve, 300)),
        ]);
      }
    } catch {}

    // Stop TTS best-effort (non-blocking)
    try {
      synthesizerRef.current?.stopSpeakingAsync?.(() => {}, () => {});
    } catch {}

    // Abort any inflight LLM
    cancelInFlightLLM();

    // Ensure phase not stuck
    flushSync(() => {
      if (phaseRef.current !== PHASE.THINKING) setPhase(PHASE.LISTENING);
    });

    dbg("interruptBotNow.done");
  }

  // ================== Azure STT Setup ==================
  function createSpeechConfig(key, region) {
    const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(key, region);
    // speechConfig.speechRecognitionLanguage = "en-IN";
    speechConfig.setProperty(
      SpeechSDK.PropertyId.SpeechServiceResponse_PostProcessingOption,
      "TrueText"
    );
    speechConfig.setProperty(
      SpeechSDK.PropertyId.SpeechServiceConnection_EndSilenceTimeoutMs,
      "1000"
    );
    speechConfig.setProperty(
      SpeechSDK.PropertyId.SpeechServiceConnection_InitialSilenceTimeoutMs,
      "6000"
    );
    speechConfig.setProperty(
      SpeechSDK.PropertyId.SpeechServiceConnection_LanguageIdMode,
      "Continuous"
    );
    return speechConfig;
  }

  function appendFinalChunk(chunk) {
    const prev = utteranceBufRef.current;
    if (!prev) {
      utteranceBufRef.current = chunk;
      return;
    }
    const tail = prev.slice(-40);
    if (chunk === prev) return;
    if (prev.endsWith(chunk)) return;
    if (chunk.startsWith(tail))
      utteranceBufRef.current = (prev + chunk.slice(tail.length)).trim();
    else utteranceBufRef.current = (prev + " " + chunk).trim();
  }

  // ================== Network: send final (with carry) ==================
  async function sendFinalToBackend() {
    const merged = [bargedCarryRef.current, utteranceBufRef.current]
      .filter(Boolean)
      .join(" ")
      .trim();
    if (!merged) {
      dbg("flush.skip.empty");
      return;
    }

    // clear buffers prior to network
    bargedCarryRef.current = "";
    utteranceBufRef.current = "";

    lastFinalRef.current = merged;
    setHistory((h) => [...h, { role: "user", content: merged }]);
    dbg("flush.send", { text: merged });

    flushSync(() => setPhase(PHASE.THINKING));

    try {
      cancelInFlightLLM();
      const ctrl = new AbortController();
      inflightAbortRef.current = ctrl;

      const { data: newHist } = await axios.post(
        `${API_BASE}/api/chat`,
        {
          messages: [
            ...historyRef.current,
            { role: "user", content: merged },
          ],
          userText: merged,
        },
        { signal: ctrl.signal }
      );

      inflightAbortRef.current = null;
      setHistory(newHist);
      const reply = newHist.slice(-1)?.[0]?.content || "";
      dbg("flush.recv", { ok: !!reply, len: reply?.length ?? 0 });
      reply ? speakBot(reply) : flushSync(() => setPhase(PHASE.LISTENING));
    } catch (err) {
      const canceled =
        err?.name === "CanceledError" ||
        err?.name === "AbortError" ||
        axios.isCancel?.(err);
      dbg("flush.err", { canceled, err: String(err) });
      if (!canceled) {
        console.error("LLM error:", err);
        flushSync(() => setPhase(PHASE.LISTENING));
      }
      inflightAbortRef.current = null;
    } finally {
      hadUserSpeechThisTurnRef.current = false;
    }
  }

  function startSTT() {
    const key = import.meta.env.VITE_AZURE_SPEECH_KEY;
    const region = import.meta.env.VITE_AZURE_SPEECH_REGION;
    if (!key || !region) {
      console.warn("Missing VITE_AZURE_SPEECH_KEY/REGION; STT disabled.");
      return;
    }

    const speechConfig = createSpeechConfig(key, region);
    const autoDetectConfig =
      SpeechSDK.AutoDetectSourceLanguageConfig.fromLanguages([
        "en-IN",
        "hi-IN",
      ]);

    const audioCfg = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
    const recognizer = SpeechSDK.SpeechRecognizer.FromConfig(
      speechConfig,
      autoDetectConfig,
      audioCfg
    );
    recognizerRef.current = recognizer;

    flushSync(() => setPhase(PHASE.LISTENING));

    // ----- Level-0 barge: VAD fires before any text -----
    recognizer.speechStartDetected = async () => {
      dbg("speechStartDetected", {
        phase: phaseRef.current,
        botSpeaking: isBotSpeakingRef.current,
      });
      hadUserSpeechThisTurnRef.current = true;

      if (!canBargeNow() || interruptionInProgressRef.current) return;

      interruptionInProgressRef.current = true;
      lastInterruptAtRef.current = Date.now();
      lastBargeAtRef.current = Date.now();

      // No text yet—just enter collecting mode and prevent flush for this turn
      bargedCollectingRef.current = true;
      discardCurrentUtteranceRef.current = true;
      utteranceBufRef.current = "";

      if (discardSafetyTimerRef.current)
        clearTimeout(discardSafetyTimerRef.current);
      discardSafetyTimerRef.current = setTimeout(() => {
        dbg("discard.safetyTimeout.reset");
        discardCurrentUtteranceRef.current = false;
        bargedCollectingRef.current = false;
      }, 4000);

      flushSync(() => {
        setPhase(PHASE.BARGE_IN);
        setBargeFlash(true);
      });
      setTimeout(() => setBargeFlash(false), 300);
      dbg("barge.trigger.vad");

      await interruptBotNow();
      flushSync(() => setPhase(PHASE.LISTENING));
      interruptionInProgressRef.current = false;
    };

    // ----------- FIRST-PARTIAL & FINAL-ONLY INSTANT BARGE-IN -----------
    recognizer.recognizing = async (_, e) => {
      const partial = (e?.result?.text || "").trim();
      if (!partial) return;
      hadUserSpeechThisTurnRef.current = true;

      if (Date.now() - lastBargeAtRef.current < POST_BARGE_IGNORE_MS) {
        dbg("recognizing.partial", {
          partial,
          note: "post-barge-ignore",
          curPhase: phaseRef.current,
          avatarSpeaking: avatarSpeakingRef.current,
          isBotSpeaking: isBotSpeakingRef.current,
        });
        return;
      }

      lastPartialAtRef.current = Date.now();

      // FIRST-PARTIAL wins: stop bot immediately if speaking/thinking
      if (canBargeNow() && !interruptionInProgressRef.current) {
        interruptionInProgressRef.current = true;
        lastInterruptAtRef.current = Date.now();
        lastBargeAtRef.current = Date.now();

        // Seed carry buffer with this very first partial (only if empty)
        if (!bargedCarryRef.current) bargedCarryRef.current = partial;
        // Start collecting any subsequent partial/finals until end-of-speech
        bargedCollectingRef.current = true;

        // Mark this utterance as discard (do not send this turn)
        discardCurrentUtteranceRef.current = true;
        utteranceBufRef.current = "";

        if (discardSafetyTimerRef.current)
          clearTimeout(discardSafetyTimerRef.current);
        discardSafetyTimerRef.current = setTimeout(() => {
          dbg("discard.safetyTimeout.reset");
          discardCurrentUtteranceRef.current = false;
          bargedCollectingRef.current = false;
        }, 4000);

        flushSync(() => {
          setPhase(PHASE.BARGE_IN);
          setBargeFlash(true);
        });
        setTimeout(() => setBargeFlash(false), 300);

        dbg("barge.trigger.instant-first-partial", { partial });
        await interruptBotNow();
        flushSync(() => setPhase(PHASE.LISTENING));
        interruptionInProgressRef.current = false;
        return;
      }

      // Control-word fallback
      if (CONTROL_WORDS.test(partial)) {
        if (!canBargeNow()) {
          dbg("barge.control.ignored", { partial, phase: phaseRef.current });
          return;
        }
        interruptionInProgressRef.current = true;
        lastInterruptAtRef.current = Date.now();
        lastBargeAtRef.current = Date.now();

        bargedCollectingRef.current = true;
        if (!bargedCarryRef.current) bargedCarryRef.current = partial;

        discardCurrentUtteranceRef.current = true;
        utteranceBufRef.current = "";

        if (discardSafetyTimerRef.current)
          clearTimeout(discardSafetyTimerRef.current);
        discardSafetyTimerRef.current = setTimeout(() => {
          dbg("discard.safetyTimeout.reset");
          discardCurrentUtteranceRef.current = false;
          bargedCollectingRef.current = false;
        }, 4000);

        flushSync(() => {
          setPhase(PHASE.BARGE_IN);
          setBargeFlash(true);
        });
        setTimeout(() => setBargeFlash(false), 300);

        dbg("barge.trigger.control", { partial });
        await interruptBotNow();
        flushSync(() => setPhase(PHASE.LISTENING));
        interruptionInProgressRef.current = false;
        return;
      }
    };

    // FINALS (also support instant barge if no partials were received)
    recognizer.recognized = async (_, e) => {
      if (e.result.reason !== SpeechSDK.ResultReason.RecognizedSpeech) return;
      const chunk = (e.result.text || "").trim();
      interruptionInProgressRef.current = false;
      if (!chunk) return;
      hadUserSpeechThisTurnRef.current = true;

      // If bot is speaking/thinking and Azure delivered a FINAL without prior partials, barge now
      if (canBargeNow() && !discardCurrentUtteranceRef.current) {
        interruptionInProgressRef.current = true;
        lastInterruptAtRef.current = Date.now();
        lastBargeAtRef.current = Date.now();

        bargedCollectingRef.current = true;
        bargedCarryRef.current =
          (bargedCarryRef.current ? bargedCarryRef.current + " " : "") + chunk;

        discardCurrentUtteranceRef.current = true;
        utteranceBufRef.current = "";

        if (discardSafetyTimerRef.current)
          clearTimeout(discardSafetyTimerRef.current);
        discardSafetyTimerRef.current = setTimeout(() => {
          dbg("discard.safetyTimeout.reset");
          discardCurrentUtteranceRef.current = false;
          bargedCollectingRef.current = false;
        }, 4000);

        flushSync(() => {
          setPhase(PHASE.BARGE_IN);
          setBargeFlash(true);
        });
        setTimeout(() => setBargeFlash(false), 300);
        dbg("barge.trigger.final-no-partials", { chunk });

        await interruptBotNow();
        flushSync(() => setPhase(PHASE.LISTENING));
        interruptionInProgressRef.current = false;
        return;
      }

      if (discardCurrentUtteranceRef.current) {
        if (bargedCollectingRef.current) {
          bargedCarryRef.current =
            (bargedCarryRef.current ? bargedCarryRef.current + " " : "") +
            chunk;
          dbg("recognized.carry.append", {
            chunk,
            carryLen: bargedCarryRef.current.length,
          });
        } else {
          dbg("recognized.drop", { chunk });
        }
        return;
      }

      // normal path — build the buffer for this non-barged turn
      appendFinalChunk(chunk);
      dbg("recognized.append", {
        chunk,
        bufferLen: utteranceBufRef.current.length,
      });
    };

    // Speech end: reset discard flag OR single immediate send
    recognizer.speechEndDetected = () => {
      dbg("speechEndDetected", {
        discarding: discardCurrentUtteranceRef.current,
        phase: phaseRef.current,
        spoke: hadUserSpeechThisTurnRef.current,
      });

      // Ignore end events while bot is speaking (prevents empty flushes)
      if (isBotSpeakingRef.current || phaseRef.current === PHASE.BOT_SPEAKING) {
        return;
      }

      if (discardCurrentUtteranceRef.current) {
        discardCurrentUtteranceRef.current = false;
        bargedCollectingRef.current = false; // retain carry for next turn
        if (discardSafetyTimerRef.current) {
          clearTimeout(discardSafetyTimerRef.current);
          discardSafetyTimerRef.current = null;
        }
        dbg("discard.reset.onSpeechEnd");
        hadUserSpeechThisTurnRef.current = false;
        return; // nothing to flush for interrupted turn
      }

      if (!hadUserSpeechThisTurnRef.current) {
        dbg("flush.skip.noHumanSpeech");
        return;
      }

      dbg("flush.immediate");
      sendFinalToBackend(); // will pre-add carry if present
      hadUserSpeechThisTurnRef.current = false;
    };

    // Resilience
    recognizer.canceled = (_, e) => {
      dbg("stt.canceled", { err: e?.errorDetails });
      discardCurrentUtteranceRef.current = false;
      bargedCollectingRef.current = false;
      if (discardSafetyTimerRef.current) {
        clearTimeout(discardSafetyTimerRef.current);
        discardSafetyTimerRef.current = null;
      }
      interruptionInProgressRef.current = false;
      hadUserSpeechThisTurnRef.current = false;

      // restart continuous STT
      recognizer.stopContinuousRecognitionAsync(
        () =>
          recognizer.startContinuousRecognitionAsync(() => {}, console.error),
        console.error
      );
      if (!isBotSpeakingRef.current)
        flushSync(() => setPhase(PHASE.LISTENING));
    };

    recognizer.sessionStopped = () => {
      dbg("stt.sessionStopped");
      discardCurrentUtteranceRef.current = false;
      bargedCollectingRef.current = false;
      if (discardSafetyTimerRef.current) {
        clearTimeout(discardSafetyTimerRef.current);
        discardSafetyTimerRef.current = null;
      }
      interruptionInProgressRef.current = false;
      hadUserSpeechThisTurnRef.current = false;

      recognizer.stopContinuousRecognitionAsync(
        () =>
          recognizer.startContinuousRecognitionAsync(() => {}, console.error),
        console.error
      );
      if (!isBotSpeakingRef.current)
        flushSync(() => setPhase(PHASE.LISTENING));
    };

    recognizer.startContinuousRecognitionAsync(
      () => console.log("STT started"),
      (err) => console.error("STT error", err)
    );
  }

  async function speakFirstWithAvatar(text) {
    if (!text) {
      startSTT();
      return;
    }
    firstPendingRef.current = text;

    const trySpeak = () => {
      if (avatarRef.current?.isConnected?.() && avatarRef.current?.speak) {
        const id = beginSpeakSessionGuard(firstPendingRef.current);
        avatarSpeakingRef.current = true;
        isBotSpeakingRef.current = true;
        dbg("avatar.firstSpeak.try", { sessionId: id });
        flushSync(() => {
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
          console.warn(
            "Avatar did not connect in time. First message not spoken (avatar-only)."
          );
          startSTT();
        }
      }
    }, 200);
  }

  const startInterview = async () => {
    flushSync(() => setPhase(PHASE.THINKING));
    setLoading(true);
    try {
      const resp = await axios.post(`${API_BASE}/api/hr/get-status-active`, {
        UID: uuid,
      });
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
        synthesizerRef.current = new SpeechSDK.SpeechSynthesizer(
          ttsCfg,
          ttsAudioCfg
        );
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

      try {
        avatarRef.current?.start?.();
      } catch (e) {
        console.warn("Avatar start error:", e);
      }
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

    if (discardSafetyTimerRef.current) {
      clearTimeout(discardSafetyTimerRef.current);
      discardSafetyTimerRef.current = null;
    }
    utteranceBufRef.current = "";
    discardCurrentUtteranceRef.current = false;
    bargedCollectingRef.current = false;
    hadUserSpeechThisTurnRef.current = false;

    clearInterval(timerRef.current);
    await interruptBotNow();
    try {
      avatarRef.current?.stop?.();
    } catch {}

    const name = window.prompt("Please enter your name to save your transcript:");
    if (!name) {
      alert("Name is required to save your transcript.");
      return;
    }
    try {
      await axios.post(`${API_BASE}/api/chat/save`, {
        name,
        conversation: history,
      });
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
      try {
        recognizerRef.current?.stopContinuousRecognitionAsync(() => {}, () => {});
      } catch {}
      try {
        avatarRef.current?.stop?.();
      } catch {}
      try {
        synthesizerRef.current?.close?.();
      } catch {}
      cancelInFlightLLM();
      if (timerRef.current) clearInterval(timerRef.current);
      if (microHoldTimerRef.current) clearTimeout(microHoldTimerRef.current);
      if (discardSafetyTimerRef.current) clearTimeout(discardSafetyTimerRef.current);
      clearSpeakWatchdog();
      utteranceBufRef.current = "";
      discardCurrentUtteranceRef.current = false;
      bargedCollectingRef.current = false;
      hadUserSpeechThisTurnRef.current = false;
      avatarSpeakingRef.current = false;
      ttsSpeakingRef.current = false;
      isBotSpeakingRef.current = false;
    };
  }, []);

  const handlePreventCopyPaste = (e) => {
    e.preventDefault();
    alert(`🔕Warning, "${e.type}" action is disabled!`);
  };

  const phaseMeta = useMemo(() => {
    switch (phase) {
      case PHASE.BARGE_IN:
        return { label: "Barge-in", bg: "#FFF4E5", fg: "#8A4B00", icon: "⏹️" };
      case PHASE.LISTENING:
        return { label: "Listening", bg: "#E6F4EA", fg: "#137333", icon: "🎤" };
      case PHASE.THINKING:
        return { label: "Thinking", bg: "#E8F0FE", fg: "#174EA6", icon: "⌛" };
      case PHASE.BOT_SPEAKING:
        return { label: "Speaking", bg: "#FCE8E6", fg: "#B80606", icon: "🔊" };
      default:
        return { label: "Idle", bg: "#F1F3F4", fg: "#3C4043", icon: "⏸️" };
    }
  }, [phase]);

  const StatusPill = () => (
    <div
      style={{
        position: "absolute",
        top: 12,
        right: 12,
        zIndex: 10,
        display: "inline-flex",
        gap: 8,
        alignItems: "center",
        padding: "6px 10px",
        borderRadius: 999,
        background: phaseMeta.bg,
        color: phaseMeta.fg,
        fontSize: 13,
        fontWeight: 600,
        boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
        transform: bargeFlash ? "scale(1.06)" : "scale(1.0)",
        transition: "transform 120ms ease",
      }}
      aria-live="polite"
    >
      <span>{phaseMeta.icon}</span>
      <span>{phaseMeta.label}</span>
      {phase === PHASE.THINKING && (
        <span
          className="spinner"
          style={{
            width: 12,
            height: 12,
            borderRadius: "50%",
            border: "2px solid rgba(0,0,0,0.15)",
            borderTopColor: phaseMeta.fg,
            display: "inline-block",
            animation: "spin 0.9s linear infinite",
          }}
        />
      )}
      {phase === PHASE.LISTENING && (
        <span
          className="pulse"
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: phaseMeta.fg,
            opacity: 0.9,
            boxShadow: "0 0 0 0 rgba(19,115,51,0.7)",
            animation: "pulse 1.4s infinite",
          }}
        />
      )}
    </div>
  );

  return (
    <main
      onPaste={handlePreventCopyPaste}
      onCut={handlePreventCopyPaste}
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
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
        <div className="loading-overlay">
          <div className="loading-spinner" />
        </div>
      )}

      {/* Header */}
      <div
        className="mainHeader"
        style={{ flex: "0 0 auto", position: "relative" }}
      >
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
                  dbg("avatar.onSpeechStart", {
                    speakSessionId: speakSessionIdRef.current,
                  });
                  flushSync(() => setPhase(PHASE.BOT_SPEAKING));
                }}
                onSpeechEnd={() => {
                  const id = speakSessionIdRef.current;
                  dbg("avatar.onSpeechEnd", { lastSpeakSessionId: id });
                  endSpeakSessionGuard(id);
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


// import { useState, useEffect, useRef, useMemo } from "react";
// import { flushSync } from "react-dom";
// import { useParams } from "react-router-dom";
// import "./interviewBot.css";
// import CameraRecorder from "./cameraRecorder.jsx";
// import mothersonLogo from "../assets_talentAI/motherson_logo.svg";
// import ThankYouPage from "./thankYouPage.jsx";
// import axios from "axios";
// import * as SpeechSDK from "microsoft-cognitiveservices-speech-sdk";
// import AvatarPanel from "./AvatarPanel";
// import InterviewInstruction from "./interviewInstruction.jsx";

// // ================== PHASES ==================
// const PHASE = Object.freeze({
//   IDLE: "IDLE",
//   LISTENING: "LISTENING",
//   THINKING: "THINKING",
//   BOT_SPEAKING: "BOT_SPEAKING",
//   BARGE_IN: "BARGE_IN",
// });

// // ---------- CONTROL WORDS (instant interrupt) ----------
// const CONTROL_WORDS = /\b(stop|wait|hold on|pause|please stop|can you stop|one sec|one second)\b/i;

// // ---------- Post-barge partial suppression ----------
// const POST_BARGE_IGNORE_MS = 1200; // ignore STT partials briefly after an interrupt

// // ------- DIAGNOSTICS -------
// const DEBUG = true;
// function dbg(tag, info = {}) {
//   if (!DEBUG) return;
//   const ts = new Date().toISOString();
//   try {
//     console.log(`[IB ${ts}] ${tag}`, info);
//   } catch {
//     console.log(`[IB ${ts}] ${tag}`, String(info));
//   }
// }

// // Only barge when avatar is actually speaking (flip to false to barge TTS too)
// const BARGE_AVATAR_ONLY = true;

// export default function InterviewBot() {
//   const { uuid } = useParams();
//   const avatarRef = useRef(null);

//   const API_BASE = import.meta.env.VITE_TALENTAI_API_INTERVIEW_BASE_URL;

//   // -------------- App State --------------
//   const [loading, setLoading] = useState(false);
//   const [cvText, setCvText] = useState("");
//   const [jdText, setJdText] = useState("");

//   const [interviewStarted, setInterviewStarted] = useState(false);
//   const [history, setHistory] = useState([]); // [{role, content}]
//   const historyRef = useRef(history);

//   const [timeLeft, setTimeLeft] = useState(1800);
//   const timerRef = useRef(null);

//   // -------------- STT & Speech --------------
//   const recognizerRef = useRef(null);
//   const lastFinalRef = useRef("");

//   const [phase, setPhase] = useState(PHASE.IDLE);
//   const phaseRef = useRef(PHASE.IDLE);
//   useEffect(() => {
//     phaseRef.current = phase;
//   }, [phase]);

//   const [bargeFlash, setBargeFlash] = useState(false);

//   // Speaking / interruption flags
//   const isBotSpeakingRef = useRef(false);
//   const avatarSpeakingRef = useRef(false);
//   const ttsSpeakingRef = useRef(false);
//   const interruptionInProgressRef = useRef(false);
//   const lastInterruptAtRef = useRef(0);
//   const lastBargeAtRef = useRef(0);

//   // Speak session tokens (avoid race)
//   const speakSessionIdRef = useRef(0);

//   // Speak watchdog to avoid sticky states
//   const speakWatchdogRef = useRef(null);

//   // Discard-on-barge guard
//   const discardCurrentUtteranceRef = useRef(false);
//   const discardSafetyTimerRef = useRef(null);

//   // Fallback TTS
//   const synthesizerRef = useRef(null);

//   // Abortable LLM
//   const inflightAbortRef = useRef(null);

//   // First-message avatar-only control
//   const firstPendingRef = useRef("");
//   const firstSpokenRef = useRef(false);

//   // End-page state
//   const [record, setRecord] = useState(false);
//   const [interviewStatus, setInterviewStatus] = useState(false);
//   const [showPopup, setShowPopup] = useState(true);

//   // Utterance aggregation buffer (accumulate Azure finals here)
//   const utteranceBufRef = useRef("");

//   // FIRST-PARTIAL / VAD BARGE carryover store
//   const bargedCarryRef = useRef(""); // persistent across turns
//   const bargedCollectingRef = useRef(false); // true while collecting during barged turn

//   // Track whether we heard any human speech this turn
//   const hadUserSpeechThisTurnRef = useRef(false);

//   // legacy helper handles
//   const microHoldTimerRef = useRef(null);
//   const lastPartialAtRef = useRef(0);

//   useEffect(() => {
//     historyRef.current = history;
//   }, [history]);

//   // ================== Helpers: Phase & Flags ==================
//   function normalizeToListening() {
//     avatarSpeakingRef.current = false;
//     ttsSpeakingRef.current = false;
//     isBotSpeakingRef.current = false;
//     flushSync(() => setPhase(PHASE.LISTENING));
//   }

//   function markSpeakingOn() {
//     isBotSpeakingRef.current = true;
//     flushSync(() => setPhase(PHASE.BOT_SPEAKING));
//   }

//   function canBargeNow() {
//     const speaking = BARGE_AVATAR_ONLY
//       ? avatarSpeakingRef.current
//       : avatarSpeakingRef.current || ttsSpeakingRef.current;
//     return (
//       phaseRef.current === PHASE.BOT_SPEAKING &&
//       isBotSpeakingRef.current === true &&
//       speaking === true &&
//       !interruptionInProgressRef.current
//     );
//   }

//   // ================== Speak Session Guard + Watchdog ==================
//   function clearSpeakWatchdog() {
//     if (speakWatchdogRef.current) {
//       clearTimeout(speakWatchdogRef.current);
//       speakWatchdogRef.current = null;
//     }
//   }

//   function beginSpeakSessionGuard(text) {
//     const id = ++speakSessionIdRef.current;
//     // ~160wpm → ~420ms/word + buffer, bounded
//     const estMs = Math.min(
//       30000,
//       Math.max(1400, text.split(/\s+/).filter(Boolean).length * 420 + 900)
//     );
//     clearSpeakWatchdog();
//     speakWatchdogRef.current = setTimeout(() => {
//       if (
//         speakSessionIdRef.current === id &&
//         (avatarSpeakingRef.current || ttsSpeakingRef.current) &&
//         phaseRef.current === PHASE.BOT_SPEAKING
//       ) {
//         console.warn("Speak watchdog fired — forcing stop");
//         normalizeToListening();
//       }
//     }, estMs);
//     return id;
//   }

//   function endSpeakSessionGuard(sessionId) {
//     if (speakSessionIdRef.current !== sessionId) return;
//     clearSpeakWatchdog();
//     normalizeToListening();
//   }

//   // ================== LLM Control ==================
//   function cancelInFlightLLM() {
//     try {
//       inflightAbortRef.current?.abort?.();
//     } catch {}
//     inflightAbortRef.current = null;
//   }

//   // ================== Speech: Avatar/TTS ==================
//   function speakBot(text) {
//     if (!text) return;
//     markSpeakingOn();
//     const sessionId = beginSpeakSessionGuard(text);

//     // Avatar first
//     if (avatarRef.current?.isConnected?.() && avatarRef.current?.speak) {
//       try {
//         avatarSpeakingRef.current = true;
//         isBotSpeakingRef.current = true;
//         dbg("avatar.speak", { sessionId });
//         avatarRef.current.speak(text);
//         return; // onSpeechEnd -> endSpeakSessionGuard(sessionId)
//       } catch (e) {
//         console.warn("Avatar speak failed, falling back to TTS:", e);
//       }
//     }

//     // Fallback TTS
//     if (synthesizerRef.current) {
//       try {
//         ttsSpeakingRef.current = true;
//         isBotSpeakingRef.current = true;
//         synthesizerRef.current.speakTextAsync(
//           text,
//           () => {
//             dbg("tts.end");
//             endSpeakSessionGuard(sessionId);
//           },
//           (err) => {
//             console.error("Fallback TTS failed:", err);
//             endSpeakSessionGuard(sessionId);
//           }
//         );
//       } catch (e) {
//         console.error("TTS error:", e);
//         endSpeakSessionGuard(sessionId);
//       }
//     } else {
//       endSpeakSessionGuard(sessionId);
//     }
//   }

//   async function interruptBotNow() {
//     dbg("interruptBotNow.begin", {
//       isBotSpeaking: isBotSpeakingRef.current,
//       avatarSpeaking: avatarSpeakingRef.current,
//       ttsSpeaking: ttsSpeakingRef.current,
//     });

//     // Flip flags & clear watchdog immediately to gate recognition
//     clearSpeakWatchdog();
//     avatarSpeakingRef.current = false;
//     ttsSpeakingRef.current = false;
//     isBotSpeakingRef.current = false;

//     // Try to stop avatar speech, but don't hang
//     try {
//       const stopP = avatarRef.current?.stopSpeaking?.();
//       if (stopP && typeof stopP.then === "function") {
//         await Promise.race([
//           stopP,
//           new Promise((resolve) => setTimeout(resolve, 300)),
//         ]);
//       }
//     } catch {}

//     // Stop TTS best-effort (non-blocking)
//     try {
//       synthesizerRef.current?.stopSpeakingAsync?.(() => {}, () => {});
//     } catch {}

//     // Abort any inflight LLM
//     cancelInFlightLLM();

//     // Ensure phase not stuck
//     flushSync(() => {
//       if (phaseRef.current !== PHASE.THINKING) setPhase(PHASE.LISTENING);
//     });

//     dbg("interruptBotNow.done");
//   }

//   // ================== Azure STT Setup ==================
//   function createSpeechConfig(key, region) {
//     const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(key, region);
//     // speechConfig.speechRecognitionLanguage = "en-IN";
//     speechConfig.setProperty(
//       SpeechSDK.PropertyId.SpeechServiceResponse_PostProcessingOption,
//       "TrueText"
//     );
//     speechConfig.setProperty(
//       SpeechSDK.PropertyId.SpeechServiceConnection_EndSilenceTimeoutMs,
//       "1500"
//     );
//     speechConfig.setProperty(
//       SpeechSDK.PropertyId.SpeechServiceConnection_InitialSilenceTimeoutMs,
//       "6000"
//     );
//     speechConfig.setProperty(
//     SpeechSDK.PropertyId.SpeechServiceConnection_LanguageIdMode,
//     "Continuous"
//   );
//     return speechConfig;
//   }

//   function appendFinalChunk(chunk) {
//     const prev = utteranceBufRef.current;
//     if (!prev) {
//       utteranceBufRef.current = chunk;
//       return;
//     }
//     const tail = prev.slice(-40);
//     if (chunk === prev) return;
//     if (prev.endsWith(chunk)) return;
//     if (chunk.startsWith(tail))
//       utteranceBufRef.current = (prev + chunk.slice(tail.length)).trim();
//     else utteranceBufRef.current = (prev + " " + chunk).trim();
//   }

//   // ================== Network: send final (with carry) ==================
//   async function sendFinalToBackend() {
//     const merged = [bargedCarryRef.current, utteranceBufRef.current]
//       .filter(Boolean)
//       .join(" ")
//       .trim();
//     if (!merged) {
//       dbg("flush.skip.empty");
//       return;
//     }

//     // clear buffers prior to network
//     bargedCarryRef.current = "";
//     utteranceBufRef.current = "";

//     lastFinalRef.current = merged;
//     setHistory((h) => [...h, { role: "user", content: merged }]);
//     dbg("flush.send", { text: merged });

//     flushSync(() => setPhase(PHASE.THINKING));

//     try {
//       cancelInFlightLLM();
//       const ctrl = new AbortController();
//       inflightAbortRef.current = ctrl;

//       const { data: newHist } = await axios.post(
//         `${API_BASE}/api/chat`,
//         { messages: [...historyRef.current, { role: "user", content: merged }], userText: merged },
//         { signal: ctrl.signal }
//       );

//       inflightAbortRef.current = null;
//       setHistory(newHist);
//       const reply = newHist.slice(-1)?.[0]?.content || "";
//       dbg("flush.recv", { ok: !!reply, len: reply?.length ?? 0 });
//       reply ? speakBot(reply) : flushSync(() => setPhase(PHASE.LISTENING));
//     } catch (err) {
//       const canceled =
//         err?.name === "CanceledError" ||
//         err?.name === "AbortError" ||
//         axios.isCancel?.(err);
//       dbg("flush.err", { canceled, err: String(err) });
//       if (!canceled) {
//         console.error("LLM error:", err);
//         flushSync(() => setPhase(PHASE.LISTENING));
//       }
//       inflightAbortRef.current = null;
//     } finally {
//       hadUserSpeechThisTurnRef.current = false;
//     }
//   }

//   function startSTT() {
//     const key = import.meta.env.VITE_AZURE_SPEECH_KEY;
//     const region = import.meta.env.VITE_AZURE_SPEECH_REGION;
//     if (!key || !region) {
//       console.warn("Missing VITE_AZURE_SPEECH_KEY/REGION; STT disabled.");
//       return;
//     }

//     const speechConfig = createSpeechConfig(key, region);
//     const autoDetectConfig = SpeechSDK.AutoDetectSourceLanguageConfig.fromLanguages([
//     "en-IN",
//     "hi-IN",
//   ]);

//   //const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();

//     const audioCfg = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
//     const recognizer = SpeechSDK.SpeechRecognizer.FromConfig(
//   speechConfig,
//   autoDetectConfig,
//   audioCfg
// );
//     recognizerRef.current = recognizer;

//     flushSync(() => setPhase(PHASE.LISTENING));

//     // ----- Level-0 barge: VAD fires before any text -----
//     recognizer.speechStartDetected = async () => {
//       dbg("speechStartDetected", {
//         phase: phaseRef.current,
//         botSpeaking: isBotSpeakingRef.current,
//       });
//       hadUserSpeechThisTurnRef.current = true;

//       if (!canBargeNow() || interruptionInProgressRef.current) return;

//       interruptionInProgressRef.current = true;
//       lastInterruptAtRef.current = Date.now();
//       lastBargeAtRef.current = Date.now();

//       // No text yet—just enter collecting mode and prevent flush for this turn
//       bargedCollectingRef.current = true;
//       discardCurrentUtteranceRef.current = true;
//       utteranceBufRef.current = "";

//       if (discardSafetyTimerRef.current) clearTimeout(discardSafetyTimerRef.current);
//       discardSafetyTimerRef.current = setTimeout(() => {
//         dbg("discard.safetyTimeout.reset");
//         discardCurrentUtteranceRef.current = false;
//         bargedCollectingRef.current = false;
//       }, 4000);

//       flushSync(() => {
//         setPhase(PHASE.BARGE_IN);
//         setBargeFlash(true);
//       });
//       setTimeout(() => setBargeFlash(false), 300);
//       dbg("barge.trigger.vad");

//       await interruptBotNow();
//       flushSync(() => setPhase(PHASE.LISTENING));
//       interruptionInProgressRef.current = false;
//     };

//     // ----------- FIRST-PARTIAL & FINAL-ONLY INSTANT BARGE-IN -----------
//     recognizer.recognizing = async (_, e) => {
//       const partial = (e?.result?.text || "").trim();
//       if (!partial) return;
//       hadUserSpeechThisTurnRef.current = true;

//       if (Date.now() - lastBargeAtRef.current < POST_BARGE_IGNORE_MS) {
//         dbg("recognizing.partial", {
//           partial,
//           note: "post-barge-ignore",
//           curPhase: phaseRef.current,
//           avatarSpeaking: avatarSpeakingRef.current,
//           isBotSpeaking: isBotSpeakingRef.current,
//         });
//         return;
//       }

//       lastPartialAtRef.current = Date.now();

//       // FIRST-PARTIAL wins: stop bot immediately if speaking
//       if (canBargeNow() && !interruptionInProgressRef.current) {
//         interruptionInProgressRef.current = true;
//         lastInterruptAtRef.current = Date.now();
//         lastBargeAtRef.current = Date.now();

//         // Seed carry buffer with this very first partial (only if empty)
//         if (!bargedCarryRef.current) bargedCarryRef.current = partial;
//         // Start collecting any subsequent partial/finals until end-of-speech
//         bargedCollectingRef.current = true;

//         // Mark this utterance as discard (do not send this turn)
//         discardCurrentUtteranceRef.current = true;
//         utteranceBufRef.current = "";

//         if (discardSafetyTimerRef.current) clearTimeout(discardSafetyTimerRef.current);
//         discardSafetyTimerRef.current = setTimeout(() => {
//           dbg("discard.safetyTimeout.reset");
//           discardCurrentUtteranceRef.current = false;
//           bargedCollectingRef.current = false;
//         }, 4000);

//         flushSync(() => {
//           setPhase(PHASE.BARGE_IN);
//           setBargeFlash(true);
//         });
//         setTimeout(() => setBargeFlash(false), 300);

//         dbg("barge.trigger.instant-first-partial", { partial });
//         await interruptBotNow();
//         flushSync(() => setPhase(PHASE.LISTENING));
//         interruptionInProgressRef.current = false;
//         return;
//       }

//       // Control-word fallback
//       if (CONTROL_WORDS.test(partial)) {
//         if (!canBargeNow()) {
//           dbg("barge.control.ignored", { partial, phase: phaseRef.current });
//           return;
//         }
//         interruptionInProgressRef.current = true;
//         lastInterruptAtRef.current = Date.now();
//         lastBargeAtRef.current = Date.now();

//         bargedCollectingRef.current = true;
//         if (!bargedCarryRef.current) bargedCarryRef.current = partial;

//         discardCurrentUtteranceRef.current = true;
//         utteranceBufRef.current = "";

//         if (discardSafetyTimerRef.current) clearTimeout(discardSafetyTimerRef.current);
//         discardSafetyTimerRef.current = setTimeout(() => {
//           dbg("discard.safetyTimeout.reset");
//           discardCurrentUtteranceRef.current = false;
//           bargedCollectingRef.current = false;
//         }, 4000);

//         flushSync(() => {
//           setPhase(PHASE.BARGE_IN);
//           setBargeFlash(true);
//         });
//         setTimeout(() => setBargeFlash(false), 300);

//         dbg("barge.trigger.control", { partial });
//         await interruptBotNow();
//         flushSync(() => setPhase(PHASE.LISTENING));
//         interruptionInProgressRef.current = false;
//         return;
//       }
//     };

//     // FINALS (also support instant barge if no partials were received)
//     recognizer.recognized = async (_, e) => {
//       if (e.result.reason !== SpeechSDK.ResultReason.RecognizedSpeech) return;
//       const chunk = (e.result.text || "").trim();
//       interruptionInProgressRef.current = false;
//       if (!chunk) return;
//       hadUserSpeechThisTurnRef.current = true;

//       // If bot is speaking and Azure delivered a FINAL without prior partials, barge now
//       if (canBargeNow() && !discardCurrentUtteranceRef.current) {
//         interruptionInProgressRef.current = true;
//         lastInterruptAtRef.current = Date.now();
//         lastBargeAtRef.current = Date.now();

//         bargedCollectingRef.current = true;
//         bargedCarryRef.current = (
//           bargedCarryRef.current ? bargedCarryRef.current + " " : ""
//         ) + chunk;

//         discardCurrentUtteranceRef.current = true;
//         utteranceBufRef.current = "";

//         if (discardSafetyTimerRef.current) clearTimeout(discardSafetyTimerRef.current);
//         discardSafetyTimerRef.current = setTimeout(() => {
//           dbg("discard.safetyTimeout.reset");
//           discardCurrentUtteranceRef.current = false;
//           bargedCollectingRef.current = false;
//         }, 4000);

//         flushSync(() => {
//           setPhase(PHASE.BARGE_IN);
//           setBargeFlash(true);
//         });
//         setTimeout(() => setBargeFlash(false), 300);
//         dbg("barge.trigger.final-no-partials", { chunk });

//         await interruptBotNow();
//         flushSync(() => setPhase(PHASE.LISTENING));
//         interruptionInProgressRef.current = false;
//         return;
//       }

//       if (discardCurrentUtteranceRef.current) {
//         if (bargedCollectingRef.current) {
//           bargedCarryRef.current = (
//             bargedCarryRef.current ? bargedCarryRef.current + " " : ""
//           ) + chunk;
//           dbg("recognized.carry.append", {
//             chunk,
//             carryLen: bargedCarryRef.current.length,
//           });
//         } else {
//           dbg("recognized.drop", { chunk });
//         }
//         return;
//       }

//       // normal path — build the buffer for this non-barged turn
//       appendFinalChunk(chunk);
//       dbg("recognized.append", { chunk, bufferLen: utteranceBufRef.current.length });
//     };

//     // Speech end: reset discard flag OR single immediate send
//     recognizer.speechEndDetected = () => {
//       dbg("speechEndDetected", {
//         discarding: discardCurrentUtteranceRef.current,
//         phase: phaseRef.current,
//         spoke: hadUserSpeechThisTurnRef.current,
//       });

//       // Ignore end events while bot is speaking (prevents empty flushes)
//       if (isBotSpeakingRef.current || phaseRef.current === PHASE.BOT_SPEAKING) {
//         return;
//       }

//       if (discardCurrentUtteranceRef.current) {
//         discardCurrentUtteranceRef.current = false;
//         bargedCollectingRef.current = false; // retain carry for next turn
//         if (discardSafetyTimerRef.current) {
//           clearTimeout(discardSafetyTimerRef.current);
//           discardSafetyTimerRef.current = null;
//         }
//         dbg("discard.reset.onSpeechEnd");
//         hadUserSpeechThisTurnRef.current = false;
//         return; // nothing to flush for interrupted turn
//       }

//       if (!hadUserSpeechThisTurnRef.current) {
//         dbg("flush.skip.noHumanSpeech");
//         return;
//       }

//       dbg("flush.immediate");
//       sendFinalToBackend(); // will pre-add carry if present
//       hadUserSpeechThisTurnRef.current = false;
//     };

//     // Resilience
//     recognizer.canceled = (_, e) => {
//       dbg("stt.canceled", { err: e?.errorDetails });
//       discardCurrentUtteranceRef.current = false;
//       bargedCollectingRef.current = false;
//       if (discardSafetyTimerRef.current) {
//         clearTimeout(discardSafetyTimerRef.current);
//         discardSafetyTimerRef.current = null;
//       }
//       interruptionInProgressRef.current = false;
//       hadUserSpeechThisTurnRef.current = false;

//       // restart continuous STT
//       recognizer.stopContinuousRecognitionAsync(
//         () => recognizer.startContinuousRecognitionAsync(() => {}, console.error),
//         console.error
//       );
//       if (!isBotSpeakingRef.current) flushSync(() => setPhase(PHASE.LISTENING));
//     };

//     recognizer.sessionStopped = () => {
//       dbg("stt.sessionStopped");
//       discardCurrentUtteranceRef.current = false;
//       bargedCollectingRef.current = false;
//       if (discardSafetyTimerRef.current) {
//         clearTimeout(discardSafetyTimerRef.current);
//         discardSafetyTimerRef.current = null;
//       }
//       interruptionInProgressRef.current = false;
//       hadUserSpeechThisTurnRef.current = false;

//       recognizer.stopContinuousRecognitionAsync(
//         () => recognizer.startContinuousRecognitionAsync(() => {}, console.error),
//         console.error
//       );
//       if (!isBotSpeakingRef.current) flushSync(() => setPhase(PHASE.LISTENING));
//     };

//     recognizer.startContinuousRecognitionAsync(
//       () => console.log("STT started"),
//       (err) => console.error("STT error", err)
//     );
//   }

//   async function speakFirstWithAvatar(text) {
//     if (!text) {
//       startSTT();
//       return;
//     }
//     firstPendingRef.current = text;

//     const trySpeak = () => {
//       if (avatarRef.current?.isConnected?.() && avatarRef.current?.speak) {
//         const id = beginSpeakSessionGuard(firstPendingRef.current);
//         avatarSpeakingRef.current = true;
//         isBotSpeakingRef.current = true;
//         dbg("avatar.firstSpeak.try", { sessionId: id });
//         flushSync(() => {
//           setPhase(PHASE.BOT_SPEAKING);
//         });
//         avatarRef.current.speak(firstPendingRef.current);
//         firstSpokenRef.current = true;
//         firstPendingRef.current = "";
//         setTimeout(() => startSTT(), 50);
//         return true;
//       }
//       return false;
//     };

//     if (trySpeak()) return;

//     let attempts = 0;
//     const maxAttempts = 40; // ~8s
//     const id = setInterval(() => {
//       if (trySpeak() || ++attempts >= maxAttempts) {
//         clearInterval(id);
//         if (!firstSpokenRef.current) {
//           console.warn(
//             "Avatar did not connect in time. First message not spoken (avatar-only)."
//           );
//           startSTT();
//         }
//       }
//     }, 200);
//   }

//   const startInterview = async () => {
//     flushSync(() => setPhase(PHASE.THINKING));
//     setLoading(true);
//     try {
//       const resp = await axios.post(`${API_BASE}/api/hr/get-status-active`, {
//         UID: uuid,
//       });
//       const { jdText: jdTxt, cvText: cvTxt } = resp.data || {};
//       setCvText(cvTxt || "");
//       setJdText(jdTxt || "");

//       // Prepare fallback TTS
//       const key = import.meta.env.VITE_AZURE_SPEECH_KEY;
//       const region = import.meta.env.VITE_AZURE_SPEECH_REGION;
//       if (key && region) {
//         const ttsCfg = SpeechSDK.SpeechConfig.fromSubscription(key, region);
//         ttsCfg.speechSynthesisLanguage = "en-IN";
//         const ttsAudioCfg = SpeechSDK.AudioConfig.fromDefaultSpeakerOutput();
//         synthesizerRef.current = new SpeechSDK.SpeechSynthesizer(
//           ttsCfg,
//           ttsAudioCfg
//         );
//       }

//       // Get opening line
//       const { data } = await axios.post(`${API_BASE}/api/chat`, {
//         cv: cvTxt || "",
//         jd: jdTxt || "",
//         messages: [],
//       });

//       setHistory(data);
//       const first = data.slice(-1)?.[0]?.content || "";

//       setInterviewStarted(true);

//       try {
//         avatarRef.current?.start?.();
//       } catch (e) {
//         console.warn("Avatar start error:", e);
//       }
//       if (first) speakFirstWithAvatar(first);
//       else startSTT();
//     } catch (err) {
//       console.error("Start error:", err);
//       alert("Could not start interview. See console.");
//       flushSync(() => setPhase(PHASE.IDLE));
//     } finally {
//       setTimeout(() => setLoading(false), 6000);
//     }
//   };

//   const handleEndInterview = async () => {
//     try {
//       recognizerRef.current?.stopContinuousRecognitionAsync(
//         () => console.log("STT stopped"),
//         (err) => console.error(err)
//       );
//     } catch {}

//     if (discardSafetyTimerRef.current) {
//       clearTimeout(discardSafetyTimerRef.current);
//       discardSafetyTimerRef.current = null;
//     }
//     utteranceBufRef.current = "";
//     discardCurrentUtteranceRef.current = false;
//     bargedCollectingRef.current = false;
//     hadUserSpeechThisTurnRef.current = false;

//     clearInterval(timerRef.current);
//     await interruptBotNow();
//     try {
//       avatarRef.current?.stop?.();
//     } catch {}

//     const name = window.prompt("Please enter your name to save your transcript:");
//     if (!name) {
//       alert("Name is required to save your transcript.");
//       return;
//     }
//     try {
//       await axios.post(`${API_BASE}/api/chat/save`, {
//         name,
//         conversation: history,
//       });
//     } catch (err) {
//       console.error("Save error", err);
//       alert("Failed to save transcript & scorecard.");
//     }
//     setRecord(false);
//     flushSync(() => setPhase(PHASE.IDLE));
//     setTimeout(() => setInterviewStatus(true), 5000);
//   };

//   const closePopup = () => {
//     setShowPopup(false);
//     setRecord(true);
//     timerRef.current = setInterval(() => {
//       setTimeLeft((prevTime) => {
//         if (prevTime <= 1) {
//           clearInterval(timerRef.current);
//           setRecord(false);
//           return 0;
//         }
//         return prevTime - 1;
//       });
//     }, 1000);
//   };

//   useEffect(() => {
//     return () => {
//       try {
//         recognizerRef.current?.stopContinuousRecognitionAsync(() => {}, () => {});
//       } catch {}
//       try {
//         avatarRef.current?.stop?.();
//       } catch {}
//       try {
//         synthesizerRef.current?.close?.();
//       } catch {}
//       cancelInFlightLLM();
//       if (timerRef.current) clearInterval(timerRef.current);
//       if (microHoldTimerRef.current) clearTimeout(microHoldTimerRef.current);
//       if (discardSafetyTimerRef.current) clearTimeout(discardSafetyTimerRef.current);
//       clearSpeakWatchdog();
//       utteranceBufRef.current = "";
//       discardCurrentUtteranceRef.current = false;
//       bargedCollectingRef.current = false;
//       hadUserSpeechThisTurnRef.current = false;
//       avatarSpeakingRef.current = false;
//       ttsSpeakingRef.current = false;
//       isBotSpeakingRef.current = false;
//     };
//   }, []);

//   const handlePreventCopyPaste = (e) => {
//     e.preventDefault();
//     alert(`🔕Warning, "${e.type}" action is disabled!`);
//   };

//   const phaseMeta = useMemo(() => {
//     switch (phase) {
//       case PHASE.BARGE_IN:
//         return { label: "Barge-in", bg: "#FFF4E5", fg: "#8A4B00", icon: "⏹️" };
//       case PHASE.LISTENING:
//         return { label: "Listening", bg: "#E6F4EA", fg: "#137333", icon: "🎤" };
//       case PHASE.THINKING:
//         return { label: "Thinking", bg: "#E8F0FE", fg: "#174EA6", icon: "⌛" };
//       case PHASE.BOT_SPEAKING:
//         return { label: "Speaking", bg: "#FCE8E6", fg: "#B80606", icon: "🔊" };
//       default:
//         return { label: "Idle", bg: "#F1F3F4", fg: "#3C4043", icon: "⏸️" };
//     }
//   }, [phase]);

//   const StatusPill = () => (
//     <div
//       style={{
//         position: "absolute",
//         top: 12,
//         right: 12,
//         zIndex: 10,
//         display: "inline-flex",
//         gap: 8,
//         alignItems: "center",
//         padding: "6px 10px",
//         borderRadius: 999,
//         background: phaseMeta.bg,
//         color: phaseMeta.fg,
//         fontSize: 13,
//         fontWeight: 600,
//         boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
//         transform: bargeFlash ? "scale(1.06)" : "scale(1.0)",
//         transition: "transform 120ms ease",
//       }}
//       aria-live="polite"
//     >
//       <span>{phaseMeta.icon}</span>
//       <span>{phaseMeta.label}</span>
//       {phase === PHASE.THINKING && (
//         <span
//           className="spinner"
//           style={{
//             width: 12,
//             height: 12,
//             borderRadius: "50%",
//             border: "2px solid rgba(0,0,0,0.15)",
//             borderTopColor: phaseMeta.fg,
//             display: "inline-block",
//             animation: "spin 0.9s linear infinite",
//           }}
//         />
//       )}
//       {phase === PHASE.LISTENING && (
//         <span
//           className="pulse"
//           style={{
//             width: 10,
//             height: 10,
//             borderRadius: "50%",
//             background: phaseMeta.fg,
//             opacity: 0.9,
//             boxShadow: "0 0 0 0 rgba(19,115,51,0.7)",
//             animation: "pulse 1.4s infinite",
//           }}
//         />
//       )}
//     </div>
//   );

//   return (
//     <main
//       onPaste={handlePreventCopyPaste}
//       onCut={handlePreventCopyPaste}
//       style={{ height: "100vh", display: "flex", flexDirection: "column", position: "relative" }}
//     >
//       <style>{`
//         @keyframes spin { to { transform: rotate(360deg); } }
//         @keyframes pulse {
//           0% { box-shadow: 0 0 0 0 rgba(19,115,51,0.7); }
//           70% { box-shadow: 0 0 0 8px rgba(19,115,51,0); }
//           100% { box-shadow: 0 0 0 0 rgba(19,115,51,0); }
//         }
//       `}</style>

//       {loading && (
//         <div className="loading-overlay">
//           <div className="loading-spinner" />
//         </div>
//       )}

//       {/* Header */}
//       <div className="mainHeader" style={{ flex: "0 0 auto", position: "relative" }}>
//         <img className="mothersonLogo" src={mothersonLogo} alt="mothersonLogo" />
//         <div className="vertical-line"></div>
//         <h3 className="appName">Talent AI</h3>
//         <StatusPill />
//       </div>

//       {interviewStatus && <ThankYouPage />}

//       {!interviewStatus && (
//         <>
//           {showPopup && !interviewStarted && (
//             <InterviewInstruction
//               recordStatus={record}
//               closePopup={closePopup}
//               setShowPopup={setShowPopup}
//             />
//           )}

//           {/* 2/3 : 1/3 split */}
//           <div
//             style={{
//               flex: "1 1 auto",
//               display: "flex",
//               gap: 12,
//               background: "white",
//               padding: 12,
//               position: "relative",
//             }}
//           >
//             {/* Left: Avatar 2/3 */}
//             <div style={{ flex: 2, minWidth: 0, position: "relative" }}>
//               <AvatarPanel
//                 ref={avatarRef}
//                 captionAlign="center"
//                 captionMaxWidth={900}
//                 onSpeechStart={() => {
//                   isBotSpeakingRef.current = true;
//                   avatarSpeakingRef.current = true;
//                   dbg("avatar.onSpeechStart", {
//                     speakSessionId: speakSessionIdRef.current,
//                   });
//                   flushSync(() => setPhase(PHASE.BOT_SPEAKING));
//                 }}
//                 onSpeechEnd={() => {
//                   const id = speakSessionIdRef.current;
//                   dbg("avatar.onSpeechEnd", { lastSpeakSessionId: id });
//                   endSpeakSessionGuard(id);
//                 }}
//               />
//             </div>

//             {/* Right rail 1/3 */}
//             <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
//               <div style={{ flex: "0 0 auto", background: "white", borderRadius: 8, padding: 8 }}>
//                 <CameraRecorder
//                   setShowPopup={setShowPopup}
//                   recordStatus={record}
//                   setRecord={setRecord}
//                   timerRef={timerRef}
//                   startInterview={startInterview}
//                 />
//               </div>

//               <div style={{ flex: 1 }} />

//               <button
//                 className="interview-bot-end-interview-button"
//                 onClick={handleEndInterview}
//                 style={{ alignSelf: "stretch" }}
//               >
//                 End Interview
//               </button>
//             </div>
//           </div>
//         </>
//       )}
//     </main>
//   );
// }
