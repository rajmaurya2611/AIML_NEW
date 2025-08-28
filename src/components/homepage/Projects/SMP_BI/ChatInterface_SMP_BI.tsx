import { useState } from "react";
import ChatHeader from "./ChatHeader_SMP_BI";
import WelcomeMessage_SMP_BI from "./WelcomeMessage_SMP_BI";
import ChatMessage from "./ChatMessage_SMP_BI";
import ChatInput from "./ChatInput_SMP_BI";

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  isTable?: boolean;
  tableData?: {
    headers: string[];
    rows: string[][];
  };
}

const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const handleSendMessage = async (message: string, files?: File[]) => {
    if (!message.trim() && !files?.length) return;

    // Add user message
    setMessages(prev => [...prev, { id: Date.now().toString(), text: message || `Uploaded ${files?.length} file(s)`, isBot: false }]);
    setIsTyping(true);

    // Prepare form data
    const formData = new FormData();
    formData.append("message", message || "");
    files?.forEach((file) => {
      formData.append("files", file);
    });

    try {
      const res = await fetch(`${import.meta.env.VITE_SMP_BI_BASE_URL}/chat`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      let botMessage;

      if (data.response?.type === "table") {
        botMessage = {
          id: (Date.now() + 1).toString(),
          text: "", // no plain text
          isBot: true,
          isTable: true,
          tableData: {
            headers: data.response.columns,
            rows: data.response.rows,
          },
        };
      } else {
        botMessage = {
          id: (Date.now() + 1).toString(),
          text: typeof data.response === "string" ? data.response : JSON.stringify(data.response),
          isBot: true,
        };
      }

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), text: "Error contacting backend", isBot: true }]);
    }
    setIsTyping(false);
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <ChatHeader />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4">
          {messages.length === 0 ? (
            <WelcomeMessage_SMP_BI />
          ) : (
            <div className="py-6">
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message.text}
                  isBot={message.isBot}
                  isTable={message.isTable}
                  tableData={message.tableData}
                />
              ))}

              {isTyping && (
                <div className="flex gap-3 justify-start mb-6">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                      <div className="h-4 w-4 text-primary-foreground text-xs">•••</div>
                    </div>
                  </div>
                  <div className="bg-card text-card-foreground border border-border rounded-lg px-4 py-3">
                    <div className="flex gap-1">
                      <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce"></div>
                      <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                      <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <ChatInput onSendMessage={handleSendMessage} disabled={isTyping} />
    </div>
  );
};

export default ChatInterface;