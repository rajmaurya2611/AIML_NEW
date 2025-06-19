 
 
import React, { useState } from 'react';

import { Message } from './types_do33/chat';

import {

  ThumbsUp,

  ThumbsDown,

  Copy,

  MessageSquareDiff,

  Volume2,

} from 'lucide-react';

import ReactMarkdown from 'react-markdown';

import FeedbackModal from './FeedbackModal';
 
// Custom link renderer

type ReactMarkdownProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & { children?: React.ReactNode };

function LinkRenderer(props: ReactMarkdownProps) {

  return (
    <a href={props.href as string} target="_blank" rel="noopener noreferrer">
      {props.children}
    </a>
  );

}
 
interface MessageBubbleProps {

  message: Message;

  onLike: (messageId: string) => void;

  onDislike: (messageId: string) => void;

}
 
const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onLike, onDislike }) => {

  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  const isUser = message.sender === 'user';

  // Ref to track speech synthesis state
  const isSpeakingRef = React.useRef(false);
 
  const handleLike = async () => {

    onLike(message.id);

    try {

      await fetch(`${import.meta.env.VITE_DO33_API_BASE_URL}/feedback`, {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({ messageId: message.id, liked: true }),

      });

    } catch (error) {

      console.error('❌ Failed to send like feedback:', error);

    }

  };
 
  const handleDislike = async () => {

    onDislike(message.id);

    try {

      await fetch(`${import.meta.env.VITE_DO33_API_BASE_URL}/feedback`, {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({ messageId: message.id, disliked: true }),

      });

    } catch (error) {

      console.error('❌ Failed to send dislike feedback:', error);

    }

  };
 
  const handleCopy = (messageId: string) => {

    const messageToCopy = message.content;

    if (!messageToCopy) return;
 
    navigator.clipboard.writeText(messageToCopy)

      .then(() => console.log(`Message ${messageId} copied to clipboard!`))

      .catch((err) => console.error('Failed to copy text:', err));

  };
 
  const handleFeedbackSubmit = async (feedback: string) => {

    try {

      await fetch(`${import.meta.env.VITE_DO33_API_BASE_URL}/feedback`, {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({

          messageId: message.id,

          feedback,

        }),

      });

      console.log('✅ Feedback submitted!');

    } catch (error) {

      console.error('❌ Failed to send detailed feedback:', error);

    }

  };
  
  // Function to speak the given text using the Web Speech API
  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      if (isSpeakingRef.current) {
        window.speechSynthesis.cancel(); // Stop speech if already speaking
        isSpeakingRef.current = false;
      } else {
        window.speechSynthesis.cancel(); // Ensure any previous speech is stopped
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
 
        utterance.onend = () => {
          isSpeakingRef.current = false;
        };
 
        isSpeakingRef.current = true;
        window.speechSynthesis.speak(utterance);
      }
    } else {
      console.warn("Speech Synthesis API not supported in this browser.");
    }
  };
 
  return (
<>
<div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
<div

          className={`max-w-[95%] md:max-w-[85%] lg:max-w-[75%] rounded-2xl p-4 ${

            isUser

              ? 'bg-chat-red text-gray rounded-br-none'

              : 'text-gray-800 rounded-bl-none'

          }`}
>

          {isUser ? (
<p className="text-white">{message.content}</p>

          ) : (
<div>
<div className="chat-markdown">
<ReactMarkdown components={{ a: LinkRenderer }}>

                  {message.content}
</ReactMarkdown>
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
<p className="text-sm font-semibold mb-2 text-gray-800">

                    📂 Source files used (click to view):
</p>
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

                    onClick={handleLike}

                    className={`p-1 rounded-full transition-colors ${

                      message.liked

                        ? 'bg-green-100 text-green-600'

                        : 'text-gray-400 hover:text-green-600'

                    }`}

                    aria-label="Like"
>
<ThumbsUp className="w-4 h-4" />
</button>
<button

                    onClick={handleDislike}

                    className={`p-1 rounded-full transition-colors ${

                      message.disliked

                        ? 'bg-red-100 text-chat-red'

                        : 'text-gray-400 hover:text-chat-red'

                    }`}

                    aria-label="Dislike"
>
<ThumbsDown className="w-4 h-4" />
</button>
<button

                    onClick={() => handleCopy(message.id)}

                    className="p-1 rounded-full transition-colors text-gray-400 hover:text-blue-600"

                    aria-label="Copy"
>
<Copy className="w-4 h-4" />
</button>
<button

                    onClick={() => setShowFeedbackModal(true)}

                    className="p-1 rounded-full transition-colors text-gray-400 hover:text-blue-600"

                    aria-label="Feedback"
>
<MessageSquareDiff className="w-4 h-4" />
</button>
<button
                    onClick={() => speakText(message.content)}
                    className="p-1 rounded-full transition-colors text-gray-400 hover:text-blue-600"

                    aria-label="Speak"
>
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
 
      <FeedbackModal

        open={showFeedbackModal}

        onClose={() => setShowFeedbackModal(false)}

        onSubmit={handleFeedbackSubmit}

      />
</>

  );

};
 
export default MessageBubble;

 