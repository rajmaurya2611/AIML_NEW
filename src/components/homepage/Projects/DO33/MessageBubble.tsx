import React from 'react';
import { Message } from './types_do33/chat';
import { ThumbsUp, ThumbsDown, Copy, MessageSquareDiff, Volume2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface MessageBubbleProps {
  message: Message;
  onLike: (messageId: string) => void;
  onDislike: (messageId: string) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onLike, onDislike }) => {
  const isUser = message.sender === 'user';

  const handleLike = async () => {
    onLike(message.id); // existing callback
    try {
      await fetch(`${import.meta.env.VITE_DO33_API_BASE_URL}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ liked: true })
      });
    } catch (error) {
      console.error("❌ Failed to send like feedback:", error);
    }
  };

  const handleDislike = async () => {
    onDislike(message.id); // existing callback
    try {
      await fetch(`${import.meta.env.VITE_DO33_API_BASE_URL}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disliked: true })
      });
    } catch (error) {
      console.error("❌ Failed to send dislike feedback:", error);
    }
  };
    



  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[95%] md:max-w-[85%] lg:max-w-[75%] rounded-2xl p-4 ${isUser
        ? 'bg-chat-red text-white rounded-br-none'
        : 'text-gray-800 rounded-bl-none'
        }`}>
        {isUser ? (
          <p className="text-sm">{message.content}</p>
        ) : (
          <div>
            <div className="chat-markdown">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
            {/* {message.sources && message.sources.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-semibold mb-2 text-gray-700">📂 Source files:</p>
                <div className="flex flex-wrap gap-2">
                  {message.sources.map((source) => (
                    <a
                      key={source.url}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block bg-chat-red text-white px-3 py-1 rounded-md text-sm hover:bg-chat-red-dark"
                    >
                      📄 {source.file}
                    </a>
                  ))}
                </div>
              </div>
            )} */}

            {message.sources && message.sources.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-semibold mb-2 text-gray-800">📂 Source files used (click to view):</p>
                <div className="flex flex-wrap gap-2">
                  {message.sources.map((source) => (
                    <a
                      key={source.url}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block bg-gray-200 text-gray-800 px-3 py-1 rounded-md text-sm hover:bg-gray-300 transition-colors"
                    >
                      📄 {source.file}
                    </a>
                  ))}
                </div>
              </div>
            )}


            {/* Feedback buttons */}
            <div className="flex justify-end mt-2 pt-2 border-t border-gray-200/50">
              <div className="flex gap-2">
                <button
                  // onClick={() => onLike(message.id)}
                  onClick={handleLike}
                  className={`p-1 rounded-full transition-colors ${message.liked ? 'bg-green-100 text-green-600' : 'text-gray-400 hover:text-green-600'
                    }`}
                  aria-label="Like"
                >
                  <ThumbsUp className="w-4 h-4" />
                </button>
                <button
                  // onClick={() => onDislike(message.id)}
                  onClick={handleDislike}
                  className={`p-1 rounded-full transition-colors ${message.disliked ? 'bg-red-100 text-chat-red' : 'text-gray-400 hover:text-chat-red'
                    }`}
                  aria-label="Dislike"
                >
                    <ThumbsDown className="w-4 h-4" />
                </button>
                <button className={`p-1 rounded-full transition-colors ${message.disliked ? 'bg-red-100 text-chat-red' : 'text-gray-400 hover:text-chat-red'
                    }`}
                  aria-label="Copy">
                    <Copy className="w-4 h-4" />
                </button>
                  
                   <button className={`p-1 rounded-full transition-colors ${message.disliked ? 'bg-red-100 text-chat-red' : 'text-gray-400 hover:text-chat-red'
                    }`}
                  aria-label="Feedback">
                    <MessageSquareDiff className="w-4 h-4" />
                </button>
                   <button className={`p-1 rounded-full transition-colors ${message.disliked ? 'bg-red-100 text-chat-red' : 'text-gray-400 hover:text-chat-red'
                    }`}
                  aria-label="Speak">
                    <Volume2 className="w-4 h-4" />
                </button>
                  {/* <button
                  onClick={() => setShowFeedback((prev) => !prev)}
                  className="p-1 rounded-full transition-colors text-gray-400 hover:text-blue-600"
                  aria-label="Give Feedback"
                  title="Give Feedback"
                >
                  <MessageSquare className="w-4 h-4" />
                </button> */}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;


















