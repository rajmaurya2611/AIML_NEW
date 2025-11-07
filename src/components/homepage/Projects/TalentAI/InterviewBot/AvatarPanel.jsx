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
      fit = "cover",
      // NEW:
      captionAlign = "center",     // "left" | "center" | "right"
      captionMaxWidth = 900,       // px
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

    useImperativeHandle(ref, () => ({
      start: startSession,
      speak: speakText,
      stop: stopSession,
      stopSpeaking: stopSpeakingNow,
      isConnected: () => connected,
      setCaption: (t) => setCaptionInstant(t),
      clearCaption: () => clearCaption(),
    }));

    useEffect(() => {
      return () => {
        if (typewriterTimerRef.current) clearInterval(typewriterTimerRef.current);
      };
    }, []);

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
    }

    async function startSession() {
      try {
        const region = import.meta.env.VITE_AZURE_SPEECH_REGION;
        const apiKey = import.meta.env.VITE_AZURE_SPEECH_KEY;
        if (!region || !apiKey) {
          console.error("Missing VITE_AZURE_SPEECH_REGION / VITE_AZURE_SPEECH_KEY");
          return;
        }

        const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(apiKey, region);

        const avatarCfg = new SpeechSDK.AvatarConfig("lisa", "casual-sitting");
        avatarCfg.useBuiltInVoice = true;
        avatarCfg.customized = false;

        avatarSynthRef.current = new SpeechSDK.AvatarSynthesizer(speechConfig, avatarCfg);

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
          console.error("RTCPeerConnection not available");
          return;
        }

        const pc = new RTCPeerConnection({
          iceServers: [{ urls: [Urls[0]], username: Username, credential: Password }],
        });

        pc.addTransceiver("video", { direction: "sendrecv" });
        pc.addTransceiver("audio", { direction: "sendrecv" });

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
            container.appendChild(v);
          } else if (event.track.kind === "audio") {
            container.querySelectorAll("audio").forEach((a) => a.remove());
            const a = document.createElement("audio");
            a.autoplay = true;
            a.muted = false;
            a.srcObject = event.streams[0];
            container.appendChild(a);
          }
        };

        pcRef.current = pc;
        await avatarSynthRef.current.startAvatarAsync(pc);
        setConnected(true);
      } catch (e) {
        console.error("Avatar startSession error:", e);
      }
    }

    function speakText(text) {
      try {
        if (!avatarSynthRef.current || !text) return;
        if (typewriter) setCaptionTypewriter(text);
        else setCaptionInstant(text);

        onSpeechStart?.();
        avatarSynthRef.current.speakTextAsync(
          text,
          () => onSpeechEnd?.(),
          (err) => {
            console.error("Avatar speak error", err);
            onSpeechEnd?.();
          }
        );
      } catch (e) {
        console.error("speakText error:", e);
      }
    }

    function stopSpeakingNow() {
      try {
        avatarSynthRef.current?.stopSpeakingAsync?.(
          () => onSpeechEnd?.(),
          (e) => console.warn("stopSpeakingAsync error", e)
        );
      } catch (e) {
        console.error("stopSpeakingNow error:", e);
      }
    }

    function stopSession() {
      try {
        stopSpeakingNow();
        avatarSynthRef.current?.close();
        pcRef.current?.close();
        setConnected(false);
        if (containerRef.current) containerRef.current.innerHTML = "";
        clearCaption();
      } catch (e) {
        console.error("stopSession error:", e);
      }
    }

    // Map prop to CSS textAlign
    const textAlign =
      captionAlign === "right" ? "right" : captionAlign === "center" ? "center" : "left";

    return (
      <div style={{ border: "", padding: 10, height: "100%", width: "100%" }}>
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
                // center the caption *block*
                display: "flex",
                justifyContent: "center",
                background:
                  "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.55) 38%, rgba(0,0,0,0.75) 100%)",
              }}
            >
              <div
                style={{
                  // limit line length and center it
                  maxWidth: captionMaxWidth,
                  width: "100%",
                  color: "white",
                  fontSize: 16,
                  lineHeight: "20px",
                  textShadow: "0 1px 2px rgba(0,0,0,0.7)",
                  userSelect: "text",
                  whiteSpace: "pre-wrap",
                  textAlign,               // <-- center / left / right
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
