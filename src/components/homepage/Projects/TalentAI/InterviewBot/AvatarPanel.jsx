import React, { forwardRef, useImperativeHandle, useRef, useState, useEffect } from "react";
import * as SpeechSDK from "microsoft-cognitiveservices-speech-sdk";

/**
 * AvatarPanel (hardened)
 * - Deterministic speech start/end with session guards
 * - Captions queued until actual audio playback ("playing")
 * - Watchdogs for missing media events and SDK callbacks
 * - Idempotent teardown; safe across rapid start/stop and barge-in
 * - Public API (via ref): start(), stop(), speak(text):Promise<void>, stopSpeaking():Promise<void>,
 *   isConnected(), isSpeaking(), setCaption(text), clearCaption()
 */
const AvatarPanel = forwardRef(
  (
    {
      showCaptions = true,
      typewriter = false,
      typewriterSpeedMs = 18,
      onSpeechStart,
      onSpeechEnd,
      onConnected, // after avatar session starts
      onFirstFrame, // first audio/video frame plays
      fit = "cover", // "cover" | "contain"
      captionAlign = "center", // "left" | "center" | "right"
      captionMaxWidth = 900, // px
    },
    ref
  ) => {
    // ====== Connection & media handles ======
    const [connected, setConnected] = useState(false);
    const containerRef = useRef(null);
    const avatarSynthRef = useRef(null);
    const pcRef = useRef(null);

    // ====== Caption state ======
    const [captionFull, setCaptionFull] = useState("");
    const [captionLive, setCaptionLive] = useState("");
    const typewriterTimerRef = useRef(null);

    // ====== Speech/session state ======
    const speakingRef = useRef(false); // true while avatar audio is actually playing
    const endedLatchRef = useRef(true); // prevents duplicate onSpeechEnd
    const firstFrameSeenRef = useRef(false); // ensures onFirstFrame runs only once per session

    // Speech session guard to ignore stale events
    const speakSessionIdRef = useRef(0);

    // Pending caption & watchdog (if audio "playing" is late)
    const pendingCaptionRef = useRef("");
    const pendingWatchdogRef = useRef(null);

    // Global speech watchdog (SLA backstop)
    const speechWatchdogRef = useRef(null);

    useEffect(() => {
      return () => {
        // component unmount cleanup
        clearTypewriter();
        clearPendingWatchdog();
        clearSpeechWatchdog();
        tryStopSpeakingNoThrow();
        tryCloseSynthNoThrow();
        tryClosePcNoThrow();
      };
    }, []);

    // ====== Helpers: caption handling ======
    function clearTypewriter() {
      if (typewriterTimerRef.current) {
        clearInterval(typewriterTimerRef.current);
        typewriterTimerRef.current = null;
      }
    }
    function setCaptionInstant(text) {
      if (!showCaptions) return;
      clearTypewriter();
      setCaptionFull(text || "");
      setCaptionLive(text || "");
    }
    function setCaptionTypewriter(text) {
      if (!showCaptions) return;
      clearTypewriter();
      setCaptionFull(text || "");
      setCaptionLive("");
      if (!text) return;
      typewriterTimerRef.current = setInterval(() => {
        setCaptionLive((prev) => {
          const next = text.slice(0, prev.length + 1);
          if (next.length >= text.length) {
            clearTypewriter();
          }
          return next;
        });
      }, Math.max(5, typewriterSpeedMs));
    }
    function clearCaption() {
      clearTypewriter();
      setCaptionFull("");
      setCaptionLive("");
    }

    // ====== Helpers: watchdogs ======
    function clearPendingWatchdog() {
      if (pendingWatchdogRef.current) {
        clearTimeout(pendingWatchdogRef.current);
        pendingWatchdogRef.current = null;
      }
    }
    function clearSpeechWatchdog() {
      if (speechWatchdogRef.current) {
        clearTimeout(speechWatchdogRef.current);
        speechWatchdogRef.current = null;
      }
    }
    function beginSpeechWatchdog(text, sessionId) {
      clearSpeechWatchdog();
      // ~160wpm → ~375ms/word, with floor/ceiling + buffer
      const est = Math.min(30000, Math.max(1200, text.split(/\s+/).filter(Boolean).length * 375 + 800));
      speechWatchdogRef.current = setTimeout(() => {
        if (speakSessionIdRef.current === sessionId && speakingRef.current) {
          // Force end if media callbacks were missed
          maybeFireSpeechEnd(sessionId);
        }
      }, est);
    }

    // ====== Public API ======
    useImperativeHandle(ref, () => ({
      start: startSession,
      stop: stopSession,
      speak: speakText,
      stopSpeaking: stopSpeakingNow,
      isConnected: () => connected,
      isSpeaking: () => speakingRef.current,
      setCaption: (t) => setCaptionInstant(t),
      clearCaption: () => clearCaption(),
    }));

    // ====== Session lifecycle ======
    async function startSession() {
      try {
        const region = import.meta.env.VITE_AZURE_SPEECH_REGION;
        const apiKey = import.meta.env.VITE_AZURE_SPEECH_KEY;
        if (!region || !apiKey) {
          console.error("Missing VITE_AZURE_SPEECH_REGION / VITE_AZURE_SPEECH_KEY");
          return;
        }

        // Tear down any prior session first
        await stopSpeakingNow();
        tryCloseSynthNoThrow();
        tryClosePcNoThrow();
        firstFrameSeenRef.current = false;

        const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(apiKey, region);
        // Choose your preferred voice (keep aligned with backend expectations)
        speechConfig.speechSynthesisVoiceName = "en-US-GuyNeural";

        const avatarCfg = new SpeechSDK.AvatarConfig("Max", "business");
        avatarCfg.useBuiltInVoice = false; // use the voice set above
        avatarCfg.customized = false;

        const synth = new SpeechSDK.AvatarSynthesizer(speechConfig, avatarCfg);
        avatarSynthRef.current = synth;

        // Relay token for ICE servers
        const tokenRes = await fetch(
          `https://${region}.tts.speech.microsoft.com/cognitiveservices/avatar/relay/token/v1`,
          { headers: { "Ocp-Apim-Subscription-Key": apiKey } }
        );
        if (!tokenRes.ok) {
          console.error("Relay token fetch failed:", tokenRes.status);
          return;
        }
        const token = await tokenRes.json();
        const urls = Array.isArray(token?.Urls) ? token.Urls : [];
        if (!urls.length) {
          console.error("No ICE URLs returned");
          return;
        }

        const pc = new RTCPeerConnection({
          iceServers: [{ urls, username: token.Username, credential: token.Password }],
        });
        pcRef.current = pc;

        // Bidirectional A/V
        pc.addTransceiver("video", { direction: "sendrecv" });
        pc.addTransceiver("audio", { direction: "sendrecv" });

        // Media handlers
        pc.ontrack = (event) => {
          const container = containerRef.current;
          if (!container) return;

          if (event.track.kind === "video") {
            container.querySelectorAll("video").forEach((el) => el.remove());
            const v = document.createElement("video");
            v.autoplay = true;
            v.playsInline = true;
            v.muted = false;
            v.srcObject = event.streams[0];
            v.style.width = "100%";
            v.style.height = "100%";
            v.style.objectFit = fit === "contain" ? "contain" : "cover";
            v.addEventListener("playing", () => {
              if (!firstFrameSeenRef.current) {
                firstFrameSeenRef.current = true;
                onFirstFrame?.();
              }
            });
            container.appendChild(v);
          }

          if (event.track.kind === "audio") {
            container.querySelectorAll("audio").forEach((a) => a.remove());
            const a = document.createElement("audio");
            a.autoplay = true;
            a.muted = false;
            a.srcObject = event.streams[0];

            a.addEventListener("playing", () => {
              if (!firstFrameSeenRef.current) {
                firstFrameSeenRef.current = true;
                onFirstFrame?.();
              }
              // Real audio started → definitive start (guarded)
              const sid = speakSessionIdRef.current;
              speakingRef.current = true;
              endedLatchRef.current = false;
              safeFireSpeechStart();
              // Push pending caption now
              const pending = pendingCaptionRef.current;
              clearPendingWatchdog();
              if (pending) {
                typewriter ? setCaptionTypewriter(pending) : setCaptionInstant(pending);
              }
            });

            const maybeEnded = () => {
              const sid = speakSessionIdRef.current;
              maybeFireSpeechEnd(sid);
            };

            a.addEventListener("ended", maybeEnded);
            a.addEventListener("pause", maybeEnded);
            a.addEventListener("emptied", maybeEnded);

            container.appendChild(a);
          }
        };

        await synth.startAvatarAsync(pc);
        setConnected(true);
        onConnected?.();
      } catch (e) {
        console.error("Avatar startSession error:", e);
      }
    }

    // ====== Speech controls ======
    function safeFireSpeechStart() {
      try {
        onSpeechStart?.();
      } catch (e) {
        console.warn("onSpeechStart handler error", e);
      }
    }

    function maybeFireSpeechEnd(sessionId) {
      // Ignore stale ends
      if (sessionId !== speakSessionIdRef.current) return;
      if (!endedLatchRef.current) {
        endedLatchRef.current = true;
        speakingRef.current = false;
        clearPendingWatchdog();
        clearSpeechWatchdog();
        try {
          onSpeechEnd?.();
        } catch (e) {
          console.warn("onSpeechEnd handler error", e);
        }
      }
    }

    /**
     * Speak text. Returns a Promise that resolves when SDK signals completion
     * (or earlier if media events already ended). Session-guarded to avoid
     * late callbacks from prior utterances interfering with the latest.
     */
    function speakText(text) {
      return new Promise((resolve) => {
        try {
          if (!avatarSynthRef.current || !text) return resolve();

          const sessionId = ++speakSessionIdRef.current;

          // Queue caption (rendered on audio playing)
          pendingCaptionRef.current = text;
          clearPendingWatchdog();
          pendingWatchdogRef.current = setTimeout(() => {
            // If playing didn't happen quickly, still show caption
            if (pendingCaptionRef.current === text) {
              typewriter ? setCaptionTypewriter(text) : setCaptionInstant(text);
            }
            pendingWatchdogRef.current = null;
          }, 600);

          // Optimistic start; true start on audio "playing"
          speakingRef.current = true;
          endedLatchRef.current = false;
          safeFireSpeechStart();

          beginSpeechWatchdog(text, sessionId);

          avatarSynthRef.current.speakTextAsync(
            text,
            () => {
              // SDK completed for this session (may precede media end)
              maybeFireSpeechEnd(sessionId);
              if (pendingCaptionRef.current === text) pendingCaptionRef.current = "";
              clearPendingWatchdog();
              resolve();
            },
            (err) => {
              console.error("Avatar speak error", err);
              maybeFireSpeechEnd(sessionId);
              if (pendingCaptionRef.current === text) pendingCaptionRef.current = "";
              clearPendingWatchdog();
              resolve();
            }
          );
        } catch (e) {
          console.error("speakText error:", e);
          resolve();
        }
      });
    }

    function stopSpeakingNow() {
      return new Promise((resolve) => {
        try {
          const done = () => {
            const sid = speakSessionIdRef.current;
            maybeFireSpeechEnd(sid);
            pendingCaptionRef.current = ""; // drop any queued caption
            clearPendingWatchdog();
            resolve();
          };
          if (avatarSynthRef.current?.stopSpeakingAsync) {
            avatarSynthRef.current.stopSpeakingAsync(
              done,
              (e) => {
                console.warn("stopSpeakingAsync error", e);
                done();
              }
            );
          } else {
            done();
          }
        } catch (e) {
          console.error("stopSpeakingNow error:", e);
          resolve();
        }
      });
    }

    async function stopSession() {
      try {
        await stopSpeakingNow();
        tryCloseSynthNoThrow();
        tryClosePcNoThrow();
        setConnected(false);
        speakingRef.current = false;
        endedLatchRef.current = true;
        firstFrameSeenRef.current = false;
        pendingCaptionRef.current = "";
        clearPendingWatchdog();
        clearSpeechWatchdog();
        if (containerRef.current) containerRef.current.innerHTML = "";
        clearCaption();
      } catch (e) {
        console.error("stopSession error:", e);
      }
    }

    // ====== Low-level cleanup helpers ======
    function tryCloseSynthNoThrow() {
      try {
        avatarSynthRef.current?.close?.();
      } catch {}
      avatarSynthRef.current = null;
    }
    function tryClosePcNoThrow() {
      try {
        pcRef.current?.getSenders?.().forEach((s) => s.track && s.track.stop && s.track.stop());
        pcRef.current?.close?.();
      } catch {}
      pcRef.current = null;
    }
    function tryStopSpeakingNoThrow() {
      try {
        avatarSynthRef.current?.stopSpeakingAsync?.(() => {}, () => {});
      } catch {}
    }

    // ====== UI ======
    const textAlign = captionAlign === "right" ? "right" : captionAlign === "center" ? "center" : "left";

    return (
      <div style={{ padding: 10, height: "100%", width: "100%" }}>
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            background: "white",
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          <div ref={containerRef} style={{ position: "absolute", inset: 0 }} />

          {showCaptions && (captionLive || captionFull) && (
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                padding: "10px 14px",
                display: "flex",
                justifyContent: "center",
                background:
                  "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.55) 38%, rgba(0,0,0,0.75) 100%)",
              }}
            >
              <div
                style={{
                  maxWidth: captionMaxWidth,
                  width: "100%",
                  color: "white",
                  fontSize: 16,
                  lineHeight: "20px",
                  textShadow: "0 1px 2px rgba(0,0,0,0.7)",
                  userSelect: "text",
                  whiteSpace: "pre-wrap",
                  textAlign, // center / left / right
                }}
              >
                {typewriter ? captionLive : captionFull}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
);

export default AvatarPanel;
