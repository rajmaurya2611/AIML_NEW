// import  { useState, useEffect } from 'react';
// import { v4 as uuidv4 } from 'uuid';
// import { Message, ChatOption } from '../types_do33/chat';
// import ChatHeader from '../ChatHeader';
// import ChatContainer from '../ChatContainer';
// import ChatInput from '../ChatInput';
// import { useToast } from '../hooks_do33/use-toast';
 
// const Index = () => {
//   const [messages, setMessages] = useState<Message[]>([]);
//   const [isLoading, setIsLoading] = useState(false);
//   const { toast } = useToast();
//     // Modification
//     useEffect(() => {
//     // fetch("http://10.245.146.250:5006/reset_session", {
//         fetch(`${import.meta.env.VITE_DO33_API_BASE_URL}/reset_session`, {
//       method: "POST",
//       credentials: "include", 
//     });
//     // Optionally, also clear frontend messages state
//     setMessages([]);
//   }, []);

//     ////////////////////////////////////////
 
//   // Mock API call - in a real app, this would call your backend
//   const sendMessageToBackend = async (content: string, option: ChatOption) => {
//     setIsLoading(true);
 
//     try {
//       const res = await fetch(`${import.meta.env.VITE_DO33_API_BASE_URL}/chat`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           query: content,
//           reasoning: option === "reasoning",
//           web: option === "web-search"
//         }),
//           credentials: 'include'  // <-- THIS IS CRUCIAL!
//       });
 
//       if (!res.ok) throw new Error("API error");
 
//       const data = await res.json();
//       const finalAnswer = data.final || "No response generated.";
 
//       const botMessage: Message = {
//         id: uuidv4(),
//         content: finalAnswer,
//         sender: 'bot',
//         timestamp: new Date(),
//         sources: data.sources || [], 
//       };
 
 
//       setMessages(prev => [...prev, botMessage]);
 
//     } catch (error) {
//       toast({
//         title: "Error",
//         description: "Failed to get response from server.",
//         variant: "destructive",
//       });
//       console.error("Backend error:", error);
//     } finally {
//       setIsLoading(false);
//     }
//   };
 
//   const handleSendMessage = (content: string, option: ChatOption) => {
//     const userMessage: Message = {
//       id: uuidv4(),
//       content,
//       sender: 'user',
//       timestamp: new Date(),
//     };
 
//     setMessages(prev => [...prev, userMessage]);
//     sendMessageToBackend(content, option);
//   };
 
//   const handleLike = (messageId: string) => {
//     setMessages(prev =>
//       prev.map(msg => {
//         if (msg.id === messageId) {
//           // If already liked, remove the like
//           if (msg.liked) {
//             return { ...msg, liked: false, disliked: false, feedbackGiven: false };
//           }
//           // Otherwise set it to liked
//           return { ...msg, liked: true, disliked: false, feedbackGiven: true };
//         }
//         return msg;
//       })
//     );
 
//     toast({
//       title: "Thank you!",
//       description: "Your feedback has been recorded.",
//     });
//   };
 
//   const handleDislike = (messageId: string) => {
//     setMessages(prev =>
//       prev.map(msg => {
//         if (msg.id === messageId) {
//           // If already disliked, remove the dislike
//           if (msg.disliked) {
//             return { ...msg, liked: false, disliked: false, feedbackGiven: false };
//           }
//           // Otherwise set it to disliked
//           return { ...msg, liked: false, disliked: true, feedbackGiven: true };
//         }
//         return msg;
//       })
//     );
 
//     toast({
//       title: "Feedback received",
//       description: "We'll use your feedback to improve.",
//     });
//   };
 
//   return (
//     <div className="min-h-screen flex flex-col">
//       <ChatHeader />
 
//       <main className="flex-1 flex flex-col max-w-5xl w-full mx-auto px-4 sm:px-6 py-4">
//         <div className="chat-wrapper flex-1 flex flex-col rounded-xl overflow-hidden shadow-sm">
//           <ChatContainer
//             messages={messages}
//             isLoading={isLoading}
//             onLike={handleLike}
//             onDislike={handleDislike}
//           />
//           <div className="p-4">
//             <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
//                 <div className="text-xs text-muted-foreground mt-2 text-center">
//                     💡 For best results, include details like title, purpose, section, process, company, or unit in your query.
//                 </div>

//           </div>
//         </div>
//       </main>
//     </div>
//   );
// };
 
// export default Index;



// src/apps/do33/components/Index.tsx
import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { Message, ChatOption } from "../types_do33/chat";
import ChatHeader from "../ChatHeader";
import ChatContainer from "../ChatContainer";
import ChatInput from "../ChatInput";
import { useToast } from "../hooks_do33/use-toast";

import { getUserEmail } from "../getUsersEmail";              // ⬅️ NEW
// keep the existing helper
//import { VITE_DO33_API_BASE_URL } from "vite/env";           // type-safety

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();


  /* Reset session on mount */
  useEffect(() => {
    fetch(`${import.meta.env.VITE_DO33_API_BASE_URL}/reset_session`, {
      method: "POST",
      credentials: "include",
    });
    setMessages([]);
  }, []);

  /* ---- MAIN BACKEND CALL ---- */
  const sendMessageToBackend = async (content: string, option: ChatOption) => {
    setIsLoading(true);

    try {
      /* ① Get the e-mail once — becomes session_id */
      const email = await getUserEmail();

      /* ② Post to backend with session_id */
      const res = await fetch(`${import.meta.env.VITE_DO33_API_BASE_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: content,
          reasoning: option === "reasoning",
          web: option === "web-search",
          session_id: email,                    // <-- NEW FIELD
        }),
        credentials: "include",
      });

      if (!res.ok) throw new Error("API error");

      const data = await res.json();
      const finalAnswer = data.final || "No response generated.";

      const botMessage: Message = {
        id: uuidv4(),
        content: finalAnswer,
        sender: "bot",
        timestamp: new Date(),
        sources: data.sources || [],
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to get response from server.",
        variant: "destructive",
      });
      console.error("Backend error:", error);
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

  /* Likes / dislikes unchanged */
  const handleLike = (messageId: string) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId
          ? {
              ...msg,
              liked: !msg.liked,
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
              disliked: !msg.disliked,
              liked: false,
              feedbackGiven: !msg.disliked,
            }
          : msg
      )
    );
    toast({ title: "Feedback received", description: "We'll use your feedback to improve." });
  };

  /* Save, clear, stop handlers (unchanged) */
  

  /* ---- JSX ---- */
  return (
    <div className="min-h-screen flex flex-col">
      <ChatHeader />

      <main className="flex-1 flex flex-col max-w-5xl w-full mx-auto px-4 sm:px-6 py-4">
        <div className="chat-wrapper flex-1 flex flex-col rounded-xl overflow-hidden shadow-sm">
          <ChatContainer
            messages={messages}
            isLoading={isLoading}
            onLike={handleLike}
            onDislike={handleDislike}
          />

          <div className="p-4">
            <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
            <div className="text-xs text-muted-foreground mt-2 text-center">
              💡 For best results, include details like title, purpose, section, process, company, or unit in your query.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;






































