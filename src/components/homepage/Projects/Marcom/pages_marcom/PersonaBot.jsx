import "./PersonaBot.css";
import ChatBox from "./ChatBox";

function PersonaBot({messages, setMessages, inputMessage, setInputMessage, sliderValue, knowledgeHistoryMessages, setKnowledgeHistoryMessages,personaHistoryMessages,setPersonaHistoryMessages, setShowSlider}) {

  return (
    <div className="persona-bot-container" onClick={()=>setShowSlider(false)}>
      {/* Title always shown on top */}
      {(!messages.length && !personaHistoryMessages.length)&&(
        <div className="persona-bot-title-container">
          <h1 className="persona-bot-title">Persona Bot</h1>
          <h1 className="persona-bot-description">
            Post Creating Assistant
          </h1>
        </div>
      )}

      {/* Chat Section */}
      <ChatBox 
        useCase="PersonaBot"
        messages={messages}
        setMessages={setMessages}
        inputMessage={inputMessage}
        setInputMessage={setInputMessage}
        sliderValue={sliderValue}
        knowledgeHistoryMessages={knowledgeHistoryMessages}
        personaHistoryMessages={personaHistoryMessages}
      />
    </div>
  );
}

export default PersonaBot;
