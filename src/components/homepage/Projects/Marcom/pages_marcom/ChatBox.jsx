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
    <div className="chat-container">
      {/* Messages */}
      <div className="chat-messages">
        {/* KnowledgeBot history */}
        {useCase === "KnowledgeBot" &&
          (knowledgeHistoryMessages || []).map((msg, index) => (
            <div key={`H${index}`}>
              <div className="chat-bubble user">
                <div className="chat-bubble-message user">{msg.question}</div>
              </div>

              <div className="chat-bubble ai">
                <div className="chat-bubble-message ai">{msg.answer}</div>

                <div className="chat-bubble-icons">
                  {/* Copy/Speak target = AI answer */}
                  <div className="marcom-copy-icon">
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
            </div>
          ))}

        {/* PersonaBot history */}
        {useCase === "PersonaBot" &&
          (personaHistoryMessages || []).map((msg, index) => (
            <div key={`P${index}`}>
              <div className="chat-bubble user">
                <div className="chat-bubble-message user">{msg.question}</div>
              </div>

              <div className="chat-bubble ai">
                <div className="chat-bubble-message ai">{msg.response}</div>

                <div className="chat-bubble-icons">
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
            </div>
          ))}

        {/* Live chat */}
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`chat-bubble ${msg.sender === "user" ? "user" : "ai"}`}
          >
            <div
              className={`chat-bubble-message ${
                msg.sender === "user" ? "user" : "ai"
              }`}
            >
              {msg.text}
            </div>

            {msg.sender === "ai" && (
              <div className="chat-bubble-icons">
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
          <div className="chat-bubble ai">
            <div className="chat-bubble-message ai">
              <div className="loader"></div>
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
      <div className="chat-input-container">
        <div className="chat-input">
          <textarea
            className="chat-textarea"
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

          <div className="chat-icons">
            <img className="icon" src={plus_icon} alt="plus" />

            {/* Mic */}
            <img
              className={`icon ${isListening ? "listening" : ""}`}
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


// import plus_icon from "../assets_marcom/plus_icon.svg";
// import speaker_icon from "../assets_marcom/speaker_icon.png";
// import thumbs_up from "../assets_marcom/thumbs_up_icon.png";
// import thumbs_down from "../assets_marcom/thumbs_down_icon.png";
// import download from "../assets_marcom/download_icon_.png";
// import share from "../assets_marcom/share_icon.png";
// import chat_icon from "../assets_marcom/chat_icon.png";
// import sound_icon from "../assets_marcom/sound_icon.png";
// import "./ChatBox.css";
// import { useEffect, useRef, useState } from "react";
// import FeedbackModal from "./FeedbackModal";

// function ChatBox({ useCase, messages, setMessages, inputMessage, setInputMessage, sliderValue, knowledgeHistoryMessages, personaHistoryMessages }) {
//   const messagesEndRef = useRef(null);

//   // For copying of text
//   const [copiedIndex, setCopiedIndex] = useState(null);

//   const handleCopy = (text, index) => {
//     navigator.clipboard.writeText(text);
//     setCopiedIndex(index);
//     setTimeout(() => setCopiedIndex(null), 1500); // reset after 1.5s
//   };

//   // For reading out the messages verbally from the text
//   const handleSpeak = (text) => {
//     if (speechSynthesis.speaking) {
//       // If already speaking, stop it
//       speechSynthesis.cancel();
//     } else {
//       // Otherwise, start speaking
//       const utterance = new SpeechSynthesisUtterance(text);
//       speechSynthesis.speak(utterance);
//     }
//   };

//   // 🔑 Sync manual edits to both state + buffer
//   const handleInputChange = (e) => {
//     setInputMessage(e.target.value);
//     finalTranscriptRef.current = e.target.value; // keep buffer in sync
//   };

//   // For speech input 
//   const [isListening, setIsListening] = useState(false);
//   const recognitionRef = useRef(null);
//   const finalTranscriptRef = useRef(""); // keeps accumulated speech

//   useEffect(() => {
//     const SpeechRecognition =
//       window.SpeechRecognition || window.webkitSpeechRecognition;

//     if (!SpeechRecognition) {
//       alert("Speech recognition not supported in this browser");
//       return;
//     }

//     const recognition = new SpeechRecognition();
//     recognition.continuous = true;       // ✅ phrase-by-phrase (accurate)
//     recognition.interimResults = true;    // ✅ live preview
//     recognition.lang = "en-IN";           // ✅ works better than en-IN

//     recognition.onresult = (event) => {
//       let interimTranscript = "";
//       for (let i = event.resultIndex; i < event.results.length; ++i) {
//         const result = event.results[i];
//         if (result.isFinal) {
//           finalTranscriptRef.current += result[0].transcript + " ";
//         } else {
//           interimTranscript += result[0].transcript;
//         }
//       }
//       setInputMessage(finalTranscriptRef.current + interimTranscript);
//     };

//     recognition.onend = () => {
//       if (isListening) {
//         try {
//           recognition.start(); // 🔄 auto restart for continuous feel
//         } catch (e) {
//           console.warn("Restart error:", e);
//         }
//       }
//     };

//     recognitionRef.current = recognition;
//   }, [isListening]);

//   useEffect(() => {
//     // Scroll to bottom when messages change
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages]);

//   // const handleSend = async () => {
//   //   if (!inputMessage.trim()) return;
//   //   const new_user_message = inputMessage

//   //   const newMessages = [...messages, { sender: "user", text: new_user_message }];
//   //   setMessages(newMessages);
//   //   setInputMessage("");
//   //   finalTranscriptRef.current = "";
//   //   if (useCase === "KnowledgeBot") {
//   //     try {
//   //       const response = await fetch("http://10.245.146.151:5006/chat", {
//   //         method: "POST",
//   //         headers: {
//   //           "Content-Type": "application/json",
//   //         },
//   //         body: JSON.stringify({
//   //           query: new_user_message,
//   //           session_id: "rohan.singh@motherson.com",
//   //         }),
//   //       });

//   //       const data = await response.json();
//   //       console.log("Response:", data.response);

//   //       // Add user message
//   //       setMessages([...newMessages, { sender: "ai", text: data.response }]);

//   //     } catch (error) {
//   //       console.error("Error:", error);
//   //     }
//   //   } else {
//   //     try {
//   //       const response = await fetch("http://10.245.146.250:8794/generate", {
//   //         method: "POST",
//   //         headers: {
//   //           "Content-Type": "application/json",
//   //         },
//   //         body: JSON.stringify({
//   //           prompt: inputMessage,
//   //           temperature: Number(sliderValue),
//   //           session_id: "rohan.singh@motherson.com",
//   //         }),
//   //       });

//   //       const data = await response.json();
//   //       console.log("Response:", data);
//   //       // Add user message
//   //       setMessages([...newMessages, { sender: "ai", text: data.response }]);
//   //     } catch (error) {
//   //       console.error("Error:", error);
//   //     }
//   //   }
//   // };

//   // 🆕 Modal state
//   const handleSend = async () => {
//   if (!inputMessage.trim()) return;
//   const new_user_message = inputMessage;

//   const newMessages = [...messages, { sender: "user", text: new_user_message }];
//   setMessages(newMessages);
//   setInputMessage("");
//   finalTranscriptRef.current = "";
//   setIsLoading(true); // ✅ Show loader

//   if (useCase === "KnowledgeBot") {
//     try {
//       // "http://10.245.146.151:5006/chat"
//       const response = await fetch(`${import.meta.env.VITE_MARCOM_BASE_URL_KNOWLEDGE}/chat`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           query: new_user_message,
//           session_id: "rohan.singh@motherson.com",
//         }),
//       });

//       const data = await response.json();
//       setMessages([...newMessages, { sender: "ai", text: data.response }]);
//     } catch (error) {
//       console.error("Error:", error);
//     } finally {
//       setIsLoading(false); // ✅ Hide loader
//     }
//   } else {
//     try {
//       // "http://10.245.146.250:8794/generate"
//       const response = await fetch(`${import.meta.env.VITE_MARCOM_BASE_URL_PERSONA}/generate`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           prompt: inputMessage,
//           temperature: Number(sliderValue),
//           session_id: "rohan.singh@motherson.com",
//         }),
//       });

//       const data = await response.json();
//       setMessages([...newMessages, { sender: "ai", text: data.response }]);
//     } catch (error) {
//       console.error("Error:", error);
//     } finally {
//       setIsLoading(false); // ✅ Hide loader
//     }
//   }
// };

//   const [showModal, setShowModal] = useState(false);
//   const [feedbackType, setFeedbackType] = useState(null); // "like" or "dislike"
//   const [selectedMessage, setSelectedMessage] = useState(null); // 🆕

//   // For loader
//   const [isLoading, setIsLoading] = useState(false);

//   return (
//     <div className="chat-container">
//       {/* Messages Section */}
//       <div className="chat-messages">
        
//         {useCase=="KnowledgeBot" && knowledgeHistoryMessages.map((msg, index) => (
//           <>
//             <div
//               key={`H{index}`}
//               className={`chat-bubble user`}
//             >
//               <div
//                 className={`chat-bubble-message user`}
//               >
//                 {msg.question}
//               </div>
//             </div>
//             <div
//               key={index}
//               className={`chat-bubble ai`}
//             >
//               <div
//                 className={`chat-bubble-message ai`}
//               >
//                 {msg.answer}
//               </div>
//               <div className="chat-bubble-icons">
//                 {/* Copy Icon  */}
//                 <div className="marcom-copy-icon">
//                   <img
//                     src={chat_icon}
//                     alt="Copy"
//                     style={{ cursor: "pointer" }}
//                     onClick={() => handleCopy(msg.question, index)}
//                   />
//                   <span className="marcom-copy-tooltip-text">
//                     {copiedIndex === index ? "Copied!" : "Copy"}
//                   </span>
//                 </div>

//                 {/* Speak Icon */}
//                 <div className="marcom-speak-icon">
//                   <img
//                     src={sound_icon}
//                     alt="Hear"
//                     title="hear"
//                     style={{ cursor: "pointer" }}
//                     onClick={() => handleSpeak(msg.question)}
//                   />
//                   <span className="marcom-speak-tooltip-text">Hear</span>
//                 </div>

//                 {/* For feedback, like  */}
//                 <div className="marcom-thumbs-up">
//                   <img
//                     src={thumbs_up}
//                     alt="Thumbs Up"
//                     style={{ cursor: "pointer" }}
//                     onClick={() => {
//                       setSelectedMessage({ ...msg.question, index }); // store msg + index
//                       setFeedbackType("like");
//                       setShowModal(true);
//                     }}
//                   />
//                 </div>

//                 {/* For feedback, dislike  */}
//                 <div className="marcom-thumbs-down">
//                   <img
//                     src={thumbs_down}
//                     alt="Thumbs Down"
//                     style={{ cursor: "pointer" }}
//                     onClick={() => {
//                       setSelectedMessage({ ...msg.question, index });
//                       setFeedbackType("dislike");
//                       setShowModal(true);
//                     }}
//                   />
//                 </div>
//                 </div>
//             </div>
//           </>
//           ))}
//         {useCase=="PersonaBot" && personaHistoryMessages.map((msg, index) => (
//           <>
//             <div
//               key={`P{index}`}
//               className={`chat-bubble user`}
//             >
//               <div
//                 className={`chat-bubble-message user`}
//               >
//                 {msg.question}
//               </div>
//             </div>
//             <div
//               key={index}
//               className={`chat-bubble ai`}
//             >
//               <div
//                 className={`chat-bubble-message ai`}
//               >
//                 {msg.response}
//               </div>
//               <div className="chat-bubble-icons">
//                 {/* Copy Icon  */}
//                 <div className="marcom-copy-icon">
//                   <img
//                     src={chat_icon}
//                     alt="Copy"
//                     style={{ cursor: "pointer" }}
//                     onClick={() => handleCopy(msg.question, index)}
//                   />
//                   <span className="marcom-copy-tooltip-text">
//                     {copiedIndex === index ? "Copied!" : "Copy"}
//                   </span>
//                 </div>

//                 {/* Speak Icon */}
//                 <div className="marcom-speak-icon">
//                   <img
//                     src={sound_icon}
//                     alt="Hear"
//                     title="hear"
//                     style={{ cursor: "pointer" }}
//                     onClick={() => handleSpeak(msg.question)}
//                   />
//                   <span className="marcom-speak-tooltip-text">Hear</span>
//                 </div>

//                 {/* For feedback, like  */}
//                 <div className="marcom-thumbs-up">
//                   <img
//                     src={thumbs_up}
//                     alt="Thumbs Up"
//                     style={{ cursor: "pointer" }}
//                     onClick={() => {
//                       setSelectedMessage({ ...msg.question, index }); // store msg + index
//                       setFeedbackType("like");
//                       setShowModal(true);
//                     }}
//                   />
//                 </div>

//                 {/* For feedback, dislike  */}
//                 <div className="marcom-thumbs-down">
//                   <img
//                     src={thumbs_down}
//                     alt="Thumbs Down"
//                     style={{ cursor: "pointer" }}
//                     onClick={() => {
//                       setSelectedMessage({ ...msg.question, index });
//                       setFeedbackType("dislike");
//                       setShowModal(true);
//                     }}
//                   />
//                 </div>
//                 </div>
//             </div>
//           </>
//           ))}
//        {messages.map((msg, index) => (
//         <div
//           key={index}
//           className={`chat-bubble ${msg.sender === "user" ? "user" : "ai"}`}
//         >
//           <div
//             className={`chat-bubble-message ${msg.sender === "user" ? "user" : "ai"}`}
//           >
//             {msg.text}
//           </div>

//           {msg.sender === "ai" && (
//             <div className="chat-bubble-icons">
//               {/* Copy Icon  */}
//               <div className="marcom-copy-icon">
//                 <img
//                   src={chat_icon}
//                   alt="Copy"
//                   style={{ cursor: "pointer" }}
//                   onClick={() => handleCopy(msg.text, index)}
//                 />
//                 <span className="marcom-copy-tooltip-text">
//                   {copiedIndex === index ? "Copied!" : "Copy"}
//                 </span>
//               </div>

//               {/* Speak Icon */}
//               <div className="marcom-speak-icon">
//                 <img
//                   src={sound_icon}
//                   alt="Hear"
//                   title="hear"
//                   style={{ cursor: "pointer" }}
//                   onClick={() => handleSpeak(msg.text)}
//                 />
//                 <span className="marcom-speak-tooltip-text">Hear</span>
//               </div>

//               {/* For feedback, like */}
//               <div className="marcom-thumbs-up">
//                 <img
//                   src={thumbs_up}
//                   alt="Thumbs Up"
//                   style={{ cursor: "pointer" }}
//                   onClick={() => {
//                     setSelectedMessage({ ...msg, index });
//                     setFeedbackType("like");
//                     setShowModal(true);
//                   }}
//                 />
//               </div>

//               {/* For feedback, dislike */}
//               <div className="marcom-thumbs-down">
//                 <img
//                   src={thumbs_down}
//                   alt="Thumbs Down"
//                   style={{ cursor: "pointer" }}
//                   onClick={() => {
//                     setSelectedMessage({ ...msg, index });
//                     setFeedbackType("dislike");
//                     setShowModal(true);
//                   }}
//                 />
//               </div>
//             </div>
//           )}
//         </div>
//       ))}

//       {/* Loader bubble shown separately */}
//       {isLoading && (
//         <div className="chat-bubble ai">
//           <div className="chat-bubble-message ai">
//             <div className="loader"></div>
//           </div>
//         </div>
//       )}

//       </div>
//       <div ref={messagesEndRef}></div>

//       {/* Feedback Modal */}
//       {showModal && selectedMessage && (
//         <FeedbackModal
//           message={selectedMessage}
//           feedbackType={feedbackType}
//           onClose={() => {
//             setShowModal(false);
//             setSelectedMessage(null);
//             setFeedbackType(null);
//           }}
//           onSubmit={(feedbackText) => {
//             // send to backend with message_id + type + optional comment
//             // "http://10.245.146.151:5006/submit-feedback_question"
//             fetch(`${import.meta.env.VITE_MARCOM_BASE_URL_KNOWLEDGE}/submit-feedback_question`, {
//               method: "POST",
//               headers: { "Content-Type": "application/json" },
//               body: JSON.stringify({
//                 message_id: selectedMessage.index, // or backend id if available
//                 text: selectedMessage.text,
//                 feedback_type: feedbackType,
//                 comment: feedbackText,
//               }),
//             });

//             setShowModal(false);
//             setSelectedMessage(null);
//             setFeedbackType(null);
//           }}
//         />
//       )}

//       {/* Chat Input */}
//       <div className="chat-input-container">
//         <div className="chat-input">
//           <textarea
//             className="chat-textarea"
//             placeholder="Send a message..."
//             rows={2}
//             value={inputMessage}
//             onChange={handleInputChange}
//             onKeyDown={(e) => {
//               if (e.key === "Enter" && !e.shiftKey) {
//                 e.preventDefault(); // stop new line / form submit
//                 handleSend();
//                 if (recognitionRef.current) {
//                   recognitionRef.current.stop(); // stop listening when sending
//                   setIsListening(false);
//                 }
//               }
//             }}
//           />

//           <div className="chat-icons">
//             <img className="icon" src={plus_icon} alt="plus" />

//             {/* Mic icon for voice input */}
//             <img
//               className={`icon ${isListening ? "listening" : ""}`}
//               src={speaker_icon}
//               alt="speaker"
//               onClick={() => {
//                 if (!recognitionRef.current) return;

//                 if (isListening) {
//                   recognitionRef.current.stop();
//                   setIsListening(false);
//                 } else {
//                   finalTranscriptRef.current = inputMessage; // keep any typed text
//                   recognitionRef.current.start();
//                   setIsListening(true);
//                 }
//               }}
//             />
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default ChatBox;
