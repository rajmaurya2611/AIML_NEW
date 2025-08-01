import { useState, useEffect, useMemo, useRef } from "react";
import MainHeader from "../MainHeader";
import Sidebar from "../Sidebar";
import InterviewInstruction from "./interviewInstruction.jsx";
import "./interviewBot.css";
import clock from "../assets_talentAI/clock.svg";
import aiImage from "../assets_talentAI/cartoon-ai.png";
import sendButton from "../assets_talentAI/send-button.png";
import avatar from "../assets_talentAI/avatar.svg";
import CameraRecorder from "./cameraRecorder";
import Instructions from "../assets_talentAI/instructions.png";
import mothersonLogo from "../assets_talentAI/motherson_logo.svg";
import ThankYouPage from "./thankYouPage.jsx";
// import Header from "../../components/Header/Header";
// import { askLlm } from "../services/llmService";
import axios from "axios";
// after your other imports
import * as SpeechSDK from "microsoft-cognitiveservices-speech-sdk";
import MessageList  from "./MessageList";
import MessageInput from "./MessageInput";

export default function InterviewBot() {

  const API_BASE = import.meta.env.VITE_TALENTAI_API_INTERVIEW_BASE_URL;

  
  // holds { role, content } objects
  const [messages, setMessages] = useState([]);
  // disable UI while waiting
  const [loading, setLoading] = useState(false);

  // raw File objects selected by the user
  const [cvFile, setCvFile] = useState(null);
  const [jdFile, setJdFile] = useState(null);

  // plain-text extracted from those PDFs
  const [cvText, setCvText] = useState("");
  const [jdText, setJdText] = useState("");

  // interview state
  const [started, setStarted] = useState(false);
  // added interviewStarted state
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [history, setHistory] = useState([]);
  const historyRef = useRef(history);
  const [botSpeech, setBotSpeech] = useState("");
  const [input, setInput] = useState("");
  const [timeLeft, setTimeLeft] = useState(1800);
  const timerRef = useRef(null);

  // STT
  const recognizerRef = useRef(null);
  const bufRef = useRef("");
  const pauseTimer = useRef(null);
  const [speechCreds, setSpeechCreds] = useState(null);

  // TTS synthesizer ref
  const synthesizerRef = useRef(null);

  // useEffect(() => {
  //   fetch("/api/speech/token")
  //     .then(r => r.json())
  //     .then(setSpeechCreds)
  //     .catch(console.error);
  // }, []);

  useEffect(() => {
    historyRef.current = history;
  }, [history]);

  useEffect(() => {
    if (!started) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => Math.max(t - 1, 0));
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [started]);

  // Lift files & start interview
  const handleAcceptAndUpload = (cv, jd) => {
    setCvFile(cv);
    setJdFile(jd);
    startInterview(cv, jd);
  };

  // CV and JD upload buttons related code here 
  const uploadCvButton = useRef(null);
  const uploadJdButton = useRef(null);
  
  const [cvUploadFileName,setCvUploadFileName] = useState("");
  const [jdUploadFileName,setJdUploadFileName] = useState("");

  const handleCvUploadInput = ()=>{
    uploadCvButton.current.click();
  }
  const handleJdUploadInput = ()=>{
     uploadJdButton.current.click();

  }
  const handleCvFileChange = (e) => {
    setCvFile(e.target.files?.[0] || null)
    setCvUploadFileName(e.target.files?.[0]?.name || "");

  };
  const handleJdFileChange = (e) => {
    setJdFile(e.target.files?.[0] || null)
    setJdUploadFileName(e.target.files?.[0]?.name || "");
  }
  // Core interview start logic (extracting text, STT, LLM, etc.)
  const startInterview = async (cvArg, jdArg) => {
    setLoading(true);
    try {
      // 1) extract text
      const form = new FormData();
      form.append("cv", cvArg);
      form.append("jd", jdArg);
      const {
        data: { cvText, jdText },
      } = await axios.post(`${API_BASE}/api/upload`, form);
      setCvText(cvText);
      setJdText(jdText);

      // 2) initial chat prompt
      const { data } = await axios.post(`${API_BASE}/api/chat`, {
        cv: cvText,
        jd: jdText,
        messages: [],
      });
      setHistory(data);
      const first = data.slice(-1)[0].content;
      setMessages([{ sender: "HR Bot", text: first }]);
      setBotSpeech(first);

      // speak the first prompt
      synthesizerRef.current?.speakTextAsync(
        first,
        () => console.log("TTS finished"),
        err => console.error("TTS failed:", err)
      );

      setStarted(true);

      // 3) Azure STT (assuming SpeechSDK is globally available)
      const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(
        import.meta.env.VITE_AZURE_SPEECH_KEY,
        import.meta.env.VITE_AZURE_SPEECH_REGION
      );
      speechConfig.speechRecognitionLanguage = "en-IN";
      speechConfig.setProperty(
        SpeechSDK.PropertyId.SpeechServiceConnection_EndSilenceTimeoutMs,
        "2000"
      );

      // -- instantiate the TTS synthesizer once --
      const synthConfig = SpeechSDK.SpeechConfig.fromSubscription(
        import.meta.env.VITE_AZURE_SPEECH_KEY,
        import.meta.env.VITE_AZURE_SPEECH_REGION
      );
      synthConfig.speechSynthesisLanguage = "en-IN";
      const synthAudioConfig = SpeechSDK.AudioConfig.fromDefaultSpeakerOutput();
      synthesizerRef.current = new SpeechSDK.SpeechSynthesizer(synthConfig, synthAudioConfig);

      // -- recognizer setup --
      const recognizer = new SpeechSDK.SpeechRecognizer(
        speechConfig,
        SpeechSDK.AudioConfig.fromDefaultMicrophoneInput()
      );
      recognizerRef.current = recognizer;

      recognizer.recognized = async (_, e) => {
        if (e.result.reason === SpeechSDK.ResultReason.RecognizedSpeech) {
          const txt = e.result.text.trim();
          if (!txt) return;
          bufRef.current = bufRef.current ? bufRef.current + " " + txt : txt;
          clearTimeout(pauseTimer.current);
          pauseTimer.current = setTimeout(async () => {
            const userText = bufRef.current.trim();
            bufRef.current = "";
            // UI update
            setHistory((h) => [...h, { role: "user", content: userText }]);
            setMessages((m) => [...m, { sender: "You", text: userText }]);
            // send to LLM
            try {
              const { data: newHist } = await axios.post(`${API_BASE}/api/chat`, {
                messages: [...historyRef.current, { role: "user", content: userText }],
                userText,
              });
              setHistory(newHist);
              const reply = newHist.slice(-1)[0].content;
              setMessages((m) => [...m, { sender: "HR Bot", text: reply }]);
              setBotSpeech(reply);
              // ** speak the reply **
              synthesizerRef.current.speakTextAsync(
                reply,
                () => console.log("TTS finished"),
                err => console.error("TTS failed:", err)
              );
            } catch (err) {
              console.error("LLM error:", err);
            }
          }, 800);
        }
      };

      recognizer.startContinuousRecognitionAsync(
        () => console.log("STT started"),
        (err) => console.error("STT error", err)
      );
    } catch (err) {
      console.error("Start error:", err);
      alert("Could not start interview. See console.");
    } finally {
      setLoading(false);
    }
  };

  // Manual send
  const sendText = async () => {
    const txt = input.trim();
    if (!txt) return;
    setInput("");
    setHistory((h) => [...h, { role: "user", content: txt }]);
    setMessages((m) => [...m, { sender: "You", text: txt }]);
    try {
      const { data: newHist } = await axios.post(`${API_BASE}/api/chat`, {
        messages: [...historyRef.current, { role: "user", content: txt }],
        userText: txt,
      });
      setHistory(newHist);
      const reply = newHist.slice(-1)[0].content;
      setMessages((m) => [...m, { sender: "HR Bot", text: reply }]);
      setBotSpeech(reply);
      // ** speak the reply from manual send **
      synthesizerRef.current.speakTextAsync(
        reply,
        () => console.log("TTS finished"),
        err => console.error("TTS failed:", err)
      );
    } catch (err) {
      console.error("Send error:", err);
      alert("Failed to send. See console.");
    }
  };

  // // End interview
  // const endInterview = () => {
  //   recognizerRef.current?.stopContinuousRecognitionAsync(
  //     () => console.log("STT stopped"),
  //     (err) => console.error(err)
  //   );
  //   setStarted(false);
  // };

   // End interview → save transcript & scorecard on server, then show ThankYouPage
  const handleEndInterview = async () => {
   // 1) stop STT and timer
   recognizerRef.current?.stopContinuousRecognitionAsync(
     () => console.log("STT stopped"),
     err => console.error(err)
   );
   clearInterval(timerRef.current);

   // 2) ask for candidate name
   const name = window.prompt("Please enter your name to save your transcript:");
   if (!name) {
     alert("Name is required to save your transcript.");
     return;
   }

   // 3) call backend save endpoint
   try {
     await axios.post(`${API_BASE}/api/chat/save`, {
       name,
       conversation: history,    // your full array of {role,content}
     });
     // 4) flip to ThankYouPage
     setInterviewStatus(true);
   } catch (err) {
     console.error("Save error", err);
     alert("Failed to save transcript & scorecard.");
   }
 };

  async function handleStartInterview() {
    setLoading(true);
    try {
      const { data } = await axios.post(`${API_BASE}/api/chat`, {
        cv: cvText,
        jd: jdText,
        messages: [], // empty → backend injects system prompt
        userText: "", // no candidate reply yet
      });
      setMessages(data); // first-turn assistant message
      setInterviewStarted(true);
    } catch (err) {
      console.error(err);
      alert("Failed to start interview.");
    } finally {
      setLoading(false);
    }
  }

  // For starting the recording
  const [record, setRecord] = useState(false);

  // Check if the interview is completed
  const [interviewStatus, setInterviewStatus] = useState(false);

  // Current Date
  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Logic for pop up modal
  const [showPopup, setShowPopup] = useState(true); // popup visible on first render

  const closePopup = () => {
    setShowPopup(false); // Close the pop up div
    setRecord(true); // Start the recording
    timerRef.current = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timerRef.current);
          stopRecord();
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000); // every 1 second
  };

  const stopRecord = () => {
    setRecord(false);
    setInterviewStatus(true);
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const [uploading, setUploading] = useState(false);
  async function handleUpload() {
    if (!cvFile || !jdFile) return;
    const form = new FormData();
    form.append("cv", cvFile);
    form.append("jd", jdFile);
    try {
      setUploading(true);
      const resp = await axios.post(`${API_BASE}/api/upload`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setCvText(resp.data.cvText);
      setJdText(resp.data.jdText);
      alert("CV & JD uploaded successfully!");

      // Immediately start the interview
      const chatResp = await axios.post(`${API_BASE}/api/chat`, {
        cv: resp.data.cvText,
        jd: resp.data.jdText,
        messages: [], // empty → system prompt injected
        userText: "",
      });
      setMessages(chatResp.data);
      setInterviewStarted(true);
    } catch (err) {
      console.error(err);
      alert("Failed to upload or extract text.");
    } finally {
      setUploading(false);
    }
  }

  const sendMessage = async () => {
    const inputEl = document.getElementById("interview-bot-user-message");
    const userText = inputEl.value.trim();
    if (!userText || loading) return;

    // 1) locally add the new user message
    const userMsg = { role: "user", content: userText };
    const convo = [...messages, userMsg];
    setMessages(convo);
    inputEl.value = "";

    // 2) call the backend at /api/chat
    setLoading(true);
    try {
      const resp = await axios.post(`${API_BASE}/api/chat`, {
        ...(messages.length === 0 && { cv: cvText, jd: jdText }),
        messages: convo.map((m) => [m.role, m.content]),
        userText,
      });
      setMessages(resp.data); // resp.data is ChatMessage[]
    } catch (err) {
      console.error(err);
      alert("Interview service error");
    } finally {
      setLoading(false);
    }
  };

  const addHRMessages = () => {
    const input = document.getElementById("interview-bot-user-message");
    const HrText = input.value.trim();
    if (!HrText) return; // don't add empty messages
    input.value = "";
  };

  const handlePreventCopyPaste = (e) => {
    e.preventDefault();
    alert(`🔕Warning, "${e.type}" action is disabled!`);
  };

  function startLiveRecognition() {
    if (!speechCreds) return;
    const speechConfig = SpeechSDK.SpeechConfig.fromAuthorizationToken(
      speechCreds.token,
      speechCreds.region
    );
    speechConfig.speechRecognitionLanguage = "en-IN";

    const audioConfig     = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
    const recognizer      = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);

    recognizer.recognized = (_s, e) => {
      if (e.result.reason === SpeechSDK.ResultReason.RecognizedSpeech) {
        const text = e.result.text;
        // push into chat
        fetch(`${API_BASE}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [["user", text]],
            userText: text
          })
        })
        .then(r => r.json())
        .then(newHist => {
          const reply = newHist.slice(-1)[0][1];
          setMessages(m => [...m, { sender:"You", text }, { sender:"HR Bot", text:reply }]);
        })
        .catch(console.error);
      }
    };

    recognizer.startContinuousRecognitionAsync(
      () => console.log("STT started"),
      err => console.error("STT error", err)
    );
  }

  return (
    <main onCopy={handlePreventCopyPaste} onPaste={handlePreventCopyPaste}>
      <div className="mainHeader">
        <img className="mothersonLogo" src={mothersonLogo} alt="mothersonLogo" />
        <div className="vertical-line"></div>
        <h3 className="appName">Talent AI</h3>
      </div>
      {interviewStatus && <ThankYouPage />}
      {!interviewStatus && !interviewStarted && (
        <>
          {showPopup && (
            <InterviewInstruction
              recordStatus={record}
              closePopup={closePopup}
              setShowPopup={setShowPopup}
            />
          )}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div className="interview-bot-header">
              <div style={{ paddingLeft: "30px", lineHeight: "12px", marginTop: "21px" }}>
                <h1 className="interview-bot-heading">AI Interview Bot</h1>
                <p className="interview-bot-date">{formattedDate}</p>
              </div>
              <div className="interview-bot-time-left-container">
                <img src={clock} alt="clock" />
                <p
                  style={{ paddingTop: "16px", paddingRight: "10px", color: "red", fontSize: "16px" }}
                  id="interview-bot-clock"
                >
                  {formatTime(timeLeft)}
                </p>
              </div>
              <button style={{ position: "absolute", right: "2%" }} onClick={() => setShowPopup(true)}>
                <img src={Instructions} alt="instructions" />
              </button>
            </div>
            <div className="upload-section">
              {/* <label>
                UPLOAD CV 
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setCvFile(e.target.files?.[0] || null)}
                />
              </label> */}
              <div style={{display: "flex", flexDirection: "column", alignItems: "center"}}>
                <button 
                  style={{
                    margin: "1rem 0", 
                    background: "#DA2128",
                    color: "white",
                    width: "150px",
                    height: "35px",
                    borderRadius: "10px",
                    fontSize: "14px",
                    marginTop: "12px",
                    marginBottom: "12px"
                  }}
                  onClick={handleCvUploadInput}>UPLOAD CV 
                </button>
                <p className="CvName" style={{fontSize: "10px"}}>{cvUploadFileName}</p>
                  <input
                    ref={uploadCvButton}
                    id="cvUploadInput"
                    hidden 
                    type="file"
                    accept="application/pdf"
                    onChange={handleCvFileChange}
                  />
                </div>
              <div style={{display: "flex", flexDirection: "column", alignItems: "center"}}>
                <button 
                  style={{
                      marginLeft: "25px", 
                      background: "#DA2128",
                      color: "white",
                      width: "150px",
                      height: "35px",
                      borderRadius: "10px",
                      fontSize: "14px",
                      marginTop: "12px",
                      marginBottom: "12px"
                    }}
                  onClick={handleJdUploadInput}>
                  UPLOAD JD 
                  </button>
                  <p className="JdName" style={{fontSize: "10px"}}>{jdUploadFileName}</p>
                  {/* JD (PDF): */}
                  
                  <input
                    ref={uploadJdButton}
                    id="jdUploadInput"
                    hidden
                    type="file"
                    accept="application/pdf"
                    onChange={handleJdFileChange}
                  />
                </div>
              
              <div style={{ marginLeft: 50 }}>
                {/* optional Header component */}
              </div>
              <button
                onClick={() => startInterview(cvFile, jdFile)}
                disabled={!cvFile || !jdFile}
                
                style={{
                  margin: "1rem 0", 
                  background: "#DA2128",
                  color: "white",
                  width: "150px",
                  height: "35px",
                  borderRadius: "10px",
                  fontSize: "14px",
                  marginTop: "12px",
                  marginBottom: "12px"
                }}
              >
                Start Interview
              </button>
            </div>
            

            <div className="interview-bot-body">
              <div className="interview-bot-avatar-container">
                <div className="interview-bot-interview-section">
                  <img src={aiImage} alt="ai" />
                  <CameraRecorder
                    setShowPopup={setShowPopup}
                    recordStatus={record}
                    setRecord={setRecord}
                    timerRef={timerRef}
                  />
                </div>
                <div className="interview-bot-interview-controls-section">
                  {/* <button className="interview-bot-end-interview-button" onClick={stopRecord}> */}
                  <button className="interview-bot-end-interview-button" onClick={handleEndInterview}>
                    End Interview
                  </button>
                </div>
              </div>
              <div className="interview-bot-transcript-container">
                <div className="interview-bot-transcript">
                  <div className="interview-bot-transcript-header">
                    <div
                      style={{
                        borderRadius: "50%",
                        width: "15px",
                        height: "15px",
                        background: "#8a0b0b",
                      }}
                    ></div>
                    <h2
                      style={{
                        color: "white",
                        fontSize: "21px",
                        marginLeft: "20px",
                        fontWeight: "200",
                        paddingTop: "7px",
                      }}
                    >
                      Live Transcript
                    </h2>
                  </div>
                  <div className="interview-bot-transcript-body">
                    <MessageList messages={messages} />
                  </div>
                  <div className="interview-bot-user-input-container">
                    <MessageInput
                      value={input}
                      onChange={setInput}
                      onSend={sendText}
                      disabled={!started || loading}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={loading || !interviewStarted}
                      style={{ position: "absolute", right: "15px", top: "17px" }}
                    >
                      <img src={sendButton} alt="send" style={{ height: "20px" }} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </main>
  );
}

