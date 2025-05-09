import { useState, useRef } from "react";
import ChatWindow from "./ChatWindow";
import { getChatbotResponse } from "./api_knowledgekingdom/api";
import { PlaceholdersAndVanishInput } from "./placeholders-and-vanish-input";
import Header from "./Header";

export interface Message {
  text: string;
  sender: "user" | "bot";
  timestamp: string;
}

export default function KnowledgeKingdomMain() {
  const [messages, setMessages] = useState<Message[]>([]);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  
  // Use number | null for the interval reference in browsers
  const botResponseIntervalRef = useRef<number | null>(null);

  const handleSend = async (message: string) => {
    const userMessage: Message = {
      text: message,
      sender: "user",
      timestamp: new Date().toLocaleTimeString(),
    };

    // Temporary bot message for typing effect
    const botTyping: Message = {
      text: "Thinking...",
      sender: "bot",
      timestamp: "",
    };

    // Update state to add user message and bot typing placeholder
    setMessages((prev) => [...prev, userMessage, botTyping]);

    try {
      const botReply = await getChatbotResponse(message);
      let index = 0;
      const typingMessage: Message = {
        text: "",
        sender: "bot",
        timestamp: "",
      };

      // Simulate a typing effect for the bot reply and store the interval
      botResponseIntervalRef.current = window.setInterval(() => {
        typingMessage.text = botReply.slice(0, index);
        setMessages((prev) => [
          ...prev.slice(0, -1),
          { ...typingMessage },
        ]);
        index++;

        if (index > botReply.length) {
          if (botResponseIntervalRef.current !== null) {
            clearInterval(botResponseIntervalRef.current);
            botResponseIntervalRef.current = null;
          }
        }
      }, 3);
    } catch {
      const errorMessage: Message = {
        text: "Something went wrong!",
        sender: "bot",
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev.slice(0, -1), errorMessage]);
    }
  };

  // Handler to save chats as a TXT file
  const handleSaveChats = () => {
    // Format messages as plain text
    const dataStr = messages
      .map(
        (msg) => `[${msg.timestamp}] ${msg.sender.toUpperCase()}: ${msg.text}`
      )
      .join("\n");
    const blob = new Blob([dataStr], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = "chats.txt";
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Handler to clear all chats
  const handleClearChats = () => {
    setMessages([]);
  };

  // Handler to stop the bot's ongoing response
  const handleStopResponse = () => {
    if (botResponseIntervalRef.current !== null) {
      clearInterval(botResponseIntervalRef.current);
      botResponseIntervalRef.current = null;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white text-black">
      {/* Header Section with new actions */}
      <Header 
        onSave={handleSaveChats} 
        onClear={handleClearChats} 
        onStop={handleStopResponse} 
      />

      {/* Message Section */}
      <div
        ref={messageContainerRef}
        className="flex-grow overflow-y-auto p-4 space-y-2"
      >
        <ChatWindow messages={messages} />
      </div>

      {/* Input Section */}
      <div className="p-4">
        <PlaceholdersAndVanishInput 
          placeholders={["Hello I am Motherson Bot!", "Ask something about Motherson"]}
          onSubmit={(e) => {
            e.preventDefault();
            const input = e.currentTarget.querySelector("input");
            if (input?.value.trim()) {
              handleSend(input.value);
              input.value = ""; // Clear the input after sending
            }
          }}
          onChange={(_e) => {
            // No additional handling needed
          }}
        />
      </div>
    </div>
  );
}


//Developed By Raj Maurya