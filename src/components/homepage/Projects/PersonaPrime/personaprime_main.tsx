// App.tsx
import { useState, useRef } from "react";
import ChatWindow from "./ChatWindow";
import { getChatbotResponse } from "./api_personaprime/api";
import { PlaceholdersAndVanishInput } from "./placeholders-and-vanish-input";
import Header from "./Header";

export interface Message {
  text: string;
  sender: "user" | "bot";
  timestamp: string;
}

export default function PersonaPrimeMain() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [temperature, setTemperature] = useState(0.95);
  const messageContainerRef = useRef<HTMLDivElement>(null);
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

    // Add user message and bot placeholder
    setMessages((prev) => [...prev, userMessage, botTyping]);

    try {
      // Send both message and temperature to the backend API
      const botReply = await getChatbotResponse(message, temperature);
      let index = 0;
      const typingMessage: Message = {
        text: "",
        sender: "bot",
        timestamp: "",
      };

      // Simulate typing effect for the bot reply
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
      }, 5);
    } catch {
      const errorMessage: Message = {
        text: "Something went wrong!",
        sender: "bot",
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev.slice(0, -1), errorMessage]);
    }
  };

  const handleSaveChats = () => {
    const dataStr = messages
      .map((msg) => `[${msg.timestamp}] ${msg.sender.toUpperCase()}: ${msg.text}`)
      .join("\n");
    const blob = new Blob([dataStr], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = "chats.txt";
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleClearChats = () => {
    setMessages([]);
  };

  const handleStopResponse = () => {
    if (botResponseIntervalRef.current !== null) {
      clearInterval(botResponseIntervalRef.current);
      botResponseIntervalRef.current = null;
    }
  };

  // Update temperature when Header notifies about changes
  const handleTemperatureChange = (newTemp: number) => {
    setTemperature(newTemp);
    // console.log("Temperature updated to:", newTemp);
  };

  return (
    <div className="flex flex-col h-screen bg-white text-black">
      <Header 
        onSave={handleSaveChats} 
        onClear={handleClearChats} 
        onStop={handleStopResponse} 
        onTemperatureChange={handleTemperatureChange}
      />
      <div ref={messageContainerRef} className="flex-grow overflow-y-auto p-4 space-y-2">
        <ChatWindow messages={messages} />
      </div>
      <div className="p-4">
        <PlaceholdersAndVanishInput 
          placeholders={[
            "Hello, I am Persona Bot!", 
            "Ask me something "
          ]}
          onSubmit={(e) => {
            e.preventDefault();
            const input = e.currentTarget.querySelector("input");
            if (input?.value.trim()) {
              handleSend(input.value);
              input.value = "";
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