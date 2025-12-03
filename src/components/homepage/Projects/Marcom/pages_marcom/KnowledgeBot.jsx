import "./KnowledgeBot.css";
import ChatBox from "./ChatBox";
import { useState } from "react";

function KnowledgeBot({messages, setMessages, inputMessage, setInputMessage, knowledgeHistoryMessages, setKnowledgeHistoryMessages,personaHistoryMessages,setPersonaHistoryMessages}) {
  const [externalPrompt, setExternalPrompt] = useState("");

  return (
    <div className="Knowledge-bot-container">
      {/* Title always shown on top */}
      {(!messages.length && !knowledgeHistoryMessages.length) && (
        <div className="knowledge-bot-title-container">
          <h1 className="knowledge-bot-title">MyInsight</h1>
          <h1 className="knowledge-bot-description">
            Smart Support for Motherson Insights
          </h1>
          <div className="marcom-example-prompt-container">
            <div className="marcom-example-prompt" onClick={() => setExternalPrompt("Get the latest updates on Motherson")}>
              <p>Get the latest updates on Motherson</p>
            </div>
            <div className="marcom-example-prompt" onClick={() => setExternalPrompt("Extract information and set creativity for response")}>
              <p>Extract information and set creativity for response</p>
            </div>
            <div className="marcom-example-prompt" onClick={() => setExternalPrompt("Search policies, documents and posts")}>
              <p>Search policies, documents and posts</p>
            </div>
            <div className="marcom-example-prompt" onClick={() => setExternalPrompt("Create meaningful communication")}>
              <p>Create meaningful communication</p>
            </div>
          </div>
        </div>)
      }
      {/* Chat Section */}
      <ChatBox 
        useCase="KnowledgeBot"
        messages={messages}
        setMessages={setMessages}
        inputMessage={inputMessage}
        setInputMessage={setInputMessage}
        knowledgeHistoryMessages={knowledgeHistoryMessages}
        personaHistoryMessages={personaHistoryMessages}
        onExternalPrompt={externalPrompt} 
      />
    </div>
  );
}

export default KnowledgeBot;
