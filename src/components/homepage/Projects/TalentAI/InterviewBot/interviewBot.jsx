import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import "./interviewBot.css";
import CameraRecorder from "./cameraRecorder.jsx";
import mothersonLogo from "../assets_talentAI/motherson_logo.svg";
import ThankYouPage from "./thankYouPage.jsx";
import axios from "axios";
import * as SpeechSDK from "microsoft-cognitiveservices-speech-sdk";
import AvatarPanel from "./AvatarPanel";
import InterviewInstruction from "./interviewInstruction.jsx";

export default function InterviewBot() {
  const { uuid } = useParams();
  const avatarRef = useRef(null);

  const API_BASE = import.meta.env.VITE_TALENTAI_API_INTERVIEW_BASE_URL;

  const [loading, setLoading] = useState(false);
  const [cvText, setCvText] = useState("");
  const [jdText, setJdText] = useState("");

  const [started, setStarted] = useState(false);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [history, setHistory] = useState([]); // [{role,content}]
  const historyRef = useRef(history);

  const [timeLeft, setTimeLeft] = useState(1800);
  const timerRef = useRef(null);

  // STT
  const recognizerRef = useRef(null);
  const userSpeakingRef = useRef(false);
  const lastFinalRef = useRef("");

  // Fallback TTS (post-first message)
  const synthesizerRef = useRef(null);

  // First-message avatar-only control
  const firstPendingRef = useRef("");
  const firstSpokenRef = useRef(false);

  // End-page state
  const [record, setRecord] = useState(false);
  const [interviewStatus, setInterviewStatus] = useState(false);
  const [showPopup, setShowPopup] = useState(true);

  useEffect(() => {
    historyRef.current = history;
  }, [history]);

  function speakBot(text) {
    if (!text) return;
    if (avatarRef.current?.isConnected?.() && avatarRef.current?.speak) {
      avatarRef.current.speak(text);
      return;
    }
    if (synthesizerRef.current) {
      synthesizerRef.current.speakTextAsync(
        text,
        () => {},
        (err) => console.error("Fallback TTS failed:", err)
      );
    }
  }

  function stopBotSpeechNow() {
    try { avatarRef.current?.stopSpeaking?.(); } catch {}
    try { synthesizerRef.current?.stopSpeakingAsync?.(() => {}, () => {}); } catch {}
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
    speechConfig.setProperty(
      SpeechSDK.PropertyId.SpeechServiceConnection_EndSilenceTimeoutMs,
      "1200"
    );
    const audioCfg = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
    const recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioCfg);
    recognizerRef.current = recognizer;

    recognizer.recognizing = (_, e) => {
      const partial = (e?.result?.text || "").trim();
      if (!partial) return;
      if (!userSpeakingRef.current) {
        userSpeakingRef.current = true;
        stopBotSpeechNow(); // barge-in
      }
    };

    recognizer.recognized = async (_, e) => {
      if (e.result.reason !== SpeechSDK.ResultReason.RecognizedSpeech) return;
      const finalText = (e.result.text || "").trim();
      if (!finalText) {
        userSpeakingRef.current = false;
        return;
      }

      if (finalText === lastFinalRef.current) {
        userSpeakingRef.current = false;
        return;
      }
      lastFinalRef.current = finalText;
      userSpeakingRef.current = false;

      setHistory((h) => [...h, { role: "user", content: finalText }]);

      try {
        const { data: newHist } = await axios.post(`${API_BASE}/api/chat`, {
          messages: [...historyRef.current, { role: "user", content: finalText }],
          userText: finalText,
        });
        setHistory(newHist);
        const reply = newHist.slice(-1)?.[0]?.content || "";
        if (reply) speakBot(reply);
      } catch (err) {
        console.error("LLM error:", err);
      }
    };

    recognizer.startContinuousRecognitionAsync(
      () => console.log("STT started"),
      (err) => console.error("STT error", err)
    );
  }

  async function speakFirstWithAvatar(text) {
    if (!text) return;
    firstPendingRef.current = text;

    const trySpeak = () => {
      if (avatarRef.current?.isConnected?.() && avatarRef.current?.speak) {
        avatarRef.current.speak(firstPendingRef.current);
        firstSpokenRef.current = true;
        firstPendingRef.current = "";
        setTimeout(() => startSTT(), 50); // mic after avatar begins
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
        }
      }
    }, 200);
  }

  const startInterview = async () => {
    setLoading(true);
    try {
      const resp = await axios.post(`${API_BASE}/api/hr/get-status-active`, { UID: uuid });
      const { jdText: jdTxt, cvText: cvTxt } = resp.data || {};
      setCvText(cvTxt || "");
      setJdText(jdTxt || "");

      const key = import.meta.env.VITE_AZURE_SPEECH_KEY;
      const region = import.meta.env.VITE_AZURE_SPEECH_REGION;
      if (key && region) {
        const ttsCfg = SpeechSDK.SpeechConfig.fromSubscription(key, region);
        ttsCfg.speechSynthesisLanguage = "en-IN";
        const ttsAudioCfg = SpeechSDK.AudioConfig.fromDefaultSpeakerOutput();
        synthesizerRef.current = new SpeechSDK.SpeechSynthesizer(ttsCfg, ttsAudioCfg);
      }

      const { data } = await axios.post(`${API_BASE}/api/chat`, {
        cv: cvTxt || "",
        jd: jdTxt || "",
        messages: [],
      });
      setHistory(data);
      const first = data.slice(-1)?.[0]?.content || "";

      setStarted(true);
      setInterviewStarted(true);

      try { avatarRef.current?.start?.(); } catch (e) { console.warn("Avatar start error:", e); }
      if (first) speakFirstWithAvatar(first);
    } catch (err) {
      console.error("Start error:", err);
      alert("Could not start interview. See console.");
    } finally {
      setTimeout(() => setLoading(false), 6000);
    }
  };

  const handleEndInterview = async () => {
    recognizerRef.current?.stopContinuousRecognitionAsync(
      () => console.log("STT stopped"),
      (err) => console.error(err)
    );
    clearInterval(timerRef.current);
    stopBotSpeechNow();
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
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handlePreventCopyPaste = (e) => {
    e.preventDefault();
    alert(`🔕Warning, "${e.type}" action is disabled!`);
  };

  return (
    <main
      onPaste={handlePreventCopyPaste}
      onCut={handlePreventCopyPaste}
      style={{ height: "100vh", display: "flex", flexDirection: "column" }}
    >
      {loading && (
        <div className="loading-overlay"><div className="loading-spinner" /></div>
      )}

      {/* Header */}
      <div className="mainHeader" style={{ flex: "0 0 auto" }}>
        <img className="mothersonLogo" src={mothersonLogo} alt="mothersonLogo" />
        <div className="vertical-line"></div>
        <h3 className="appName">Talent AI</h3>
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
            }}
          >
            {/* Left: Avatar 2/3 */}
            <div style={{ flex: 2, minWidth: 0 }}>
              <AvatarPanel
  ref={avatarRef}
  captionAlign="center"
  captionMaxWidth={900}
/>

            </div>

            {/* Right: rail 1/3 (Camera top, End button bottom) */}
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: 12,
                //minWidth: 200,
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

              <div style={{ flex: 1 }} /> {/* Spacer pushes button to bottom */}

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
