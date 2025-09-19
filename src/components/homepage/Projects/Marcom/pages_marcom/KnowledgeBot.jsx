import "./KnowledgeBot.css";
import ChatBox from "./ChatBox";

function KnowledgeBot({messages, setMessages, inputMessage, setInputMessage, knowledgeHistoryMessages, setKnowledgeHistoryMessages,personaHistoryMessages,setPersonaHistoryMessages}) {

  return (
    <div className="Knowledge-bot-container">
      {/* Title always shown on top */}
      {(!messages.length && !knowledgeHistoryMessages.length) && (
        <div className="knowledge-bot-title-container">
          <h1 className="knowledge-bot-title">Knowledge Bot</h1>
          <h1 className="knowledge-bot-description">
            Intelligent Monitoring Assistant
          </h1>
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
      />
    </div>
  );
}

export default KnowledgeBot;
