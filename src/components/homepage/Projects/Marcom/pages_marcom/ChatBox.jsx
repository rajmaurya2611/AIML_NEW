// ChatBox.jsx
import plus_icon from "../assets_marcom/plus_icon.svg";
import speaker_icon from "../assets_marcom/speaker_icon.png";
import thumbs_up from "../assets_marcom/thumbs_up_icon.png";
import thumbs_down from "../assets_marcom/thumbs_down_icon.png";
import download from "../assets_marcom/download_icon_.png";
import share from "../assets_marcom/share_icon.png";
import chat_icon from "../assets_marcom/chat_icon.png";
import sound_icon from "../assets_marcom/sound_icon.png";
import "./ChatBox.css";
import { useEffect, useRef, useState } from "react";
import FeedbackModal from "./FeedbackModal";
import { getUserEmail } from "../okta/getUsersEmail";

function ChatBox({
  useCase,
  messages,
  setMessages,
  inputMessage,
  setInputMessage,
  sliderValue,
  knowledgeHistoryMessages,
  personaHistoryMessages,
  onExternalPrompt
}) {
  
  const messagesEndRef = useRef(null);

  // Copy state
  const [copiedIndex, setCopiedIndex] = useState(null);

  const handleCopy = (text, index) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  // Speak (TTS)
  const handleSpeak = (text) => {
    if (!text) return;
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    } else {
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
  };

  // 🔑 Keep manual edits synced with speech buffer
  const finalTranscriptRef = useRef("");
  const handleInputChange = (e) => {
    setInputMessage(e.target.value);
    finalTranscriptRef.current = e.target.value;
  };

  // 🎤 Speech input
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      console.warn("Speech recognition not supported in this browser");
      return;
    }
    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-IN";

    recognition.onresult = (event) => {
      let interimTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscriptRef.current += result[0].transcript + " ";
        } else {
          interimTranscript += result[0].transcript;
        }
      }
      setInputMessage(finalTranscriptRef.current + interimTranscript);
    };

    recognition.onend = () => {
      if (isListening) {
        try {
          recognition.start();
        } catch (e) {
          console.warn("Speech restart error:", e);
        }
      }
    };

    recognitionRef.current = recognition;
  }, [isListening, setInputMessage]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ✅ Session email from Okta (once per tab)
  const [sessionEmail, setSessionEmail] = useState(null);
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const email = await getUserEmail();
        if (mounted) setSessionEmail(email);
      } catch (e) {
        console.warn("Okta email fetch failed:", e);
        if (mounted) setSessionEmail(null);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (onExternalPrompt && onExternalPrompt.length > 0) {
      // Set the input text
      setInputMessage(onExternalPrompt);
      // Small delay to ensure input is updated, then send
      setTimeout(() => {
        handleSend();
      }, 100);
    }
  }, [onExternalPrompt]);

  // Loader
  const [isLoading, setIsLoading] = useState(false);

  // Feedback modal state
  const [showModal, setShowModal] = useState(false);
  const [feedbackType, setFeedbackType] = useState(null); // "like" | "dislike"
  const [selectedMessage, setSelectedMessage] = useState(null); // { index, source, text }

  // Send
  const handleSend = async () => {
    if (!inputMessage.trim()) return;
    const new_user_message = inputMessage; // ⬅️ memoize BEFORE clearing
    
    const next = [...messages, { sender: "user", text: new_user_message }];
    setMessages(next);
    setInputMessage("");
    finalTranscriptRef.current = "";
    setIsLoading(true);

    const sid = sessionEmail || "anonymous@unknown";

    try {
      if (useCase === "KnowledgeBot") {
        const res = await fetch(
          `${import.meta.env.VITE_MARCOM_BASE_URL_KNOWLEDGE}/chat`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              query: new_user_message,
              session_id: sid,
            }),
          }
        );
        const data = await res.json();
        setMessages([...next, { sender: "ai", text: data.response }]);
      } else {
        const res = await fetch(
          `${import.meta.env.VITE_MARCOM_BASE_URL_PERSONA}/generate`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              prompt: new_user_message,
              temperature: Number(sliderValue),
              session_id: sid,
            }),
          }
        );
        const data = await res.json();
        setMessages([...next, { sender: "ai", text: data.response }]);
      }
    } catch (err) {
      console.error("Chat error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="marcom-chat-container">
      {/* Messages */}
      <div className="marcom-chat-messages" >
        {/* KnowledgeBot history */}
        {useCase === "KnowledgeBot" &&
          (knowledgeHistoryMessages || []).map((msg, index) => (
            <>
              <div key={`H${index}`} className="marcom-chat-bubble user">
                <div className="marcom-chat-bubble-message user">{msg.question}</div>
              </div>

              <div key={`Ha${index}`} className="marcom-chat-bubble ai">
                <div className="marcom-chat-bubble-message ai">{msg.answer}</div>

                <div className="marcom-chat-bubble-icons">
                  {/* Copy/Speak target = AI answer */}
                  <div className="marcom-marcom-copy-icon">
                    <img
                      src={chat_icon}
                      alt="Copy"
                      style={{ cursor: "pointer" }}
                      onClick={() => handleCopy(msg.answer, index)}
                    />
                    <span className="marcom-copy-tooltip-text">
                      {copiedIndex === index ? "Copied!" : "Copy"}
                    </span>
                  </div>

                  <div className="marcom-speak-icon">
                    <img
                      src={sound_icon}
                      alt="Hear"
                      title="hear"
                      style={{ cursor: "pointer" }}
                      onClick={() => handleSpeak(msg.answer)}
                    />
                    <span className="marcom-speak-tooltip-text">Hear</span>
                  </div>

                  {/* Feedback on AI answer */}
                  <div className="marcom-thumbs-up">
                    <img
                      src={thumbs_up}
                      alt="Thumbs Up"
                      style={{ cursor: "pointer" }}
                      onClick={() => {
                        setSelectedMessage({
                          index,
                          source: "knowledge",
                          text: msg.answer,
                        });
                        setFeedbackType("like");
                        setShowModal(true);
                      }}
                    />
                  </div>
                  <div className="marcom-thumbs-down">
                    <img
                      src={thumbs_down}
                      alt="Thumbs Down"
                      style={{ cursor: "pointer" }}
                      onClick={() => {
                        setSelectedMessage({
                          index,
                          source: "knowledge",
                          text: msg.answer,
                        });
                        setFeedbackType("dislike");
                        setShowModal(true);
                      }}
                    />
                  </div>
                </div>
              </div>
            </>
          ))}

        {/* PersonaBot history */}
        {useCase === "PersonaBot" &&
          (personaHistoryMessages || []).map((msg, index) => (
            <>
              <div key={`P${index}`} className="marcom-chat-bubble user">
                <div className="marcom-chat-bubble-message user">{msg.question}</div>
              </div>

              <div key={`Pa${index}`} className="marcom-chat-bubble ai">
                <div className="marcom-chat-bubble-message ai">{msg.response}</div>

                <div className="marcom-chat-bubble-icons">
                  <div className="marcom-copy-icon">
                    <img
                      src={chat_icon}
                      alt="Copy"
                      style={{ cursor: "pointer" }}
                      onClick={() => handleCopy(msg.response, index)}
                    />
                    <span className="marcom-copy-tooltip-text">
                      {copiedIndex === index ? "Copied!" : "Copy"}
                    </span>
                  </div>

                  <div className="marcom-speak-icon">
                    <img
                      src={sound_icon}
                      alt="Hear"
                      title="hear"
                      style={{ cursor: "pointer" }}
                      onClick={() => handleSpeak(msg.response)}
                    />
                    <span className="marcom-speak-tooltip-text">Hear</span>
                  </div>

                  <div className="marcom-thumbs-up">
                    <img
                      src={thumbs_up}
                      alt="Thumbs Up"
                      style={{ cursor: "pointer" }}
                      onClick={() => {
                        setSelectedMessage({
                          index,
                          source: "persona",
                          text: msg.response,
                        });
                        setFeedbackType("like");
                        setShowModal(true);
                      }}
                    />
                  </div>
                  <div className="marcom-thumbs-down">
                    <img
                      src={thumbs_down}
                      alt="Thumbs Down"
                      style={{ cursor: "pointer" }}
                      onClick={() => {
                        setSelectedMessage({
                          index,
                          source: "persona",
                          text: msg.response,
                        });
                        setFeedbackType("dislike");
                        setShowModal(true);
                      }}
                    />
                  </div>
                </div>
              </div>
            </>
          ))}

        {/* Live chat */}
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`marcom-chat-bubble ${msg.sender === "user" ? "user" : "ai"}`}
          >
            <div
              className={`marcom-chat-bubble-message ${
                msg.sender === "user" ? "user" : "ai"
              }`}
            >
              {msg.text}
            </div>

            {msg.sender === "ai" && (
              <div className="marcom-chat-bubble-icons">
                <div className="marcom-copy-icon">
                  <img
                    src={chat_icon}
                    alt="Copy"
                    style={{ cursor: "pointer" }}
                    onClick={() => handleCopy(msg.text, index)}
                  />
                  <span className="marcom-copy-tooltip-text">
                    {copiedIndex === index ? "Copied!" : "Copy"}
                  </span>
                </div>

                <div className="marcom-speak-icon">
                  <img
                    src={sound_icon}
                    alt="Hear"
                    title="hear"
                    style={{ cursor: "pointer" }}
                    onClick={() => handleSpeak(msg.text)}
                  />
                  <span className="marcom-speak-tooltip-text">Hear</span>
                </div>

                <div className="marcom-thumbs-up">
                  <img
                    src={thumbs_up}
                    alt="Thumbs Up"
                    style={{ cursor: "pointer" }}
                    onClick={() => {
                      setSelectedMessage({
                        index,
                        source: "live",
                        text: msg.text,
                      });
                      setFeedbackType("like");
                      setShowModal(true);
                    }}
                  />
                </div>

                <div className="marcom-thumbs-down">
                  <img
                    src={thumbs_down}
                    alt="Thumbs Down"
                    style={{ cursor: "pointer" }}
                    onClick={() => {
                      setSelectedMessage({
                        index,
                        source: "live",
                        text: msg.text,
                      });
                      setFeedbackType("dislike");
                      setShowModal(true);
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Loader bubble */}
        {isLoading && (
          <div className="marcom-chat-bubble ai">
            <div className="marcom-chat-bubble-message ai">
              <div className="marcom-loader"></div>
            </div>
          </div>
        )}
      </div>

      <div ref={messagesEndRef} />

      {/* Feedback Modal */}
      {showModal && selectedMessage && (
        <FeedbackModal
          message={selectedMessage}
          feedbackType={feedbackType}
          onClose={() => {
            setShowModal(false);
            setSelectedMessage(null);
            setFeedbackType(null);
          }}
          onSubmit={(feedbackText) => {
            // If Persona has a separate endpoint, branch here by selectedMessage.source
            fetch(
              `${import.meta.env.VITE_MARCOM_BASE_URL_KNOWLEDGE}/submit-feedback_question`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  message_id: selectedMessage.index,
                  text: selectedMessage.text,
                  feedback_type: feedbackType,
                  comment: feedbackText,
                  session_id: sessionEmail || "anonymous@unknown",
                  source: selectedMessage.source, // knowledge | persona | live
                }),
              }
            );

            setShowModal(false);
            setSelectedMessage(null);
            setFeedbackType(null);
          }}
        />
      )}

      {/* Input */}
      <div className="marcom-chat-input-container">
        <div className="marcom-chat-input">
          <textarea
            className="marcom-chat-textarea"
            placeholder="Send a message..."
            rows={2}
            value={inputMessage}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
                if (recognitionRef.current) {
                  recognitionRef.current.stop();
                  setIsListening(false);
                }
              }
            }}
          />

          <div className="marcom-chat-icons">
            <img className="marcom-icon" src={plus_icon} alt="plus" />

            {/* Mic */}
            <img
              className={`marcom-icon ${isListening ? "listening" : ""}`}
              src={speaker_icon}
              alt="speaker"
              onClick={() => {
                const rec = recognitionRef.current;
                if (!rec) return;
                if (isListening) {
                  rec.stop();
                  setIsListening(false);
                } else {
                  finalTranscriptRef.current = inputMessage;
                  try {
                    rec.start();
                    setIsListening(true);
                  } catch (e) {
                    console.warn("Speech start error:", e);
                  }
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatBox;
