import { useState, useEffect } from "react";
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

      // 2️⃣ Menu
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

        // Chart details
        // if (data.bp_chart) {
        //   console.log("BP Chart Data:", data.bp_chart);
        //   const bpChartMsg: Message = {
        //     id: uuidv4(),
        //     content: data.bp_chart.title || "Here’s the BP chart:",
        //     sender: "bot",
        //     timestamp: new Date(),
        //     chart: {
        //       type: data.bp_chart.chartType || "bar",
        //       data: data.bp_chart.data,
        //       keys: Object.keys(data.bp_chart.data[0]).filter(
        //         (k) => k !== "name" && k !== "formattedValue"
        //       ),
        //     },
        //   };
        //   setMessages((prev) => [...prev, bpChartMsg]);
        // }
        // if (data.bet_chart) {
        //   const betChartMsg: Message = {
        //     id: uuidv4(),
        //     content: data.bet_chart.title || "Here’s the BET chart:",
        //     sender: "bot",
        //     timestamp: new Date(),
        //     chart: {
        //       type: data.bet_chart.chartType || "bar",
        //       data: data.bet_chart.data,
        //       keys: Object.keys(data.bet_chart.data[0]).filter(
        //         (k) => k !== "name" && k !== "formattedValue"
        //       ),
        //     },
        //   };
        //   setMessages((prev) => [...prev, betChartMsg]);
        // }
        if (data.bp_chart && data.bp_line_chart) {

           // Prepare keys arrays for bars and lines
  const bpBarKeys = Object.keys(data.bp_chart.data[0] || {}).filter(k => k !== 'name' && k !== 'formattedValue');
  const bpLineKeys = Object.keys(data.bp_line_chart.data[0] || {}).filter(k => k !== 'name' && k !== 'formattedValue');
          setMessages((prev) => [
            ...prev,
            {
              id: uuidv4(),
              content: data.bp_chart.title || "BP Bar Chart",
              sender: "bot",
              timestamp: new Date(),
              chartConfig: { ...data.bp_chart, barDataKeys: bpBarKeys },
            },
            {
              id: uuidv4(),
              content: data.bp_line_chart.title || "BP Line Chart",
              sender: "bot",
              timestamp: new Date(),
              chartConfig: { ...data.bp_line_chart, lineDataKeys: bpLineKeys },
            },
          ]);
        } else if (data.bet_chart && data.bet_line_chart) {
           const betBarKeys = Object.keys(data.bet_chart.data[0] || {}).filter(k => k !== 'name' && k !== 'formattedValue');
  const betLineKeys = Object.keys(data.bet_line_chart.data[0] || {}).filter(k => k !== 'name' && k !== 'formattedValue');
          setMessages((prev) => [
            ...prev,
            {
              id: uuidv4(),
              content: data.bet_chart.title || "BET Bar Chart",
              sender: "bot",
              timestamp: new Date(),
              chartConfig: { ...data.bet_chart, barDataKeys: betBarKeys },
            },
            {
              id: uuidv4(),
              content: data.bet_line_chart.title || "BET Line Chart",
              sender: "bot",
              timestamp: new Date(),
              chartConfig: { ...data.bet_line_chart, lineDataKeys: betLineKeys },
            },
          ]);
        }
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

  // User message
  const handleSendMessage = (
    content: string
  ) => {
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

  // Frequent prompt
  const handlePromptClick = async (query: string) => {
    if (!sessionEmail) {
      pushMissingEmailMessage();
      return;
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
            <ChatInput
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              queryType={queryType}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
