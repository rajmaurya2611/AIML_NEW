import React, { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import { Message } from './types_do33/chat';

interface ChatContainerProps {
  messages: Message[];
  isLoading: boolean;
  onLike: (messageId: string) => void;
  onDislike: (messageId: string) => void;
}

const ChatContainer: React.FC<ChatContainerProps> = ({
  messages,
  isLoading,
  onLike,
  onDislike
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="welcome-wrapper flex-1 overflow-y-auto px-4">
      <div className="max-w-5xl mx-auto">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4 py-12">
            <div className="w-16 h-16 mb-6 rounded-full flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-8 h-8 text-chat-icon"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h3 className="welcome-heading mb-1">Welcome to <span className='welcome-heading-gradient gradient-animation'>Motherson!</span></h3>
            <p className="welcome-text max-w-sm">
              Hi there! How can I help you today?
            </p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                onLike={onLike}
                onDislike={onDislike}
              />
            ))}
            {isLoading && (
              <div className="flex justify-start mb-4">
                <div className="bg-gray-100 rounded-2xl rounded-bl-none p-4">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 rounded-full bg-chat-red/60 animate-pulse"></div>
                    <div className="w-2 h-2 rounded-full bg-chat-red/60 animate-pulse" style={{ animationDelay: "0.2s" }}></div>
                    <div className="w-2 h-2 rounded-full bg-chat-red/60 animate-pulse" style={{ animationDelay: "0.4s" }}></div>
                  </div>
                </div>
              </div>
              
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default ChatContainer;





















// import React, { useEffect, useRef } from 'react';
// import MessageBubble from './MessageBubble';
// import { Message } from '../types/chat';

// interface ChatContainerProps {
//   messages: Message[];
//   isLoading: boolean;
//   onLike: (messageId: string) => void;
//   onDislike: (messageId: string) => void;
// }

// const ChatContainer: React.FC<ChatContainerProps> = ({
//   messages,
//   isLoading,
//   onLike,
//   onDislike
// }) => {
//   const messagesEndRef = useRef<HTMLDivElement>(null);

//   // Auto-scroll to bottom on new messages
//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//   }, [messages]);

//   return (
//     <div className="welcome-wrapper flex-1 overflow-y-auto px-4">
//       <div className="max-w-5xl mx-auto">
//         {messages.length === 0 ? (
//           <div className="h-full flex flex-col items-center justify-center text-center px-4 py-12">
//             <div className="w-16 h-16 mb-6 rounded-full flex items-center justify-center">
//               <svg
//                 xmlns="http://www.w3.org/2000/svg"
//                 viewBox="0 0 24 24"
//                 fill="none"
//                 stroke="currentColor"
//                 strokeWidth="2"
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//                 className="w-8 h-8 text-chat-icon"
//               >
//                 <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
//               </svg>
//             </div>
//             <h3 className="welcome-heading mb-1">Welcome to <span className='welcome-heading-gradient gradient-animation'>Motherson!</span></h3>
//             <p className="welcome-text max-w-sm">
//               Ask me anything! AI Chatbot with advanced reasoning and web search capabilities.
//             </p>
//           </div>
//         ) : (
//           <>
//             {messages.map((message) => (
//               <MessageBubble
//                 key={message.id}
//                 message={message}
//                 onLike={onLike}
//                 onDislike={onDislike}
//               />
//             ))}
//             {isLoading && (
//               <div className="flex justify-start mb-4">
//                 <div className="bg-gray-100 rounded-2xl rounded-bl-none p-4">
//                   <div className="flex space-x-2">
//                     <div className="w-2 h-2 rounded-full bg-chat-red/60 animate-pulse"></div>
//                     <div className="w-2 h-2 rounded-full bg-chat-red/60 animate-pulse" style={{ animationDelay: "0.2s" }}></div>
//                     <div className="w-2 h-2 rounded-full bg-chat-red/60 animate-pulse" style={{ animationDelay: "0.4s" }}></div>
//                   </div>
//                 </div>
//               </div>
//             )}
//           </>
//         )}
//         <div ref={messagesEndRef} />
//       </div>
//     </div>
//   );
// };

// export default ChatContainer;
