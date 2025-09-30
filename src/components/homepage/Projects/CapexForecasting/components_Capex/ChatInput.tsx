import React, { useState, useRef } from "react";
import { SendIcon, RefreshCw, Mic, Square } from "lucide-react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { ChatOption } from "../types_Capex/chat";
import * as sdk from "microsoft-cognitiveservices-speech-sdk";

interface ChatInputProps {
  // allow option to be nullable/optional and forward queryType
  onSendMessage: (
    content: string,
    option?: ChatOption | null,
    files?: File[],
    queryType?: number
  ) => void;
  isLoading: boolean;
  queryType?: number;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
  queryType,
}) => {
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState(""); // Live (partial) text
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [listening, setListening] = useState(false);
  const [recognizer, setRecognizer] = useState<sdk.SpeechRecognizer | null>(
    null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if ((message.trim() || selectedFiles.length > 0) && !isLoading) {
      // Forward queryType as the 4th parameter (may be undefined)
      onSendMessage(message, null as ChatOption | null, selectedFiles, queryType);
      setMessage("");
      setSelectedFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // const handleAttachmentClick = () => fileInputRef.current?.click();

  // const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  //   const files = event.target.files ? Array.from(event.target.files) : [];
  //   if (files.length > 0) {
  //     setSelectedFiles((prev) => [...prev, ...files]);
  //   }
  // };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // 🎤 Start/Stop Speech Recognition with auto language detection
  const toggleMic = async () => {
    if (listening && recognizer) {
      recognizer.stopContinuousRecognitionAsync();
      setListening(false);
      setPreview("");
      return;
    }

    try {
      // 🔑 Use your endpoint + key directly
      const speechConfig = sdk.SpeechConfig.fromSubscription(
        import.meta.env.VITE_AZURE_SPEECH_KEY_CAPEX as string,
        import.meta.env.VITE_AZURE_SPEECH_REGION_CAPEX as string
      );

      // 🎙️ Microphone input
      const audioConfig = sdk.AudioConfig.fromDefaultMicrophoneInput();

      // 🌍 Auto detect languages
      const autoDetectConfig = sdk.AutoDetectSourceLanguageConfig.fromLanguages([
        "en-US",
        // "fr-FR",
        // "es-ES",
        // "de-DE",
        // "pt-PT",
        // "hu-HU",
      ]);

      // 🔥 Create recognizer with auto-detect
      const recognizerInstance = sdk.SpeechRecognizer.FromConfig(
        speechConfig,
        autoDetectConfig,
        audioConfig
      );

      // 🟢 Live (preview)
      recognizerInstance.recognizing = (_s, e) => {
        setPreview(e.result.text);
        console.log("Recognizing:", e.result.text);
      };

      // 🟢 Finalized result
      recognizerInstance.recognized = (_s, e) => {
        if (e.result.reason === sdk.ResultReason.RecognizedSpeech) {
          const langResult = sdk.AutoDetectSourceLanguageResult.fromResult(e.result);
          const detectedLang = langResult.language;

          console.log("Detected language:", detectedLang);
          console.log("Final text:", e.result.text);

          setMessage((prev) => (prev + " " + e.result.text).trim());
          setPreview("");
        }
      };

      recognizerInstance.canceled = (_s, e) => {
        console.error("Recognition canceled:", e);
        recognizerInstance.stopContinuousRecognitionAsync();
        setListening(false);
      };

      recognizerInstance.sessionStopped = () => {
        recognizerInstance.stopContinuousRecognitionAsync();
        setListening(false);
      };

      recognizerInstance.startContinuousRecognitionAsync();
      setRecognizer(recognizerInstance);
      setListening(true);
    } catch (error) {
      console.error("Speech recognition error:", error);
      setListening(false);
    }
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

      {preview && <div className="preview-text">{preview}</div>}

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
          {/* Mic / Stop Button */}
          <Button
            onClick={toggleMic}
            disabled={isLoading}
            variant="outline"
            size="sm"
            className={`flex items-center gap-1 text-xs ${
              listening ? "bg-red-100 text-red-600" : "text-[#da2128] hover:bg-gray-100"
            }`}
            aria-label={listening ? "Stop Recording" : "Start Recording"}
            title={listening ? "Stop" : "Speak"}
          >
            {listening ? (
              <div className="relative flex items-center justify-center">
                {/* Rotating Circle */}
                <div className="absolute w-6 h-6 rounded-full border-2 border-red-400 border-t-transparent animate-spin"></div>
                {/* Stop Icon */}
                <Square className="w-2 h-2 relative z-10 text-red-600" />
              </div>
            ) : (
              <Mic className="w-4 h-4" />
            )}
          </Button>

          {/* Send Button */}
          <Button
            onClick={handleSend}
            disabled={(!message.trim() && selectedFiles.length === 0) || isLoading}
            className="hover:bg-gray-100 sm-textarea-btn"
            size="sm"
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <SendIcon className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
