import { useState, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { Message } from "../types_Capex/chat";
import ChatHeader from "../components_Capex/ChatHeader";
import ChatContainer from "../components_Capex/ChatContainer";
import ChatInput from "../components_Capex/ChatInput";
import { useToast } from "../hooks_Capex/use-toast";
import { motion, AnimatePresence } from "framer-motion";

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
  const [isInputEnabled, setIsInputEnabled] = useState(true);
  const [showPrompts, setShowPrompts] = useState(false);
  const [awaitingFileType, setAwaitingFileType] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const { toast } = useToast();
  const [queryType] = useState(0);

  // ✅ Local session ID instead of Okta email
  const [sessionId] = useState<string>(() => {
    const existing = localStorage.getItem("capex_session_id");
    if (existing) return existing;
    const newId = `local_${uuidv4()}`;
    localStorage.setItem("capex_session_id", newId);
    return newId;
  });

  // Splash screen
  useEffect(() => {
    if (!showSplash) return;
    const timer = setTimeout(() => setShowSplash(false), 3000);
    return () => clearTimeout(timer);
  }, [showSplash]);

  const autoExitOnce = useRef(false);

  // Auto-fire "Exit" on mount
  useEffect(() => {
    if (!sessionId || autoExitOnce.current) return;
    autoExitOnce.current = true;

    setIsInputEnabled(true);
    setShowPrompts(false);
    setAwaitingFileType(true);

    (async () => {
      await sendMessageToBackend("Exit");
    })();
  }, [sessionId]);

  const sendMessageToBackend = async (content: string | null) => {
    setIsLoading(true);
    try {
      const payload: any = {};
      if (content !== null) payload.message = content;
      payload.session_id = sessionId; // ✅ Local ID used

      const res = await fetch(`${import.meta.env.VITE_CAPEX_BASE_URL}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();

      // Menu-type
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
        setAwaitingFileType(true);
        return;
      }

      // Clarification
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
        setAwaitingFileType(false);
        return;
      }

      // Result handling
      if (data.type === "result") {
        const parts: string[] = [];
        if (data.bp_table_md)
          parts.push(`### Motherson Investment (BP)\n\n${data.bp_table_md}`);
        if (data.bet_table_md)
          parts.push(`### Customer Investment (BET)\n\n${data.bet_table_md}`);
        if (data.total_table_md)
          parts.push(`### Total Investment\n\n${data.total_table_md}`);
        if (data.message) parts.push(`### Note\n\n${data.message}`);

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

        // BP Charts
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

        // BET Charts
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

        if (newMessages.length > 0)
          setMessages((prev) => [...prev, ...newMessages]);

        setAwaitingFileType(false);
        return;
      }

      // Fallback
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
      setAwaitingFileType(false);
    } catch (error) {
      console.error("Backend error:", error);
      toast({
        title: "Error",
        description: "Failed to get response from server.",
        variant: "destructive",
      });
      setAwaitingFileType(false);
    } finally {
      setIsLoading(false);
    }
  };

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

  const handleMenuOptionClick = async (
    messageId: string,
    option: { id: string; text: string }
  ) => {
    const userSelectionMsg: Message = {
      id: uuidv4(),
      content: option.text,
      sender: "user",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userSelectionMsg]);

    await sendMessageToBackend(option.id);
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
              liked: !msg.liked,
              disliked: false,
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
              disliked: !msg.disliked,
              liked: false,
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
        {showSplash ? (
          <AnimatePresence>
            <motion.div
              key="splash"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.8 }}
              className="fixed inset-0 flex flex-col items-center justify-center bg-white z-50"
            >
              <h3 className="welcome-heading-capex mb-1">
                <span
                  className="welcome-heading-gradient-capex gradient-animation"
                  style={{ fontSize: "32px" }}
                >
                  CAPEX Forecasting
                </span>
              </h3>
              <p className="welcome-text-capex">
                Smarter Conversations. Measurable Outcomes.
              </p>
            </motion.div>
          </AnimatePresence>
        ) : (
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
              />
              <ChatInput
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                queryType={queryType}
                disabled={!isInputEnabled || awaitingFileType}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
