import React, { useState, useRef } from 'react';
import { SendIcon, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { ChatOption } from '../types_Capex/chat';

interface ChatInputProps {
  onSendMessage: (content: string, option: ChatOption, files?: File[]) => void;
  isLoading: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading }) => {
  const [message, setMessage] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if ((message.trim() || selectedFiles.length > 0) && !isLoading) {
      onSendMessage(message, null as ChatOption, selectedFiles);
      setMessage('');
      setSelectedFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleAttachmentClick = () => fileInputRef.current?.click();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? Array.from(event.target.files) : [];
    if (files.length > 0) {
      setSelectedFiles(prev => [...prev, ...files]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="inner-text-body border border-2 rounded-xl p-3 shadow-sm input-context">
      <Textarea
        placeholder="Ask your query..."
        className="min-h-[80px] resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-2"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={isLoading}
      />

      {selectedFiles.length > 0 && (
        <div className="mt-2 mb-2 flex flex-wrap gap-2 text-xs text-gray-600">
          {selectedFiles.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center gap-1 border px-2 py-1 rounded-full bg-gray-100"
            >
              <span className="truncate max-w-[150px]">{file.name}</span>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="text-chat-red hover:text-chat-red-dark"
                aria-label="Remove file"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
        <div /> {/* left spacer; no options */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            onClick={handleAttachmentClick}
            disabled={isLoading}
            variant="outline"
            size="sm"
            className="flex items-center gap-1 text-xs hover:bg-chat-red/10 hover:text-chat-red"
            style={{ padding: '0 10px' }}
            aria-label="Attach files"
            title="Attach files"
          >
            {/* <Paperclip className="w-4 h-4 text-chat-red" /> */}
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileChange}
            accept="*"
            multiple
          />

          <Button
            onClick={handleSend}
            disabled={(!message.trim() && selectedFiles.length === 0) || isLoading}
            className="hover:bg-chat-red-dark sm-textarea-btn"
            size="sm"
          >
            {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <SendIcon className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
