import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { getUserProfile } from '../getUsersEmail';

interface Handlers {
  onNewChat?: () => void;
  onSearchChat?: () => void;
  onSaved?: () => void;
}

interface YachiyoContextType {
  triggerNewChat: () => void;
  triggerSearchChat: () => void;
  triggerSaved: () => void;
  registerHandlers: (handlers: Handlers) => void;
   createNewSession: (userId: string) => Promise<string | null>;
  sessionId: string | null;

   apiResponse: any;
  setApiResponse: (data: any) => void;
}

const YachiyoContext = createContext<YachiyoContextType>({
  triggerNewChat: () => {},
  triggerSearchChat: () => {},
  triggerSaved: () => {},
  registerHandlers: () => {},
  createNewSession: async () => null, // ✅ must return a Promise<string | null>
  sessionId: null,  

   apiResponse: null,
  setApiResponse: () => {},
});

export const YachiyoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [handlers, setHandlers] = useState<Handlers>({});
  const [newChatTriggered, setNewChatTriggered] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const [apiResponse, setApiResponse] = useState<any>(null);

  const API_BASE_URL = import.meta.env.VITE_YACHIYO_API_BASE_URL;



   const createNewSession = useCallback(async (userId: string): Promise<string | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/new_session/${userId}`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to create session");

      const data = await response.json();
      setSessionId(data.session_id);
      localStorage.setItem("session_id", data.session_id);
      console.log("New session:", data.session_id);

      return data.session_id;
    } catch (error) {
      console.error("Error creating session:", error);
      return null;
    }
  }, []);


   // Register page-specific handlers
  const registerHandlers = useCallback((newHandlers: Handlers) => {
    setHandlers(prev => ({ ...prev, ...newHandlers }));
  }, []);

  // Trigger New Chat — used by Sidebar
  const triggerNewChat = useCallback(() => { 
    setNewChatTriggered(true);
  }, []);


  // Consume the trigger once ChatPage is mounted
  useEffect(() => {
    if (newChatTriggered && handlers.onNewChat) {
      handlers.onNewChat();     // perform the reset
      setNewChatTriggered(false); // ✅ clear flag so it doesn’t auto-fire again
    }
  }, [newChatTriggered, handlers]);

  // Direct triggers for others (no navigation issue)
  const triggerSearchChat = useCallback(() => handlers.onSearchChat?.(), [handlers]);
  const triggerSaved = useCallback(() => handlers.onSaved?.(), [handlers]);


 // ---------------------------------------------------
  // ✅ STEP 1 — Create Session Only Once on App Load
  // ---------------------------------------------------
  useEffect(() => {
    const initSession = async () => {
      const stored = localStorage.getItem("session_id");
       console.log("old session:", stored);

      if (stored) {
        // Reuse previous session
        setSessionId(stored);
        return;
      }

      // No session stored → create first session
      try {
        const email = (await getUserProfile()).email.toLowerCase();
        const newId = await createNewSession(email);
         console.log("New session:", newId);

        if (newId) {
          localStorage.setItem("session_id", newId);
          setSessionId(newId);
        }
      } catch (e) {
        console.error("Failed to initialize session:", e);
      }
    };

    initSession();
  }, []); // 🔥 Runs ONCE on first app load



  return (
    <YachiyoContext.Provider
      value={{ triggerNewChat, triggerSearchChat, triggerSaved, registerHandlers ,createNewSession,
        sessionId,apiResponse, setApiResponse,}}
    >
      {children}
    </YachiyoContext.Provider>
  );
};

export const useYachiyoContext = () => useContext(YachiyoContext);