import { useState } from "react";
import { Send, Mic, X } from "lucide-react"; // <-- Added X here
import { Button } from "./ui_SMP_BI/button";
import { Textarea } from "./ui_SMP_BI/textarea";
import FileUpload from "./FileUpload_SMP_BI";
import { useToast } from "./hooks_SMP_BI/use-toast";

interface ChatInputProps {
  onSendMessage: (message: string, files?: File[]) => void;
  disabled?: boolean;
}

const ChatInput = ({ onSendMessage, disabled }: ChatInputProps) => {
  const [message, setMessage] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isListening, setIsListening] = useState(false);
  const { toast } = useToast();

  // const handleSend = () => {
  //   if (message.trim() || selectedFiles.length > 0) {
  //     onSendMessage(message.trim(), selectedFiles);
  //     setMessage("");
  //     setSelectedFiles([]);
  //   }
  // };
  const handleSend = () => {
    if (message.trim() || selectedFiles.length > 0) {
      onSendMessage(message.trim(), selectedFiles);
      setMessage("");
      // ❌ Do NOT clear selectedFiles here
    }
  };


  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleVoiceInput = () => {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition =
        (window as any).webkitSpeechRecognition ||
        (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-IN";

      recognition.onstart = () => setIsListening(true);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setMessage(transcript);
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
        toast({
          title: "Voice recognition error",
          description: "Could not recognize speech. Please try again.",
          variant: "destructive",
        });
      };

      recognition.onend = () => setIsListening(false);

      recognition.start();
    } else {
      toast({
        title: "Voice input not supported",
        description: "Your browser does not support voice input.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="border-t border-border bg-card p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-end gap-3">
          {/* Message Input + File Preview */}
          <div className="flex-1 relative">
            <div className="flex flex-col border border-border rounded-lg pl-12 pr-12 pt-2 pb-2 bg-background">
              {selectedFiles.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {selectedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-1 bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-xs max-w-[150px]"
                    >
                      <span className="truncate">{file.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setSelectedFiles(
                            selectedFiles.filter((_, i) => i !== index)
                          )
                        }
                        className="h-3 w-3 p-0 hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <X className="h-2 w-2" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <Textarea
                placeholder="Type your message here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={disabled}
                className="min-h-[50px] max-h-[120px] resize-none border-0 p-0 focus-visible:ring-0"
              />
            </div>

            <div className="absolute left-2 top-2">
              <FileUpload onFilesSelected={setSelectedFiles} />
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleVoiceInput}
              disabled={disabled || isListening}
              className={`absolute right-2 top-2 h-8 w-8 p-0 ${isListening
                ? "text-primary animate-pulse"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              <Mic className="h-4 w-4" />
            </Button>
          </div>

          {/* Send Button */}
          <Button
            onClick={handleSend}
            disabled={disabled || (!message.trim() && selectedFiles.length === 0)}
            className="h-12 w-12 p-0 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
