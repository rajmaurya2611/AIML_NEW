
import { getUserEmail } from './getUsersEmail';
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
      const email = await getUserEmail();

      await fetch(`${import.meta.env.VITE_DO33_API_BASE_URL}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: email,
          messageId: message.id,
          liked: true,
        }),
      });
    } catch (error) {
      console.error('❌ Failed to send like feedback:', error);
    }
  };

  const handleDislike = async () => {
    onDislike(message.id);

    try {
      const email = await getUserEmail();

      await fetch(`${import.meta.env.VITE_DO33_API_BASE_URL}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: email,
          messageId: message.id,
          disliked: true,
        }),
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
      const email = await getUserEmail();

      await fetch(`${import.meta.env.VITE_DO33_API_BASE_URL}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: email,
          messageId: message.id,
          feedback,
        }),
      });

      console.log('✅ Feedback submitted!');
    } catch (error) {
      console.error('❌ Failed to send detailed feedback:', error);
    }
  };

  // Change in the below logic: lastSpokenId is now used to track the last spoken message ID
  // setLastSpokenId is used to toggle speech on/off for the same message
  // isSpeakingRef tracks if speech is currently active
  // utteranceRef holds the current SpeechSynthesisUtterance instance

  const [lastSpokenId, setLastSpokenId] = useState<string | null>(null);
  const utteranceRef = React.useRef<SpeechSynthesisUtterance | null>(null);

  React.useEffect(() => {
    const handleBeforeUnload = () => {
      window.speechSynthesis.cancel();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      handleBeforeUnload();
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // // Old Approach
  // const speakText = (text: string) => {
  //   if (!('speechSynthesis' in window)) {
  //     console.warn("Speech Synthesis API not supported in this browser.");
  //     return;
  //   }

  //   // Cancel current speech before starting new
  //   window.speechSynthesis.cancel();

  //   const utterance = new SpeechSynthesisUtterance(text);
  //   utterance.lang = 'en-US';

  //   utterance.onstart = () => {
  //     isSpeakingRef.current = true;
  //   };

  //   utterance.onend = () => {
  //     isSpeakingRef.current = false;
  //   };

  //   window.speechSynthesis.speak(utterance);
  // };


  // New Approach
  const speakText = (text: string, id: string) => {
    if (!('speechSynthesis' in window)) {
      console.warn("Speech Synthesis API not supported in this browser.");
      return;
    }

    // If already speaking, stop
    if (isSpeakingRef.current) {
      window.speechSynthesis.cancel();
      isSpeakingRef.current = false;

      // If same message clicked again, treat as toggle to stop
      if (lastSpokenId === id) {
        setLastSpokenId(null);
        return;
      }
    }
    text = text.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '');

    // Fetch available voices
    const voices = window.speechSynthesis.getVoices();
    // const selectedVoice = voices.find(v => v.name === "Microsoft David - English (United States)");
    // const selectedVoice = voices.find(v => v.name === "Microsoft Mark - English (United States)");
    const selectedVoice = voices.find(v => v.name === "Microsoft Zira - English (United States)");

    // New utterance for new text or re-click
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    } else {
      console.warn("Voice not found. Using default.");
    }

    utterance.onstart = () => {
      isSpeakingRef.current = true;
      setLastSpokenId(id);
    };

    utterance.onend = () => {
      isSpeakingRef.current = false;
      setLastSpokenId(null);
    };

    utterance.onerror = () => {
      isSpeakingRef.current = false;
      setLastSpokenId(null);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };



  // AILIFE Bot
  // const speakText = async (text: string) => {
  //   if (!text) return;

  //   try {
  //     // Update ref to indicate speech has started
  //     isSpeakingRef.current = true;

  //     const response = await fetch("https://speechapi.services.ailifebot.com/api/tts", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify({ text }), // Assuming the API expects { text: "..." }
  //     });

  //     if (!response.ok) {
  //       console.error("TTS API error:", await response.text());
  //       isSpeakingRef.current = false;
  //       return;
  //     }

  //     const audioData = await response.arrayBuffer();
  //     const blob = new Blob([audioData], { type: "audio/mpeg" });
  //     const audioUrl = URL.createObjectURL(blob);

  //     const audio = new Audio(audioUrl);

  //     audio.onended = () => {
  //       isSpeakingRef.current = false;
  //     };

  //     audio.onerror = (err) => {
  //       console.error("Audio playback failed", err);
  //       isSpeakingRef.current = false;
  //     };

  //     audio.play();
  //   } catch (error) {
  //     console.error("Failed to fetch or play TTS audio", error);
  //     isSpeakingRef.current = false;
  //   }
  // };


  return (
    <>
      <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
        <div

          className={`max-w-[95%] md:max-w-[85%] lg:max-w-[75%] rounded-2xl p-4 ${isUser

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

                    className={`p-1 rounded-full transition-colors ${message.liked

                      ? 'bg-green-100 text-green-600'

                      : 'text-gray-400 hover:text-green-600'

                      }`}

                    aria-label="Like"
                  >
                    <ThumbsUp className="w-4 h-4" />
                  </button>
                  <button

                    onClick={handleDislike}

                    className={`p-1 rounded-full transition-colors ${message.disliked

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
                    // onClick={() => speakText(message.content)}
                    onClick={() => speakText(message.content, message.id)}
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

