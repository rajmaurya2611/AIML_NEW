import React, { useState, useRef } from 'react';
import { Send, Mic, MicOff, Paperclip, X } from 'lucide-react';
import { Button } from './ui/button';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onFileChange?: (file: File | null) => void;  
  file?: File | null;                          
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, onFileChange, file, disabled }) => {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null); // To store SpeechRecognition instance

  // language selection (speech recognition) removed for now to avoid unused variable

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((message.trim() || file) && !disabled) {
      // Create a combined message with file info if needed
      let messageWithFile = message.trim();
      if (file) {
        messageWithFile += ` [File: ${file.name}]`;
      }
      onSendMessage(messageWithFile);
      setMessage('');
      // onFileChange?.(null);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  // const toggleRecording = () => {
  //   const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;

  //   if (!SpeechRecognition) {
  //     alert("Your browser doesn't support speech recognition.");
  //     return;
  //   }

  //   if (!isRecording) {
  //     const recognition = new SpeechRecognition();
  //     recognition.lang = 'en-IN';
  //     recognition.interimResults = false;
  //     recognition.maxAlternatives = 1;

  //     recognition.onstart = () => setIsRecording(true);
  //     recognition.onend = () => setIsRecording(false);
  //     recognition.onerror = (e: any) => {
  //       setIsRecording(false);
  //       console.error('Voice error:', e);
  //     };
  //     recognition.onresult = (event: any) => {
  //       const transcript = event.results[0][0].transcript;
  //       // setMessage(prev => prev ? `${prev} ${transcript}` : transcript);
  //       setMessage(transcript);
  //       adjustTextareaHeight();
  //     };

  //     recognitionRef.current = recognition;
  //     recognition.start();
  //   } else {
  //     recognitionRef.current?.stop();
  //   }
  // };


   const toggleRecording = () => {
  const SpeechRecognition =
    (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;

  if (!SpeechRecognition) {
    alert("Your browser doesn't support speech recognition.");
    return;
  }

  if (isRecording) {
    recognitionRef.current?.stop();
    setIsRecording(false);
    return;
  }

  const tryRecognition = (lang: string, onSuccess: (transcript: string) => void, onFail?: () => void) => {
    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsRecording(true);
    recognition.onerror = (e: any) => {
      console.error(`Speech recognition (${lang}) error:`, e);
      if (onFail) onFail();
      setIsRecording(false);
    };
    recognition.onend = () => {
      // Stop flag when both attempts fail
      if (!recognitionRef.current) setIsRecording(false);
    };
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onSuccess(transcript);
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  // Try English first, fallback to Japanese if no clear result
  tryRecognition(
    "en-IN",
    (transcript) => {
      setMessage(transcript);
      adjustTextareaHeight();
    },
    () => {
      // fallback to Japanese if English fails or empty
      tryRecognition("ja-JP", (jpTranscript) => {
        setMessage(jpTranscript);
        adjustTextareaHeight();
      });
    }
  );
};


  // const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const files = e.target.files;
  //   if (files && files.length > 0) {
  //     const selectedFile = files[0];
  //     // const validTypes = [
  //     //   'application/pdf',
  //     //   'application/vnd.ms-excel',
  //     //   'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  //     // ];
  //     const validTypes = [
  //       'application/pdf',
  //       'application/vnd.ms-excel',
  //       'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  //       'application/msword',
  //       'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  //     ];
  //     if (!validTypes.includes(selectedFile.type)) {
  //       alert('Please upload only PDF, Excel, or Word files.');
  //       return;
  //     }
  //     onFileChange?.(selectedFile); // <-- pass up to parent
  //   }
  // };

  // const removeFile = () => {
  //   onFileChange?.(null); // <-- clear in parent
  //   if (fileInputRef.current) fileInputRef.current.value = '';
  // };
  const removeFile = async () => {
    if (file) {
      const API_BASE_URL = import.meta.env.VITE_YACHIYO_API_BASE_URL;
      await fetch(`${API_BASE_URL}/clear_file_history`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: localStorage.getItem("sessionId"), fileId: file.name })
      });
    }
    onFileChange?.(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };


  // const triggerFileInput = () => {
  //   if (fileInputRef.current) {
  //     fileInputRef.current.click();
  //   }
  // };

  return (
     <div className="p-4 "> 
     {/* style={{ border: "1px solid #D9D9D9", borderRadius: "20px" }}> */}
      <form onSubmit={handleSubmit} className="flex items-end gap-3">
        
        {/* File upload button + hidden input (used)
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".pdf,.xls,.xlsx,.doc,.docx,application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="hidden"
        />
        <div className="mb-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={triggerFileInput}
            className="flex-shrink-0 hover:bg-gray-400 text-gray-500"
            disabled={disabled}
            style={{ border: "1px solid #D9D9D9" }}
          >
            <Paperclip size={18} />
          </Button>
        </div> */}


<div className="relative w-full">
  {/* Textarea */}
  <textarea
    ref={textareaRef}
    value={message}
    onChange={(e) => {
      setMessage(e.target.value);
      adjustTextareaHeight();
    }}
    onKeyPress={handleKeyPress}
    placeholder="What can I help you with?"
    disabled={disabled}
    className="w-full p-3 pr-20 bg-input border border-border rounded-xl text-foreground placeholder-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring transition-all min-h-[50px] max-h-[120px]"
    rows={1}
    style={{ border: "1px solid #D9D9D9" }}
  />

  {/* Mic button (inside textarea container, right side) */}
  <button
    type="button"
    onClick={toggleRecording}
    className={`absolute bottom-4 right-[4rem] flex items-center justify-center h-8 w-8 rounded-md border transition-all duration-300 ${
      isRecording
        ? "bg-red-100 border-red-500 text-red-500 animate-pulse"
        : "border-gray-300 text-gray-500 hover:bg-gray-200"
    }`}
  >
    {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
  </button>

  {/* Send button (inside textarea container, right corner) */}
  <button
    type="submit"
    disabled={(!message.trim() && !file) || disabled}
    className="absolute bottom-4 right-[1.5rem]  flex items-center justify-center h-8 w-8 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-200"
  >
    <Send size={16} />
  </button>
</div>

     {/* <Button
              type="submit"
              icon={<SendOutlined />}
              onClick={handleAsk}
              // disabled={!selectedDoc || !question}
              className="bg-[#FF4D4F]"
            >
              Send
            </Button> */}


      </form>

      {/* File preview */}
      {file && (
        <div className="mt-3 flex items-center justify-between p-2 rounded-lg" style={{ border: "1px solid #5555" }}>
          <div className="flex items-center gap-2">
            <Paperclip size={16} className="text-muted-foreground" />
            <span className="text-sm text-foreground truncate max-w-[200px]">{file.name}</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={removeFile}
            className="h-6 w-6 hover:bg-gray-400 text-gray-500"
          >
            <X size={16} />
          </Button>
        </div>
      )}

      {/* {isRecording && (
        <div className="mt-3 flex items-center justify-center gap-2 text-destructive">
          <div className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
          <span className="text-sm font-medium">Recording... Click mic to stop</span>
        </div>
      )} */}
    </div>
  );
};
