import { useState, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { Message } from "../types_Capex/chat";
import ChatHeader from "../components_Capex/ChatHeader";
import ChatContainer from "../components_Capex/ChatContainer";
import ChatInput from "../components_Capex/ChatInput";
import { useToast } from "../hooks_Capex/use-toast";
import { motion } from "framer-motion";
 
// ✅ Okta helper (adjust the path if yours differs)
import { getUserEmail } from "../okta/getUsersEmail";
 
const frequentPrompts = [
  "BP (MPP Investment)",
  "BET (Customer Investment)",
  "Total Investment (BP + BET)",
];
 
const AnimatedPrompts = ({
  onPromptClick,
  showPrompts,
  // showExit,
}: {
  onPromptClick: (query: string) => void;
  showPrompts: boolean;
  // showExit: boolean;
}) => (
  <div className="frequent-prompts flex justify-between gap-4 mb-2">
    <div className="area-of-interests-cta">
      {showPrompts &&
        frequentPrompts.map((prompt, index) => (
          <motion.button
            key={prompt}
            className="cursor-pointer select-none hover:bg-chat-red hover:text-white text-gray-800 px-3 py-1 rounded transition mr-2 font-bold"
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
    <div className="exit-cta">
      {(
        <div className="relative group inline-block">
          <motion.button
            className="cursor-pointer select-none hover:bg-chat-red hover:text-white text-gray-800 px-3 py-1 rounded transition font-bold"
            onClick={() => onPromptClick("Exit")}
            initial={{ y: 0 }}
            animate={{ y: [0, -10, 0] }}
            transition={{
              delay: 1,
              repeat: 0,
              duration: 0.6,
              ease: "easeInOut",
            }}
          >
            Exit
          </motion.button>
          <div
            className="absolute bottom-full mb-2 left-[-100px] -translate-x-1/2 hidden group-hover:block
    text-sm text-[#858585] bg-gray-100 rounded shadow-lg
    px-3 py-2 text-left whitespace-normal break-words
    min-w-[320px] w-full"
          >
            Click this to exit from your area of interest
          </div>
        </div>
      )}
    </div>
  </div>
);
 
const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
 
  // Start directly in post-Exit UI
  const [isInputEnabled, setIsInputEnabled] = useState(true);
  const [showPrompts, setShowPrompts] = useState(false);
  // Gate typing until a file type is chosen from the Exit menu
  const [awaitingFileType, setAwaitingFileType] = useState(false);
 
  const { toast } = useToast();
  const [queryType] = useState(0);
 
  // 🔐 Okta email is the ONLY session identifier
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
 
  // Resolve Okta email once
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const email = await getUserEmail();
        if (mounted) setSessionEmail(email ? email.toLowerCase() : null);
      } catch (e) {
        console.warn("Could not fetch Okta email:", e);
        if (mounted) setSessionEmail(null);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);
 
  // one-time guard (handles React StrictMode double effects too)
  const autoExitOnce = useRef(false);
 
  // 🔁 Auto-fire Exit to backend once sessionEmail is available
  useEffect(() => {
    if (!sessionEmail || autoExitOnce.current) return;
    autoExitOnce.current = true;
 
    // keep UI in post-Exit state
    setIsInputEnabled(true);
    setShowPrompts(false);
 
    // Disable typing until file type chosen (we expect a menu back)
    setAwaitingFileType(true);
 
    // DO NOT add a user "Exit" message; just hit backend to fetch its response
    (async () => {
      await sendMessageToBackend("Exit");
    })();
  }, [sessionEmail]);
 
  // ⛑️ Push a visible bot message when email is missing
  const pushMissingEmailMessage = () => {
    setMessages((prev) => [
      ...prev,
      {
        id: uuidv4(),
        content:
          "⚠️ Authentication issue: No Okta email detected. Please re-login with Okta to continue.",
        sender: "bot",
        timestamp: new Date(),
      },
    ]);
  };
 
  // Send message to backend and handle different response types
  const sendMessageToBackend = async (content: string | null) => {
    if (!sessionEmail) {
      toast({
        title: "Authentication issue",
        description:
          "Your Okta session email isn’t available. Please re-login and try again.",
        variant: "destructive",
      });
      pushMissingEmailMessage();
      return;
    }
 
    setIsLoading(true);
    try {
      const payload: any = {};
      if (content !== null) payload.message = content;
 
      // ✅ Always set session_id to Okta email (single source of truth)
      payload.session_id = sessionEmail;
 
      const res = await fetch(`${import.meta.env.VITE_CAPEX_BASE_URL}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();
 
      // 2️⃣ Menu (likely the Exit file-type selection)
      if (data.type === "menu" && Array.isArray(data.options)) {
        const menuMessage: Message = {
          id: uuidv4(),
          content: `Please select your area of interest:`,
          sender: "bot",
          timestamp: new Date(),
          options: data.options.map((opt: any) => ({
            id: opt.id,
            text: opt.text,
          })),
        };
        setMessages((prev) => [...prev, menuMessage]);
 
        // Keep textarea disabled until an option is chosen
        setAwaitingFileType(true);
        return;
      }
 
      // 3️⃣ Clarification
      if (data.type === "clarification") {
        setMessages((prev) => [
          ...prev,
          {
            id: uuidv4(),
            content: data.message || "",
            sender: "bot",
            timestamp: new Date(),
          },
        ]);
        // No file-type gate here
        setAwaitingFileType(false);
        return;
      }
 
      // 4️⃣ Result
      if (data.type === "result") {
        const parts: string[] = [];
        if (data.bp_table_md) {
          parts.push(`### Motherson Investment (BP)\n\n${data.bp_table_md}`);
        }
 
        if (data.bet_table_md) {
          parts.push(`### Customer Investment (BET)\n\n${data.bet_table_md}`);
        }
 
        if (data.total_table_md) {
          parts.push(`### Total Investment\n\n${data.total_table_md}`);
        }
        if (data.message) {
          parts.push(`### Note\n\n${data.message}`);
        }
 
        const resultContent = parts.join("\n\n");
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
 
        const newMessages: Message[] = [];
 
        // ✅ BP Charts
        if (data.bp_chart) {
          const bpBarKeys = Object.keys(data.bp_chart.data[0] || {}).filter(
            (k) => k !== "name" && k !== "formattedValue"
          );
          newMessages.push({
            id: uuidv4(),
            content: data.bp_chart.title || "BP Bar Chart",
            sender: "bot",
            timestamp: new Date(),
            chartConfig: { ...data.bp_chart, barDataKeys: bpBarKeys },
          });
        }
        if (data.bp_line_chart) {
          const bpLineKeys = Object.keys(data.bp_line_chart.data[0] || {}).filter(
            (k) => k !== "name" && k !== "formattedValue"
          );
          newMessages.push({
            id: uuidv4(),
            content: data.bp_line_chart.title || "BP Line Chart",
            sender: "bot",
            timestamp: new Date(),
            chartConfig: { ...data.bp_line_chart, lineDataKeys: bpLineKeys },
          });
        }
 
        // ✅ BET Charts
        if (data.bet_chart) {
          const betBarKeys = Object.keys(data.bet_chart.data[0] || {}).filter(
            (k) => k !== "name" && k !== "formattedValue"
          );
          newMessages.push({
            id: uuidv4(),
            content: data.bet_chart.title || "BET Bar Chart",
            sender: "bot",
            timestamp: new Date(),
            chartConfig: { ...data.bet_chart, barDataKeys: betBarKeys },
          });
        }
        if (data.bet_line_chart) {
          const betLineKeys = Object.keys(data.bet_line_chart.data[0] || {}).filter(
            (k) => k !== "name" && k !== "formattedValue"
          );
          newMessages.push({
            id: uuidv4(),
            content: data.bet_line_chart.title || "BET Line Chart",
            sender: "bot",
            timestamp: new Date(),
            chartConfig: { ...data.bet_line_chart, lineDataKeys: betLineKeys },
          });
        }
 
        if (newMessages.length > 0) {
          setMessages((prev) => [...prev, ...newMessages]);
        }
 
        // Result means file-type gate is not needed
        setAwaitingFileType(false);
        return;
      }
 
      // 5️⃣ Fallback
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
 
      // Fallback: remove gate
      setAwaitingFileType(false);
    } catch (error) {
      console.error("Backend error:", error);
      toast({
        title: "Error",
        description: "Failed to get response from server.",
        variant: "destructive",
      });
      // On hard error, also remove gate so the user can retry or re-auth
      setAwaitingFileType(false);
    } finally {
      setIsLoading(false);
    }
  };
 
  // User message
  const handleSendMessage = (content: string) => {
    if (!sessionEmail) {
      pushMissingEmailMessage();
      return;
    }
    const userMessage: Message = {
      id: uuidv4(),
      content,
      sender: "user",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    // keep existing behaviour: send content only to backend
    sendMessageToBackend(content);
  };
 
  // Frequent prompt (manual clicks)
  const handlePromptClick = async (query: string) => {
    if (!sessionEmail) {
      pushMissingEmailMessage();
      return;
    }
 
    if (query === "Exit") {
      setIsInputEnabled(true);
      setShowPrompts(false);
      // lock input until a file type is chosen
      setAwaitingFileType(true);
    } else {
      setIsInputEnabled(true);
      setShowPrompts(false);
    }
 
    const userMessage: Message = {
      id: uuidv4(),
      content: query,
      sender: "user",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    await sendMessageToBackend(query);
  };
 
  // Menu selection
  const handleMenuOptionClick = async (
    messageId: string,
    option: { id: string; text: string }
  ) => {
    if (!sessionEmail) {
      pushMissingEmailMessage();
      return;
    }
    const userSelectionMsg: Message = {
      id: uuidv4(),
      content: option.text,
      sender: "user",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userSelectionMsg]);
 
    await sendMessageToBackend(option.id);
 
    // User has selected a file type → unlock input
    setAwaitingFileType(false);
 
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
            <AnimatedPrompts
              onPromptClick={handlePromptClick}
              showPrompts={showPrompts}
              // showExit={showExit}
            />
            <ChatInput
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              queryType={queryType}
              disabled={!isInputEnabled || awaitingFileType}
            />
          </div>
        </div>
      </main>
    </div>
  );
};
 
export default Index;
 
 