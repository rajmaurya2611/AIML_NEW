// Version 1.2 — static markdown response instead of API
import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { Message, ChatOption } from "../types_Capex/chat";
import ChatHeader from "../components_Capex/ChatHeader";
import ChatContainer from "../components_Capex/ChatContainer";
import ChatInput from "../components_Capex/ChatInput";
import { useToast } from "../hooks_Capex/use-toast";

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const sendMessageToBackend = async (content: string, option: ChatOption) => {
    // Mark as intentionally unused (keeps signature compatible with callers)
    void option;

    setIsLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_CAPEX_BASE_URL}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: content }),
      });

      if (!res.ok) throw new Error(`API error: ${res.status}`);

      // ✅ backend returns markdown
      const markdown = await res.text();

      const botMessage: Message = {
        id: uuidv4(),
        content: markdown,
        sender: "bot",
        timestamp: new Date(),
        sources: [],
      };

      setMessages((prev) => [...prev, botMessage]);
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

  const handleSendMessage = (content: string, option: ChatOption) => {
    const userMessage: Message = {
      id: uuidv4(),
      content,
      sender: "user",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    sendMessageToBackend(content, option);
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
    toast({ title: "Thank you!", description: "Your feedback has been recorded." });
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
          />
          <div className="p-4 input-wrappper">
            <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
