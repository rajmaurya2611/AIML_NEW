import React from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { CustomerServiceOutlined, CopyOutlined } from '@ant-design/icons';
import Lottie from 'lottie-react';
import backgroundAnimation from './assests_personaprime/animations/bg.json';
import { Message } from './personaprime_main';

interface ChatWindowProps {
  messages: Message[];
  userStyle?: string;
  botStyle?: string;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  userStyle = 'bg-gray-700 text-white',
  botStyle = 'bg-gray-700 text-white',
}) => {
  // Function to speak the given text using the Web Speech API
  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    } else {
      console.warn("Speech Synthesis API not supported in this browser.");
    }
  };

  // Function to copy text to clipboard
  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      console.log("Text copied to clipboard");
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <div className="relative flex-grow overflow-hidden bg-transparent p-4">
      {/* Background animation */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Lottie
          animationData={backgroundAnimation}
          loop={true}
          style={{
            width: '70%',
            height: '70%',
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity: 0.7,
          }}
        />
      </div>

      {/* Chat messages */}
      <div className="relative z-20 h-full overflow-y-auto space-y-4 p-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.sender === 'bot' && (
              <DotLottieReact
                src="https://lottie.host/910d0a6d-d9bc-4e46-b80d-000bc077f82e/RZV3nE6vu1.lottie"
                loop
                autoplay
                style={{ width: '60px', height: '60px', marginRight: '10px' }}
              />
            )}

            <div
              className={`max-w-3xl px-4 py-2 rounded-lg break-words flex flex-col ${
                message.sender === 'user' ? userStyle : botStyle
              }`}
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkBreaks]}
                components={{
                  p: ({ node, ...props }) => <p className="mb-2" {...props} />,
                }}
              >
                {message.text}
              </ReactMarkdown>

              <div className="flex gap-2 mt-1 self-end">
                <button
                  onClick={() => speakText(message.text)}
                  className="p-1 hover:bg-gray-300 rounded"
                  title="Listen"
                >
                  <CustomerServiceOutlined style={{ fontSize: '16px' }} />
                </button>
                <button
                  onClick={() => copyText(message.text)}
                  className="p-1 hover:bg-gray-300 rounded"
                  title="Copy"
                >
                  <CopyOutlined style={{ fontSize: '16px' }} />
                </button>
              </div>
            </div>

            {message.sender === 'user' && (
              <div
                style={{
                  width: '50px',
                  height: '50px',
                  marginLeft: '10px',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <DotLottieReact
                  src="https://lottie.host/f2413721-41cb-473d-a5f8-7c66293cde14/86pBQ0ZvuQ.lottie"
                  loop
                  autoplay
                  style={{
                    transform: 'scale(2)',
                    transformOrigin: 'center',
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChatWindow;
