import React, { forwardRef, useImperativeHandle, useRef, useState, useEffect } from "react";
import * as SpeechSDK from "microsoft-cognitiveservices-speech-sdk";

const AvatarPanel = forwardRef(
  (
    {
      showCaptions = true,
      typewriter = false,
      typewriterSpeedMs = 18,
      onSpeechStart,
      onSpeechEnd,
      onConnected,            // after avatar session starts
      onFirstFrame,           // first audio/video frame plays
      fit = "cover",          // "cover" | "contain"
      captionAlign = "center",// "left" | "center" | "right"
      captionMaxWidth = 900,  // px
    },
    ref
  ) => {
    const [connected, setConnected] = useState(false);

    const containerRef = useRef(null);
    const avatarSynthRef = useRef(null);
    const pcRef = useRef(null);

    const [captionFull, setCaptionFull] = useState("");
    const [captionLive, setCaptionLive] = useState("");
    const typewriterTimerRef = useRef(null);

    // Speaking / media-state latches
    const speakingRef = useRef(false);       // true while avatar audio is actually playing
    const endedLatchRef = useRef(true);      // prevents duplicate onSpeechEnd
    const firstFrameSeenRef = useRef(false); // ensures onFirstFrame runs only once per session

    // NEW: queue caption so it appears when audio starts
    const pendingCaptionRef = useRef("");
    const pendingWatchdogRef = useRef(null);

    // Expose controls to parent via ref
    useImperativeHandle(ref, () => ({
      start: startSession,
      speak: speakText,
      stop: stopSession,
      stopSpeaking: stopSpeakingNow,      // returns Promise<void>
      isConnected: () => connected,
      isSpeaking: () => speakingRef.current,
      setCaption: (t) => setCaptionInstant(t),
      clearCaption: () => clearCaption(),
    }));

    useEffect(() => {
      return () => {
        if (typewriterTimerRef.current) clearInterval(typewriterTimerRef.current);
        clearWatchdog();
      };
    }, []);

    // ---------- Caption helpers ----------
    function clearWatchdog() {
      if (pendingWatchdogRef.current) {
        clearTimeout(pendingWatchdogRef.current);
        pendingWatchdogRef.current = null;
      }
    }

    function setCaptionInstant(text) {
      if (!showCaptions) return;
      if (typewriterTimerRef.current) {
        clearInterval(typewriterTimerRef.current);
        typewriterTimerRef.current = null;
      }
      setCaptionFull(text || "");
      setCaptionLive(text || "");
    }

    function setCaptionTypewriter(text) {
      if (!showCaptions) return;
      if (typewriterTimerRef.current) {
        clearInterval(typewriterTimerRef.current);
        typewriterTimerRef.current = null;
      }
      setCaptionFull(text || "");
      setCaptionLive("");
      if (!text) return;
      typewriterTimerRef.current = setInterval(() => {
        setCaptionLive((prev) => {
          const next = text.slice(0, prev.length + 1);
          if (next.length >= text.length) {
            clearInterval(typewriterTimerRef.current);
            typewriterTimerRef.current = null;
          }
          return next;
        });
      }, Math.max(5, typewriterSpeedMs));
    }

    function clearCaption() {
      if (typewriterTimerRef.current) {
        clearInterval(typewriterTimerRef.current);
        typewriterTimerRef.current = null;
      }
      setCaptionFull("");
      setCaptionLive("");
      // do not touch pending here—only when stopping speech/session
    }

    // ---------- Session lifecycle ----------
    async function startSession() {
      try {
        const region = import.meta.env.VITE_AZURE_SPEECH_REGION;
        const apiKey = import.meta.env.VITE_AZURE_SPEECH_KEY;
        if (!region || !apiKey) {
          console.error("Missing VITE_AZURE_SPEECH_REGION / VITE_AZURE_SPEECH_KEY");
          return;
        }

        const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(apiKey, region);

        // Basic avatar config – adjust model/posture as needed
        const avatarCfg = new SpeechSDK.AvatarConfig("lisa", "casual-sitting");
        avatarCfg.useBuiltInVoice = true;
        avatarCfg.customized = false;

        avatarSynthRef.current = new SpeechSDK.AvatarSynthesizer(speechConfig, avatarCfg);

        // ICE server token for relay (Azure)
        const tokenRes = await fetch(
          `https://${region}.tts.speech.microsoft.com/cognitiveservices/avatar/relay/token/v1`,
          { headers: { "Ocp-Apim-Subscription-Key": apiKey } }
        );
        if (!tokenRes.ok) {
          console.error("Relay token fetch failed:", tokenRes.status);
          return;
        }
        const { Urls, Username, Password } = await tokenRes.json();
        if (!Urls?.length) {
          console.error("No ICE URLs returned");
          return;
        }

        if (typeof RTCPeerConnection === "undefined") {
          console.error("RTCPeerConnection not available in this environment");
          return;
        }

        const pc = new RTCPeerConnection({
          iceServers: [{ urls: [Urls[0]], username: Username, credential: Password }],
        });

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
                onFirstFrame?.(); // first decoded frame (video)
              }
            });

            container.appendChild(v);
          } else if (event.track.kind === "audio") {
            container.querySelectorAll("audio").forEach((a) => a.remove());
            const a = document.createElement("audio");
            a.autoplay = true;
            a.muted = false;
            a.srcObject = event.streams[0];

            a.addEventListener("playing", () => {
              if (!firstFrameSeenRef.current) {
                firstFrameSeenRef.current = true;
                onFirstFrame?.(); // first decoded frame (audio)
              }
              // Real audio started → mark speaking + fire start once
              speakingRef.current = true;
              endedLatchRef.current = false;
              onSpeechStart?.();

              // PUSH PENDING CAPTION NOW
              const pending = pendingCaptionRef.current;
              clearWatchdog(); // cancel any watchdog timer
              if (pending) {
                if (typewriter) setCaptionTypewriter(pending);
                else setCaptionInstant(pending);
              }
            });

            // End playback – debounce duplicate ends
            const endOnce = () => {
              if (!endedLatchRef.current) {
                endedLatchRef.current = true;
                speakingRef.current = false;
                onSpeechEnd?.();
                // optional: keep the last caption visible; clear only on next speak/stop
              }
            };
            a.addEventListener("ended", endOnce);
            // (optional) a.addEventListener("pause", endOnce);

            container.appendChild(a);
          }
        };

        pcRef.current = pc;

        await avatarSynthRef.current.startAvatarAsync(pc);
        setConnected(true);
        onConnected?.();
      } catch (e) {
        console.error("Avatar startSession error:", e);
      }
    }

    // DO NOT RENDER CAPTIONS HERE — queue them and wait for audio 'playing'
    function speakText(text) {
      try {
        if (!avatarSynthRef.current || !text) return;

        // Queue the caption first (so it's definitely set before audio starts)
        pendingCaptionRef.current = text;

        // Watchdog: if 'playing' doesn't arrive in time (e.g., stream reuse), show anyway
        clearWatchdog();
        pendingWatchdogRef.current = setTimeout(() => {
          // show caption to avoid "missing captions"
          if (pendingCaptionRef.current) {
            if (typewriter) setCaptionTypewriter(pendingCaptionRef.current);
            else setCaptionInstant(pendingCaptionRef.current);
          }
          pendingWatchdogRef.current = null;
        }, 600); // tweak if you want longer/shorter grace

        // Optimistic start; definitive start comes from audio 'playing'
        speakingRef.current = true;
        endedLatchRef.current = false;
        onSpeechStart?.();

        avatarSynthRef.current.speakTextAsync(
          text,
          () => {
            // SDK ended; ensure single onSpeechEnd
            if (!endedLatchRef.current) {
              endedLatchRef.current = true;
              speakingRef.current = false;
              onSpeechEnd?.();
            }
            // clear the pending text after success (caption stays until next speak)
            pendingCaptionRef.current = "";
            clearWatchdog();
          },
          (err) => {
            console.error("Avatar speak error", err);
            if (!endedLatchRef.current) {
              endedLatchRef.current = true;
              speakingRef.current = false;
              onSpeechEnd?.();
            }
            // prevent stale caption from appearing later
            pendingCaptionRef.current = "";
            clearWatchdog();
          }
        );
      } catch (e) {
        console.error("speakText error:", e);
      }
    }

    // Promise-returning stop so callers can await clean cancel
    function stopSpeakingNow() {
      return new Promise((resolve) => {
        try {
          const done = () => {
            if (!endedLatchRef.current) {
              endedLatchRef.current = true;
              speakingRef.current = false;
              onSpeechEnd?.();
            }
            // cancel any caption that hasn’t shown yet
            pendingCaptionRef.current = "";
            clearWatchdog();
            resolve();
          };
          if (avatarSynthRef.current?.stopSpeakingAsync) {
            avatarSynthRef.current.stopSpeakingAsync(
              done,
              (e) => { console.warn("stopSpeakingAsync error", e); done(); }
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

    function stopSession() {
      try {
        // fire-and-forget; caller may also await via ref.stopSpeaking()
        stopSpeakingNow();
        avatarSynthRef.current?.close();
        pcRef.current?.close();
        setConnected(false);
        speakingRef.current = false;
        endedLatchRef.current = true;
        firstFrameSeenRef.current = false;
        pendingCaptionRef.current = "";
        clearWatchdog();
        if (containerRef.current) containerRef.current.innerHTML = "";
        clearCaption();
      } catch (e) {
        console.error("stopSession error:", e);
      }
    }

    // Caption alignment mapping
    const textAlign =
      captionAlign === "right" ? "right" : captionAlign === "center" ? "center" : "left";

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
