"use client";
 
import { useState, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { Message } from "../types_Capex/chat";
import ChatHeader from "../components_Capex/ChatHeader";
import ChatContainer from "../components_Capex/ChatContainer";
import ChatInput from "../components_Capex/ChatInput";
import { useToast } from "../hooks_Capex/use-toast";
import { motion } from "framer-motion";
 
// ✅ Okta helper (adjust path if needed)
import { getUserEmail } from "../okta/getUsersEmail";
 
const frequentPrompts = [
  "BP (MPP Investment)",
  "BET (Customer Investment)",
  "Total Investment (BP + BET)",
];
 
const AnimatedPrompts = ({
  onPromptClick,
  showPrompts,
}: {
  onPromptClick: (query: string) => void;
  showPrompts: boolean;
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
    </div>
  </div>
);
 
const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
 
  // Input is disabled on first paint; unlock on CTA click (so user can type), or on file select.
  const [isInputEnabled, setIsInputEnabled] = useState(false);
  const hasEnabledOnceRef = useRef(false); // prevent toggling back off
 
  // Show CTAs on first load (after silent Exit)
  const [showPrompts, setShowPrompts] = useState(false);
 
  const { toast } = useToast();
  const [queryType] = useState(0);
 
  // 🔐 Okta email is the ONLY session identifier
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
 
  // Fire "Exit" silently once on first load
  const didFireExitRef = useRef(false);
 
  // When a CTA is clicked, we store its text here to auto-resolve against the next menu
  const pendingCTARef = useRef<string | null>(null);
 
  // Track if the user has chosen a file once (for future logic if needed)
  const hasChosenFileRef = useRef(false);
 
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
 
  useEffect(() => {
    if (!sessionEmail) return;
    if (didFireExitRef.current) return;
 
    didFireExitRef.current = true;
    setShowPrompts(true); // show CTAs on first load
    void sendMessageToBackend("Exit", { silent: true }); // discard response
  }, [sessionEmail]);
 
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
 
  const sendMessageToBackend = async (
    content: string | null,
    opts?: { silent?: boolean }
  ) => {
    const silent = !!opts?.silent;
 
    if (!sessionEmail) {
      if (!silent) {
        toast({
          title: "Authentication issue",
          description:
            "Your Okta session email isn’t available. Please re-login and try again.",
          variant: "destructive",
        });
        pushMissingEmailMessage();
      }
      return;
    }
 
    if (!silent) setIsLoading(true);
    try {
      const payload: any = {};
      if (content !== null) payload.message = content;
      payload.session_id = sessionEmail;
 
      const res = await fetch(`${import.meta.env.VITE_CAPEX_BASE_URL}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();
 
      if (silent) return;
 
      // ---- AUTO-RESOLVE CTA → MENU OPTION (by text match) ----
      if (data.type === "menu" && Array.isArray(data.options)) {
        const cta = pendingCTARef.current;
        if (cta) {
          const match = data.options.find((opt: any) => {
            const a = (opt.text || "").trim().toLowerCase();
            const b = cta.trim().toLowerCase();
            return a === b || a.includes(b) || b.includes(a);
          });
 
          if (match?.id) {
            // Clear pending CTA and auto-send the selected option id without showing menu
            pendingCTARef.current = null;
            await sendMessageToBackend(match.id);
            return;
          }
        }
 
        // No CTA pending or no match → show the menu as normal
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
        return;
      }
 
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
        return;
      }
 
      if (data.type === "result") {
        const parts: string[] = [];
        if (data.bp_table_md) parts.push(`### Motherson Investment (BP)\n\n${data.bp_table_md}`);
        if (data.bet_table_md) parts.push(`### Customer Investment (BET)\n\n${data.bet_table_md}`);
        if (data.total_table_md) parts.push(`### Total Investment\n\n${data.total_table_md}`);
        if (data.message) parts.push(`### Note\n\n${data.message}`);
 
        const resultContent = parts.join("\n\n");
        setMessages((prev) => [
          ...prev,
          { id: uuidv4(), content: resultContent, sender: "bot", timestamp: new Date(), sources: [] },
        ]);
 
        const newMessages: Message[] = [];
 
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
        // if (data.bp_line_chart) {
        //   const bpLineKeys = Object.keys(data.bp_line_chart.data[0] || {}).filter(
        //     (k) => k !== "name" && k !== "formattedValue"
        //   );
        //   newMessages.push({
        //     id: uuidv4(),
        //     content: data.bp_line_chart.title || "BP Line Chart",
        //     sender: "bot",
        //     timestamp: new Date(),
        //     chartConfig: { ...data.bp_line_chart, lineDataKeys: bpLineKeys },
        //   });
        // }
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
        // if (data.bet_line_chart) {
        //   const betLineKeys = Object.keys(data.bet_line_chart.data[0] || {}).filter(
        //     (k) => k !== "name" && k !== "formattedValue"
        //   );
        //   newMessages.push({
        //     id: uuidv4(),
        //     content: data.bet_line_chart.title || "BET Line Chart",
        //     sender: "bot",
        //     timestamp: new Date(),
        //     chartConfig: { ...data.bet_line_chart, lineDataKeys: betLineKeys },
        //   });
        // }
        if (newMessages.length > 0) {
          setMessages((prev) => [...prev, ...newMessages]);
          return;
        }
        return;
      }
 
      const text = data?.response?.message ?? data?.message ?? JSON.stringify(data);
      setMessages((prev) => [
        ...prev,
        { id: uuidv4(), content: text, sender: "bot", timestamp: new Date(), sources: [] },
      ]);
    } catch (error) {
      console.error("Backend error:", error);
      if (!silent) {
        toast({ title: "Error", description: "Failed to get response from server.", variant: "destructive" });
      }
    } finally {
      if (!silent) setIsLoading(false);
    }
  };
 
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
    sendMessageToBackend(content);
  };
 
  // ✅ CTA click: enable input immediately, hide CTAs, remember CTA to auto-resolve
  const handlePromptClick = async (query: string) => {
    if (!sessionEmail) {
      pushMissingEmailMessage();
      return;
    }
 
    setShowPrompts(false);
 
    // Unlock typing as soon as a CTA is chosen (one-time)
    if (!hasEnabledOnceRef.current) {
      hasEnabledOnceRef.current = true;
      setIsInputEnabled(true);
    }
 
    // Store CTA so that when backend sends a menu, we auto-pick the matching option
    pendingCTARef.current = query;
 
    const userMessage: Message = {
      id: uuidv4(),
      content: query,
      sender: "user",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
 
    await sendMessageToBackend(query);
  };
 
  // File menu selection → normal flow; we also mark that files were chosen once
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
 
    hasChosenFileRef.current = true;
 
    await sendMessageToBackend(option.id);
 
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId
          ? { ...msg, options: [], content: `${msg.content} (Selected: ${option.text})` }
          : msg
      )
    );
  };
 
  const handleLike = (messageId: string) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId
          ? { ...msg, liked: msg.liked ? false : true, disliked: false, feedbackGiven: !msg.liked }
          : msg
      )
    );
    toast({ title: "Thank you!", description: "Your feedback has been recorded." });
  };
 
  const handleDislike = (messageId: string) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId
          ? { ...msg, disliked: msg.disliked ? false : true, liked: false, feedbackGiven: !msg.disliked }
          : msg
      )
    );
    toast({ title: "Feedback received", description: "We'll use your feedback to improve." });
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
            <AnimatedPrompts onPromptClick={handlePromptClick} showPrompts={showPrompts} />
            <ChatInput
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              queryType={queryType}
              disabled={!isInputEnabled}
            />
          </div>
        </div>
      </main>
    </div>
  );
};
 
export default Index;
 