// App_marcom.jsx
import { useState, useEffect } from "react";
import Sidebar from "./components_marcom/sidebar";
import Header from "./components_marcom/Header";
import HomePage from "./pages_marcom/HomePage";
import { getUserEmail } from "./okta/getUsersEmail";

function App_marcom() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Persona Bot temperature
  const [sliderValue, setSliderValue] = useState(0.5);
  const [headerTitle, setHeaderTitle] = useState("Knowledge Bot");

  // Live chat state
  const [knowledgeMessages, setKnowledgeMessages] = useState([]);
  const [knowledgeInput, setKnowledgeInput] = useState("");
  const [personaMessages, setPersonaMessages] = useState([]);
  const [personaInput, setPersonaInput] = useState("");

  // Which bot is active
  const [activeBot, setActiveBot] = useState("knowledge");

  // Histories
  const [knowledgeHistoryMessages, setKnowledgeHistoryMessages] = useState([]);
  const [personaHistoryMessages, setPersonaHistoryMessages] = useState([]);

  // ✅ Okta session email (session_id)
  const [sessionEmail, setSessionEmail] = useState(null);

  // Load Okta email once
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const email = await getUserEmail();
        if (mounted) setSessionEmail(email);
      } catch (e) {
        console.warn("Okta email fetch failed:", e);
        if (mounted) setSessionEmail(null);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // --- History loaders (use sessionEmail) ---
  const loadKnowledgeHistory = async (sessionId) => {
    if (!sessionId) return;
    try {
      const res = await fetch(
        `${import.meta.env.VITE_MARCOM_BASE_URL_KNOWLEDGE}/history`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: sessionId }),
        }
      );
      if (!res.ok) throw new Error("Failed to fetch knowledge history");
      const data = await res.json();
      setKnowledgeHistoryMessages(data.items || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadPersonaHistory = async (sessionId) => {
    if (!sessionId) return;
    try {
      const res = await fetch(
        `${import.meta.env.VITE_MARCOM_BASE_URL_PERSONA}/chat_history`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: sessionId }),
        }
      );
      if (!res.ok) throw new Error("Failed to fetch persona history");
      const data = await res.json();
      // backend returns an array; normalize if needed
      setPersonaHistoryMessages(Array.isArray(data) ? data : data.items || []);
    } catch (err) {
      console.error(err);
    }
  };

  // Auto-load both histories as soon as sessionEmail is known
  useEffect(() => {
    if (!sessionEmail) return;
    loadKnowledgeHistory(sessionEmail);
    loadPersonaHistory(sessionEmail);
  }, [sessionEmail]);

  return (
    <div className="flex">
      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        sliderValue={sliderValue}
        setSliderValue={setSliderValue}
        headerTitle={headerTitle}
        setHeaderTitle={setHeaderTitle}
        activeBot={activeBot}
        setActiveBot={setActiveBot}
        setKnowledgeHistoryMessages={setKnowledgeHistoryMessages}
        setPersonaHistoryMessages={setPersonaHistoryMessages}
        loadKnowledgeHistory={loadKnowledgeHistory}
        loadPersonaHistory={loadPersonaHistory}
        sessionEmail={sessionEmail} // ⬅️ in case Sidebar needs to refresh by user action
      />

      {/* Main Content */}
      <div className="flex-1">
        <Header
          isSidebarOpen={isSidebarOpen}
          headerTitle={headerTitle}
          knowledgeMessages={knowledgeMessages}
          personaMessages={personaMessages}
          sessionEmail={sessionEmail}
        />
        <div className="p-6">
          <HomePage
            activeBot={activeBot}
            sliderValue={sliderValue}
            setActiveBot={setActiveBot}
            knowledgeMessages={knowledgeMessages}
            setKnowledgeMessages={setKnowledgeMessages}
            knowledgeInput={knowledgeInput}
            setKnowledgeInput={setKnowledgeInput}
            personaMessages={personaMessages}
            setPersonaMessages={setPersonaMessages}
            personaInput={personaInput}
            setPersonaInput={setPersonaInput}
            knowledgeHistoryMessages={knowledgeHistoryMessages}
            setKnowledgeHistoryMessages={setKnowledgeHistoryMessages}
            personaHistoryMessages={personaHistoryMessages}
            setPersonaHistoryMessages={setPersonaHistoryMessages}
            sessionEmail={sessionEmail} // ⬅️ pass down if children need it
          />
        </div>
      </div>
    </div>
  );
}

export default App_marcom;


// import { useState, useEffect } from "react";
// import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// import Sidebar from "./components_marcom/sidebar";
// import Header from "./components_marcom/Header";
// import HomePage from "./pages_marcom/HomePage";

// function App_marcom() {
//   const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
//   // Value to be passed in slider (Persona Bot)
//   const [sliderValue, setSliderValue] = useState(0.5);
//   const [headerTitle, setHeaderTitle]=useState("Knowledge Bot");

//   // Knoledge bot messages state
//   const [knowledgeMessages, setKnowledgeMessages] = useState([]);
//   const [knowledgeInput, setKnowledgeInput] = useState("");

//   // Persona bot messages state
//   const [personaMessages, setPersonaMessages] = useState([]);
//   const [personaInput, setPersonaInput] = useState("");


//   // which bot is active
//   const [activeBot, setActiveBot] = useState("knowledge");

//   // History Messages 
//   const [knowledgeHistoryMessages, setKnowledgeHistoryMessages] = useState([]);
//   const [personaHistoryMessages, setPersonaHistoryMessages] = useState([]);

//   // load history from API
//   const loadKnowledgeHistory = async (sessionId) => {
//     console.log("Knowledge history")
//     try {
//       // "http://10.245.146.151:5006/history" 
//       const res = await fetch(`${import.meta.env.VITE_MARCOM_BASE_URL_KNOWLEDGE}/history`, { 
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({ session_id: sessionId }),
//       });

//       if (!res.ok) throw new Error("Failed to fetch history");

//       const data = await res.json();
//       // console.log(data.items);
//       setKnowledgeHistoryMessages(data.items || []); // backend should return { messages: [...] }
//       // console.log(knowledgeHistoryMessages);
//     } catch (err) {
//         console.error(err);
//     } finally {
//       // setLoading(false);
//     }
//   };

//    const loadPersonaHistory = async (sessionId) => {
//     try {
//       // "http://10.245.146.250:8794/chat_history"
//       const res = await fetch(`${import.meta.env.VITE_MARCOM_BASE_URL_PERSONA}/chat_history`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({ session_id: sessionId }),
//       });

//       if (!res.ok) throw new Error("Failed to fetch history");

//       const data = await res.json();
//       setPersonaHistoryMessages(data || []); // backend should return { messages: [...] }
//     } catch (err) {
//         console.error(err);
//     } finally {
//       // setLoading(false);
//     }
//   };
//   return (
//       <div className="flex">
//         {/* Sidebar */}
//         <Sidebar isOpen={isSidebarOpen} 
//                   setIsOpen={setIsSidebarOpen} 
//                   sliderValue={sliderValue} 
//                   setSliderValue={setSliderValue} 
//                   headerTitle={headerTitle} 
//                   setHeaderTitle={setHeaderTitle} 
//                   activeBot={activeBot} 
//                   setActiveBot={setActiveBot}
//                   setKnowledgeHistoryMessages={setKnowledgeHistoryMessages}
//                   setPersonaHistoryMessages={setPersonaHistoryMessages}
//                   loadKnowledgeHistory={loadKnowledgeHistory}
//                   loadPersonaHistory={loadPersonaHistory}
//                   />

//         {/* Main Content Area */}
//         <div className="flex-1">
//           {/* Header */}
//           <Header isSidebarOpen={isSidebarOpen} headerTitle={headerTitle} knowledgeMessages={knowledgeMessages} personaMessages={personaMessages}/>
//           <div className="p-6">
//             <HomePage 
//               activeBot={activeBot} 
//               sliderValue={sliderValue} 
//               setActiveBot={setActiveBot} 
//               knowledgeMessages={knowledgeMessages} 
//               setKnowledgeMessages={setKnowledgeMessages} 
//               knowledgeInput={knowledgeInput} 
//               setKnowledgeInput={setKnowledgeInput} 
//               personaMessages={personaMessages}
//               setPersonaMessages={setPersonaMessages}
//               personaInput={personaInput}
//               setPersonaInput={setPersonaInput}
//               knowledgeHistoryMessages={knowledgeHistoryMessages}
//               setKnowledgeHistoryMessages={setKnowledgeHistoryMessages}
//               personaHistoryMessages={personaHistoryMessages}
//               setPersonaHistoryMessages={setPersonaHistoryMessages}
//               />
//           </div>
//         </div>
//       </div>
//   );
// }

// export default App_marcom;
