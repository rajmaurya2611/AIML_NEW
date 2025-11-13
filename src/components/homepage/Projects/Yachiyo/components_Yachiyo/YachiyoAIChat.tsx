import React, { useState, useRef, useEffect } from 'react';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { DataTable } from './DataTable';
import { FeedbackModal } from './FeedbackModal';
import { useToast } from '../hooks_Yachiyo/use-toast';
import "./YachiyoAIChat.css";
import * as XLSX from "xlsx";
import { Button } from "./ui/button";
import download_icon from "../assests_Yachiyo/download_icon.png";
// removed unused uuid import

import { useYachiyoContext } from './context/YachiyoContext';
import { useNavigate } from "react-router-dom";

import { getUserProfile } from './getUsersEmail';


interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
  isLiked?: boolean;
  isDisliked?: boolean;

  tableData?: {
    columns: string[];
    rows: (string | number)[][];
  };
}

export const YachiyoAIChat: React.FC = () => {

  const { registerHandlers, createNewSession, apiResponse } = useYachiyoContext();
  const navigate = useNavigate();
  // not used in this component directly (sidebar handles navigation)
  void navigate;
   

  //const { setTriggerNewChat } = useYachiyoContext();
  //const { triggerNewChat, triggerSearchChat, triggerSaved } = useYachiyoContext();

  const [messages, setMessages] = useState<Message[]>([
  ]);

  const [file, setFile] = useState<File | null>(null);


  const isSpeakingRef = useRef(false);
  const activeSpeechMessageId = useRef<string | null>(null);
  const [, setIsSpeaking] = useState(false);

  const [isChatStarted, setIsChatStarted] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  //const [sessionId, setSessionId] = useState("");

  // top-level API_BASE_URL is not used in this module (local handlers declare their own)


   const handleCopy = async (messageId: string, messageText: string) => {
    try {
      await navigator.clipboard.writeText(messageText);
      console.log(`Copied message ${messageId}: ${messageText}`);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };


  //   useEffect(() => {
  //   registerHandlers({
  //     onNewChat: handleNewChat,
  //     // onSearchChat: handleSearchChat,
  //     // onSaved: handleSaved,
  //   });
  // }, []);

       useEffect(() => {
    if (apiResponse && apiResponse.messages) {
      const formatted = apiResponse.messages.map((msg: any) => ({
        id: msg.message_id,
       // text: msg.content,
        //text: msg.content.replace(/\n+/g, "\n"),
        text:apiResponse ? msg.content.replace(/\n+/g, "\n") : msg.content,
        isBot: msg.role === "assistant",
        timestamp: new Date(msg.timestamp),
      }));

      console.log(formatted);
      setMessages(formatted);

      if (formatted.length > 0) {
      setIsChatStarted(true);
    }

    }
  }, [apiResponse]);


   useEffect(() => {
  const init = async () => {
    // Step 1: Get user email
    const email = ((await getUserProfile()).email).toLocaleLowerCase();

    // Step 2: Create new session using context
    await createNewSession(email);

    // Step 3: Register handlers
    registerHandlers({
      onNewChat: handleNewChat,
    });
  };

  init();
}, [registerHandlers, createNewSession]);
  //  useEffect(() => {
  //   setTriggerNewChat(() => handleNewChat);
  // }, [setTriggerNewChat]);


//   const handleSpeak = (messageId: string, text: string) => {
//   if ("speechSynthesis" in window) {
//     // If already speaking this message → stop it
//     if (isSpeakingRef.current && activeSpeechMessageId.current === messageId) {
//       window.speechSynthesis.cancel();
//       isSpeakingRef.current = false;
//       activeSpeechMessageId.current = null;
//       setIsSpeaking(false);
//       return;
//     }

//     // If speaking another message → stop it
//     if (isSpeakingRef.current) {
//       window.speechSynthesis.cancel();
//     }

//     // Start new speech
//     const utterance = new SpeechSynthesisUtterance(text);
//     utterance.lang = "en-US";

//     utterance.onend = () => {
//       isSpeakingRef.current = false;
//       activeSpeechMessageId.current = null;
//       setIsSpeaking(false);
//     };

//     utterance.onerror = () => {
//       isSpeakingRef.current = false;
//       activeSpeechMessageId.current = null;
//       setIsSpeaking(false);
//     };

//     isSpeakingRef.current = true;
//     activeSpeechMessageId.current = messageId;
//     setIsSpeaking(true);

//     window.speechSynthesis.speak(utterance);
//   } else {
//     alert("Speech Synthesis API not supported in this browser.");
//   }
// };


const handleSpeak = (messageId: string, text: string) => {
  if ("speechSynthesis" in window) {
    // Stop if already speaking the same message
    if (isSpeakingRef.current && activeSpeechMessageId.current === messageId) {
      window.speechSynthesis.cancel();
      isSpeakingRef.current = false;
      activeSpeechMessageId.current = null;
      setIsSpeaking(false);
      return;
    }

    // Stop current speech if another is speaking
    if (isSpeakingRef.current) {
      window.speechSynthesis.cancel();
    }

    // Detect if text contains Japanese characters
    const isJapanese = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9faf]/.test(text);

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = isJapanese ? "ja-JP" : "en-US";

    utterance.onend = () => {
      isSpeakingRef.current = false;
      activeSpeechMessageId.current = null;
      setIsSpeaking(false);
    };

    utterance.onerror = () => {
      isSpeakingRef.current = false;
      activeSpeechMessageId.current = null;
      setIsSpeaking(false);
    };

    isSpeakingRef.current = true;
    activeSpeechMessageId.current = messageId;
    setIsSpeaking(true);

    window.speechSynthesis.speak(utterance);
  } else {
    alert("Speech Synthesis API not supported in this browser.");
  }
};




//     useEffect(() => {
//        const email =  getUserEmail();

//   //const userId = "Rahul.Pal02@motherson.com";
//     createNewSession(email).then((id) => {
//     if (id) {
//       setSessionId(id);
//       localStorage.setItem("session_id", id); // optional
//     }
//   });
// }, []);



//     async function createNewSession(userId) {
//   try {
//     const response = await fetch(`${API_BASE_URL}/new_session/${userId}`, {
//       method: "POST",
//     });

//     if (!response.ok) {
//       throw new Error("Failed to create session");
//     }

//     const data = await response.json();
//     console.log("✅ Session created:", data);

//     // Example response:
//     // { message: "New session created", session_id: "xxxx-xxxx", user_id: "Rahul" }
//     return data.session_id;
//   } catch (error) {
//     console.error("Error creating session:", error);
//     return null;
//   }
// }



  // Ensure sessionId persists
  // const [sessionId] = useState(() => {
  //   let stored = localStorage.getItem("sessionId");
  //   if (!stored) {
  //     stored = uuidv4();
  //     localStorage.setItem("sessionId", stored);
  //   }
  //   return stored;
  // });


  const [isLoading, setIsLoading] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (messageText: string) => {

     // Cancel any existing request
     if (abortControllerRef.current) {
     abortControllerRef.current.abort();
     }
    
     const controller = new AbortController();
     abortControllerRef.current = controller;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      isBot: false,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    setIsChatStarted(true);

    const email = ((await getUserProfile()).email).toLocaleLowerCase();
    const sessionId = localStorage.getItem("session_id");

    console.log(email);
    console.log(messageText);
    console.log(sessionId);

    const API_BASE_URL = import.meta.env.VITE_YACHIYO_API_BASE_UR;
    try {
      // const formData = new FormData();
      // formData.append("query", messageText);
      // formData.append("sessionId", sessionId);   // 🔹 add session
      // if (file) {
      //   formData.append("fileId", file.name);    // 🔹 track file
      //   formData.append("files", file);
      // }

      const payload = {
                        user_id: email,             //"test_user",
                        session_id: sessionId,   //sessionId,
                        query: messageText,
                        
                      };

      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
         headers: { 
               'Content-Type': 'application/json',
               },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // const data = await response.json();
      // console.log('Received response data:', data);

      const text = await response.text();

      const messageIdMatch = text.match(/\[message_id:([a-f0-9-]+)\]/i);
      const messageId = messageIdMatch ? messageIdMatch[1] : null;

setSelectedMessageId(messageId);

//localStorage.setItem("session_id", messageId);

//console.log("Full response text:", text);
console.log("Extracted message_id:", messageId);




      let data;
      try {
        // Try parsing as JSON
        data = JSON.parse(text);
      } catch {
        // If it's plain text, wrap it into JSON manually
        console.warn("Received plain text response:", text);
        data = { type: "text", response: text };
      }
        

      let botMessage: Message;

        // Handle file or normal text responses
        if (data.results) {
          console.log("Processing file upload response");
          const results = data.results;
          botMessage = {
            id: (Date.now() + 1).toString(),
            text: results.type === "text" ? results.answer : "",
            tableData: results.type === "table"
              ? { columns: results.columns, rows: results.rows }
              : undefined,
            isBot: true,
            timestamp: new Date(),
          };
        } else {
          console.log("Processing regular query response");
          botMessage = {
            id: (Date.now() + 1).toString(),
            text: data.type === "text" ? data.response : "", // now works even if plain text
            tableData: data.type === "table"
              ? { columns: data.columns, rows: data.rows }
              : undefined,
            isBot: true,
            timestamp: new Date(),
          };
        }
        
        setMessages((prev) => [...prev, botMessage]);
    }
    
    catch (error) {
      console.error('Error fetching response:', error);

      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I\'m having trouble connecting to the chat service. Please try again later.',
        isBot: true,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorResponse]);

      toast({
        title: "Connection Error",
        description: "Failed to connect to the chat API",
        variant: "destructive",
      });
    } 
    finally {
      setIsLoading(false);
    }
  };
  
  
  const handleLike = async (messageId: string) => {
    setMessages(prev => prev.map(msg =>
      msg.id === messageId
        ? { ...msg, isLiked: !msg.isLiked, isDisliked: false }
        : msg
    ));

    const API_BASE_URL = import.meta.env.VITE_YACHIYO_API_BASE_UR;
    await fetch(`${API_BASE_URL}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message_id: messageId, type: "like" })
    });

    toast({
      title: "Feedback recorded",
      description: "Thank you for your positive feedback!",
    });
  };

  const handleDislike = async (messageId: string) => {
    setMessages(prev => prev.map(msg =>
      msg.id === messageId
        ? { ...msg, isDisliked: !msg.isDisliked, isLiked: false }
        : msg
    ));



    const API_BASE_URL = import.meta.env.VITE_YACHIYO_API_BASE_UR;
    await fetch(`${API_BASE_URL}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message_id: messageId, type: "dislike" })
    });

    toast({
      title: "Feedback recorded",
      description: "I'll work on improving my responses.",
      variant: "destructive",
    });
  };

  const handleFeedback = (_messageId: string) => {
    //setSelectedMessageId(messageId);
    setFeedbackModalOpen(true);
  };

  const handleFeedbackSubmit = async (rating: number, comment: string) => {
    const email = ((await getUserProfile()).email).toLocaleLowerCase();
    const sessionId = localStorage.getItem("session_id");
    console.log(rating);
    console.log(comment);

    const API_BASE_URL = import.meta.env.VITE_YACHIYO_API_BASE_UR;
    if (selectedMessageId) {
      // await fetch(`${API_BASE_URL}/feedback`, {
      await fetch(`${API_BASE_URL}/submit-feedback-question`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
               user_id: email,
               session_id: sessionId,
               message_id: selectedMessageId,
               type: "feedback",
               rating:rating,
               feedback: comment
             }),
        
        
        // body: JSON.stringify({
        //   message_id: selectedMessageId,
        //   type: "feedback",
        //   rating,
        //   comment
        // })
      });
    }

    toast({
      title: "Feedback submitted",
      description: `Thank you for your ${rating}-star rating and feedback!`,
    });
  };

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  // reference setter to avoid 'declared but never read' warnings until used
  void setIsSidebarOpen;

  // Function to export data to Excel
  const exportToExcel = (columns: string[], rows: (string | number)[][], fileName: string) => {
    const worksheetData = [columns, ...rows]; // first row = headers
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  };

  const handleNewChat = () => {

   
  //console.log("🔄 Resetting Chat...");

     // Cancel ongoing fetch if any
  if (abortControllerRef.current) {
    abortControllerRef.current.abort();
    abortControllerRef.current = null;
  }


  // Reset chat states
  setMessages([]);
  setFile(null);
  setIsChatStarted(false);
  setIsLoading(false);
  setFeedbackModalOpen(false);
  setSelectedMessageId(null);
  setIsSpeaking(false);
  isSpeakingRef.current = false;
  activeSpeechMessageId.current = null;

  // Optional: scroll to top
  if (messagesEndRef.current) {
    messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
  }

//  console.log("✅ Chat reset complete");
};




 return (
  <div
    className={`transition-all duration-50 flex flex-col bg-gradient-ambient
      ${isChatStarted ? "h-[100vh]" : "h-[55vh]"}
      ${isSidebarOpen ? "ml-[260px]" : "ml-[0px]"}
    `}
  >

    {/* Scrollable messages section */}
    <div
      className={`flex-1 overflow-y-auto mt-5`}
    >
      <div className="mx-auto border border-white/20"
        style={{ width: "768px", borderRadius: "8px" }}
      >
        {messages.map((message) => (
          <div key={message.id}>
            <MessageBubble
              message={message.text}
              isBot={message.isBot}
              onLike={() => handleLike(message.id)}
              onDislike={() => handleDislike(message.id)}
              onFeedback={() => handleFeedback(message.id)}
              onCopy={() => handleCopy(message.id, message.text)}
              onSpeak={() => handleSpeak(message.id, message.text)}
              isLiked={message.isLiked}
              isDisliked={message.isDisliked}
            />

            {message.tableData && (
              <div className="mt-3">
                {/* Download Button */}
                <div className="flex justify-end mb-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-gray-600 border-gray-300 hover:bg-gray-200"
                    onClick={() =>
                      exportToExcel(
                        message.tableData!.columns,
                        message.tableData!.rows,
                        `table_export_${message.id}`
                      )
                    }
                  >
                    <img src={download_icon} />
                  </Button>
                </div>

                {/* DataTable */}
                <DataTable
                  columns={message.tableData.columns}
                  rows={message.tableData.rows}
                />
              </div>
            )}
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex gap-3 p-4">
            <div
              className="bg-card p-2 rounded-2xl rounded-tl-sm flex items-center justify-center"
              style={{
                border: "1px solid #D9D9D9",
                borderRadius: "8px",
                height: "66px",
              }}
            >
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse" />
                <div
                  className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse"
                  style={{ animationDelay: "0.2s" }}
                />
                <div
                  className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse"
                  style={{ animationDelay: "0.4s" }}
                />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />

        {messages.length === 0 && (
          <div
            className="flex flex-col items-center justify-center text-center"
            style={{ marginTop: "26vh" }}
          >
            <p className="text-gray-500 mt-2 text-4xl">Ready when you are</p>
          </div>
        )}
      </div>
    </div>

    {/* Fixed input area */}
    <div className=" bg-gradient-ambient sticky bottom-0">
      <div className="p-0 pt-0 mx-auto" style={{ width: "768px" }}>
        <div className="max-w-3xl mx-auto">
          <ChatInput
            onSendMessage={handleSendMessage}
            onFileChange={setFile}
            file={file}
            disabled={isLoading}
          />
        </div>
      </div>
    </div>

    {/* Feedback Modal */}
    <FeedbackModal
      isOpen={feedbackModalOpen}
      onClose={() => setFeedbackModalOpen(false)}
      onSubmit={handleFeedbackSubmit}
    />
  </div>
);

};