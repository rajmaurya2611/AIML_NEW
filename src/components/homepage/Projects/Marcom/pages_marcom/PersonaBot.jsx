import "./PersonaBot.css";
import ChatBox from "./ChatBox";
import { useState } from "react";

function PersonaBot({messages, setMessages, inputMessage, setInputMessage, sliderValue, knowledgeHistoryMessages, setKnowledgeHistoryMessages,personaHistoryMessages,setPersonaHistoryMessages, setShowSlider}) {
  const [externalPrompt, setExternalPrompt] = useState("");
  return (
    <div className="persona-bot-container" onClick={()=>setShowSlider(false)}>
      {/* Title always shown on top */}
      {(!messages.length && !personaHistoryMessages.length)&&(
        <div className="persona-bot-title-container">
          <h1 className="persona-bot-title">MyEcho</h1>
          <h1 className="persona-bot-description">
            Turning context into personal responses
          </h1>
          <div className="marcom-persona-example-prompt-container">
            <div className="marcom-persona-example-prompt" onClick={() => setExternalPrompt("Responses crafted in the tone you choose.")}>
              <p>Responses crafted in the tone you choose.</p>
            </div>
            <div className="marcom-persona-example-prompt" onClick={() => setExternalPrompt("Provide details to enrich your content")}>
              <p>Provide details to enrich your content</p>
            </div>
            <div className="marcom-persona-example-prompt" onClick={() => setExternalPrompt("Create speeches, posts, keynotes, and more")}>
              <p>Create speeches, posts, keynotes, and more</p>
            </div>
            <div className="marcom-persona-example-prompt" onClick={() => setExternalPrompt("Set creativity bar as you like")}>
              <p>Set creativity bar as you like</p>
            </div>
          </div>
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
        onExternalPrompt={externalPrompt} 
      />
    </div>
  );
}

export default PersonaBot;
