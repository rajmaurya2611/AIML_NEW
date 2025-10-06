import "./HomePage.css";
import KnowledgeBot from "./KnowledgeBot";
import PersonaBot from "./PersonaBot";

function HomePage({ activeBot, 
                    sliderValue=0.5,
                    setActiveBot,
                    knowledgeMessages, 
                    setKnowledgeMessages,
                    knowledgeInput, 
                    setKnowledgeInput,
                    personaMessages,
                    setPersonaMessages,
                    personaInput,
                    setPersonaInput,
                    knowledgeHistoryMessages,
                    setKnowledgeHistoryMessages,
                    personaHistoryMessages,
                    setPersonaHistoryMessages,
                    setShowSlider
                }) {
  return (
    <div className="marcom-homepage">
      {activeBot === "knowledge" ? (
        <KnowledgeBot
          messages={knowledgeMessages}
          setMessages={setKnowledgeMessages}
          inputMessage={knowledgeInput}
          setInputMessage={setKnowledgeInput}
          knowledgeHistoryMessages={knowledgeHistoryMessages}
          setKnowledgeHistoryMessages={setKnowledgeHistoryMessages}
          personaHistoryMessages={personaHistoryMessages}
          setPersonaHistoryMessages={setPersonaHistoryMessages}
          
        />
      ) : (
        <PersonaBot
          messages={personaMessages}
          setMessages={setPersonaMessages}
          inputMessage={personaInput}
          setInputMessage={setPersonaInput}
          sliderValue={sliderValue}
          knowledgeHistoryMessages={knowledgeHistoryMessages}
          setKnowledgeHistoryMessages={setKnowledgeHistoryMessages}
          personaHistoryMessages={personaHistoryMessages}
          setPersonaHistoryMessages={setPersonaHistoryMessages}
          setShowSlider={setShowSlider}
        />
      )}
    </div>
  );
}

export default HomePage;
