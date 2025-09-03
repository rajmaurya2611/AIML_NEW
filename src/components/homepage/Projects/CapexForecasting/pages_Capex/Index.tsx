import { useState, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { Message } from "../types_Capex/chat";
import ChatHeader from "../components_Capex/ChatHeader";
import ChatContainer from "../components_Capex/ChatContainer";
import ChatInput from "../components_Capex/ChatInput";
import { useToast } from "../hooks_Capex/use-toast";
import { motion } from "framer-motion";
 
const frequentPrompts = [
  "Total Investment for FY 25/26",
  "Total Investment for next 3 years?",
  "Quarterly Investment for FY 25-26",
];
 
const AnimatedPrompts = ({
  onPromptClick,
}: {
  onPromptClick: (query: string) => void;
}) => (
  <div className="frequent-prompts flex justify-start gap-4 mb-2">
    {frequentPrompts.map((prompt, index) => (
      <motion.button
        key={prompt}
        className="cursor-pointer select-none hover:bg-chat-red hover:text-white text-gray-800 px-3 py-1 rounded transition"
        onClick={() => onPromptClick(prompt)}
        initial={{ y: 0 }}
        animate={{ y: [0, -10, 0] }}
        transition={{
          delay: index * 0.3,
          repeat: 0,
          duration: 0.6,
          ease: "easeInOut",
        }}
      >
        {prompt}
      </motion.button>
    ))}
  </div>
);
 
const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
 
  // These maintain session context with the backend
  const sessionIdRef = useRef<string | null>(null);
 // const [selection, setSelection] = useState<string | null>(null);
 
  // Send message to backend and handle different response types
  const sendMessageToBackend = async (content: string | null) => {
    setIsLoading(true);
    try {
      let payload: any = { user_id: 123 };
      if (content !== null) payload.message = content;
      if (sessionIdRef.current) payload.session_id = sessionIdRef.current;
 
      const res = await fetch(`${import.meta.env.VITE_CAPEX_BASE_URL}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
 
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();
 
      // Update sessionId if present
      if (data.session_id) sessionIdRef.current = data.session_id;
 
      // Handle menu type
      if (data.type === "menu" && Array.isArray(data.options)) {
        const menuMessage: Message = {
          id: uuidv4(),
          content:
            "Please select any one of the options to help me get responses from:",
          sender: "bot",
          timestamp: new Date(),
          options: data.options.map((opt: any) => ({
            id: opt.id,
            text: opt.text,
          })),
        };
        setMessages((prev) => [...prev, menuMessage]);
        //setSelection(null);
        return;
      }
 
      // Handle clarification type
      if (data.type === "clarification") {
        //setSelection(data.selection ?? null);
        setMessages((prev) => [
          ...prev,
          {
            id: uuidv4(),
            content: data.message || "",
            sender: "bot",
            timestamp: new Date(),
          },
        ]);
        return;
      }
 
      // Handle result type
      if (data.type === "result") {
        const parts = [];
 
  if (data.bp_table_md) {
    parts.push(`### 📊 My Investment (BP)\n\n${data.bp_table_md}`);
  }
  if (data.bet_table_md) {
    parts.push(`### 👥 Customer Investment (BET)\n\n${data.bet_table_md}`);
  }
  if (data.total_table_md) {
    parts.push(`### 💰 Total Investment\n\n${data.total_table_md}`);
  }
  if (data.message) {
    parts.push(`### ℹ️ Note\n\n${data.message}`);
  }
 
  const resultContent = parts.join("\n\n"); // join with spacing// join with spacing
        setMessages((prev) => [
          ...prev,
          {
            id: uuidv4(),
            content: resultContent,
            sender: "bot",
            timestamp: new Date(),
            sources: [],
          },
        ]);
       // setSelection(null);
        return;
      }
 
      // Fallback for other types
      const text =
        data?.response?.message ?? data?.message ?? JSON.stringify(data);
 
      setMessages((prev) => [
        ...prev,
        {
          id: uuidv4(),
          content: text,
          sender: "bot",
          timestamp: new Date(),
          sources: [],
        },
      ]);
    } catch (error) {
      console.error("Backend error:", error);
      toast({
        title: "Error",
        description: "Failed to get response from server.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
 
  // Standard text input submit (or clarification)
  const handleSendMessage = (content: string) => {
    const userMessage: Message = {
      id: uuidv4(),
      content,
      sender: "user",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    sendMessageToBackend(content);
  };
 
  // Frequent prompt quick send
  const handlePromptClick = async (query: string) => {
    const userMessage: Message = {
      id: uuidv4(),
      content: query,
      sender: "user",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    await sendMessageToBackend(query);
  };
 
  // Handle user selecting a menu CTA
  const handleMenuOptionClick = async (messageId: string, option: { id: string; text: string }) => {
    // Add user selection message
    const userSelectionMsg: Message = {
      id: uuidv4(),
      content: option.text,
      sender: "user",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userSelectionMsg]);
   
 
    await sendMessageToBackend(option.id);
 
    // Optionally mark options as selected (or remove them) in original bot message
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId
          ? {
              ...msg,
              options: [],
              content: `${msg.content} (Selected: ${option.text})`,
            }
          : msg
      )
    );
  };
 
  const handleLike = (messageId: string) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId
          ? {
              ...msg,
              liked: msg.liked ? false : true,
              disliked: false,
              feedbackGiven: !msg.liked,
            }
          : msg
      )
    );
    toast({
      title: "Thank you!",
      description: "Your feedback has been recorded.",
    });
  };
 
  const handleDislike = (messageId: string) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId
          ? {
              ...msg,
              disliked: msg.disliked ? false : true,
              liked: false,
              feedbackGiven: !msg.disliked,
            }
          : msg
      )
    );
    toast({
      title: "Feedback received",
      description: "We'll use your feedback to improve.",
    });
  };
 
  return (
    <div className="min-h-screen flex flex-col">
      <ChatHeader />
      <main className="flex-1 flex flex-col max-w-5xl w-full mx-auto px-4 sm:px-6 py-4">
        <div className="capex-chat-wrapper flex-1 flex flex-col rounded-xl overflow-hidden shadow-sm">
          <ChatContainer
            messages={messages}
            isLoading={isLoading}
            onLike={handleLike}
            onDislike={handleDislike}
            onMenuOptionClick={handleMenuOptionClick}
          />
          <div className="p-4 input-wrappper">
            <AnimatedPrompts onPromptClick={handlePromptClick} />
            <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
          </div>
        </div>
      </main>
    </div>
  );
};
 
export default Index;
 
 