import React, { useState, useRef } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { CustomerServiceOutlined, CopyOutlined, StarOutlined } from '@ant-design/icons';
import Lottie from 'lottie-react';
import backgroundAnimation from '../../assests_RKIP/animations/bg.json';
import FeedbackModal from '../../components_RKIP/Main/feedbackModal';

interface Message {
  text: string;
  sender: 'user' | 'bot';
  timestamp: string;
  question?: string;
  answer?: string;
}

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
  const isSpeakingRef = useRef(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return console.warn('Speech API not supported');
    if (isSpeakingRef.current) {
      window.speechSynthesis.cancel();
      isSpeakingRef.current = false;
    } else {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.onend = () => { isSpeakingRef.current = false; };
      isSpeakingRef.current = true;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  };

  const copyText = async (text: string) => {
    try { await navigator.clipboard.writeText(text); }
    catch (err) { console.error('Copy failed', err); }
  };

  const handleOpenFeedbackModal = (msg: Message, idx: number) => {
    if (msg.sender !== 'bot') return;
    setSelectedMessage({
      ...msg,
      question: messages[idx - 1]?.text ?? 'No Question Available',
      answer: msg.text,
    });
    setIsModalVisible(true);
  };

  const handleCloseFeedbackModal = () => {
    setIsModalVisible(false);
    setSelectedMessage(null);
  };

 return (
   <div className="relative flex-grow overflow-y-auto overflow-x-hidden bg-transparent p-4">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Lottie
          animationData={backgroundAnimation}
          loop
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

      <div className="relative z-20 h-full overflow-y-auto overflow-x-hidden space-y-4 p-4">
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
                style={{ width: 60, height: 60, marginRight: 10 }}
              />
            )}

            <div className={`max-w-3xl px-4 py-2 rounded-lg break-words flex flex-col ${
                message.sender === 'user' ? userStyle : botStyle
            }`}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkBreaks]}
                components={{
                  table: props => <table className="min-w-full border border-gray-300 mb-4" {...props} />,
                  thead: props => <thead className="bg-gray-200 text-black" {...props} />,
                  tr:   props => <tr className="border-t border-gray-300" {...props} />,
                  th:   props => <th className="px-4 py-2 border border-gray-300 text-black text-sm font-semibold" {...props} />,
                  td:   props => <td className="px-4 py-2 border border-gray-300 text-white text-sm" {...props} />,
                  ul:   props => <ul className="list-disc pl-5 space-y-1 text-white" {...props} />,
                  li:   props => <li className="text-base text-white" {...props} />,
                  p:    props => <p className="mb-2" {...props} />,
                }}
              >
                {message.text}
              </ReactMarkdown>

              <div className="flex gap-2 self-end mt-1">
                <button onClick={() => speakText(message.text)} title="Listen" className="p-1 hover:bg-gray-300 rounded">
                  <CustomerServiceOutlined style={{ fontSize: 16 }} />
                </button>
                <button onClick={() => copyText(message.text)} title="Copy" className="p-1 hover:bg-gray-300 rounded">
                  <CopyOutlined style={{ fontSize: 16 }} />
                </button>
                {message.sender === 'bot' && (
                  <button
                    onClick={() => handleOpenFeedbackModal(message, index)}
                    title="Feedback"
                    className="p-1 hover:bg-gray-300 rounded"
                  >
                    <StarOutlined style={{ fontSize: 16 }} />
                  </button>
                )}
              </div>
            </div>

            {message.sender === 'user' && (
              <div className="ml-2 w-12 h-12 flex items-center justify-center">
                <DotLottieReact
                  src="https://lottie.host/f2413721-41cb-473d-a5f8-7c66293cde14/86pBQ0ZvuQ.lottie"
                  loop
                  autoplay
                  style={{ transform: 'scale(2)' }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {selectedMessage && (
        <FeedbackModal
          visible={isModalVisible}
          onClose={handleCloseFeedbackModal}
          question={selectedMessage.question!}
          answer={selectedMessage.answer!}
        />
      )}
    </div>
  );
};

export default ChatWindow;
