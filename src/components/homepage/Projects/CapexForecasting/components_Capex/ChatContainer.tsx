import React, { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import { Message } from '../types_Capex/chat';

interface ChatContainerProps {
  messages: Message[];
  isLoading: boolean;
  onLike: (messageId: string) => void;
  onDislike: (messageId: string) => void;
  onMenuOptionClick: (messageId: string, option: { id: string; text: string }) => void;
}

const ChatContainer: React.FC<ChatContainerProps> = ({
  messages,
  isLoading,
  onLike,
  onDislike,
  onMenuOptionClick
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
          <div className="h-full flex flex-col items-center justify-center text-center px-4 ">
            <div className="w-16 h-16 mb-6 rounded-full flex items-center justify-center">
              {/* Optional SVG */}
            </div>
            <h3 className="welcome-heading-capex mb-1">
              <span className='welcome-heading-gradient-capex gradient-animation'>CAPEX Forecasting</span>
            </h3>
            <p className="welcome-text-capex">
              Smarter Conversations. Measurable Outcomes.
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
                onMenuOptionClick={onMenuOptionClick}
              />

            ))}
            {isLoading && (
              <div className="mb-4">
                <div className="bg-gray-100 rounded-2xl rounded-bl-none p-4">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 rounded-full bg-chat-red/60 animate-pulse"></div>
                    <div
                      className="w-2 h-2 rounded-full bg-chat-red/60 animate-pulse"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                    <div
                      className="w-2 h-2 rounded-full bg-chat-red/60 animate-pulse"
                      style={{ animationDelay: "0.4s" }}
                    ></div>
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
