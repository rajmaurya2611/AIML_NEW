import { useState } from 'react';
import { ThumbsUp, ThumbsDown, Copy,  Volume2, VolumeX , MessageSquare } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";

interface MessageBubbleProps {
  message: string;
  isBot: boolean;
  onLike?: () => void;
  onDislike?: () => void;
  onFeedback?: () => void;
  onCopy?: () => void; // <-- NEW
  onSpeak?: () => void; 
  isLiked?: boolean;
  isDisliked?: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isBot,
  onLike,
  onDislike,
  onFeedback,
  onCopy,
  onSpeak,
  isLiked,
  isDisliked
}) => {
  const [isMuted] = useState(false);

    
    const cleanMessage = (text: string) => {
    if (!text) return "";

    // 1️⃣ Remove [message_id:xxxx] part completely
    text = text.replace(/\[message_id:[^\]]+\]/g, "").trim();

    // 2️⃣ Split text into main content and sources (if exists)
    const [mainText, sourcesPart] = text.split(/Sources:/i);

    // 3️⃣ Add newlines before numbered points only in the main text
    const formattedMain = mainText.replace(/(\d\.)/g, "\n$1").trim();

    // 4️⃣ Merge both parts back
    return sourcesPart
      ? `${formattedMain}\n\nSources:\n${sourcesPart.trim()}`
      : formattedMain;
  };

  const displayText = cleanMessage(message);





  return (
    <div
      className={`flex gap-3 p-2 message-enter ${isBot ? 'justify-start' : 'justify-end'
        }`}
    >
      {/* {isBot && (
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center shadow-glow">
            <Bot size={16} className="text-primary-foreground" />
          </div>
        </div>
      )} */}

      <div className={`flex flex-col ${isBot ? 'items-start' : 'items-end'}`}>
        {/* Message bubble */}
        <div style={isBot? { height: "auto",width: "768px",borderRadius: "8px"}
                    :{border:"1px solid",borderColor:"#D9D9D9", height: "auto",width: "fit-content",
                      maxWidth: "576px",borderRadius: "8px"}}
                     className={`p-4 `}>   
           {/* className={`p-4 rounded-2xl rounded-tl-sm`} */}
          {/* <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {message}
          </p> */}
         <div
  className="text-sm leading-relaxed whitespace-pre-wrap"
  style={{
    color: "#555555",
    overflowWrap: "break-word",
    wordBreak: "break-word",
  }}
>
  {isBot ? (
    <div className="prose prose-sm max-w-none">
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkBreaks]}>
      {/* {message} */}
      {displayText}
    </ReactMarkdown>
    </div>
  ) : (
    <div>{message}</div>
  )}
</div>
        </div>


        { !isBot && <button
              onClick={ onCopy}
              className="p-2 rounded-lg transition-all duration-200 hover:scale-110 hover:bg-muted text-muted-foreground"
            >
              <Copy size={14} />
            </button>}


        {/* Timestamp */}
        {/* <span className="text-xs text-muted-foreground mt-1 px-2">
          {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span> */}

        {/* Bot message actions */}
        {isBot && (
          // <div className={`flex items-center gap-2 mt-2 transition-all duration-300 ${showActions ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          //   }`}>

              <div className="flex items-center gap-2 ml-3  mt-2 opacity-100 translate-y-0">
            <button
              onClick={onLike}
              className={`p-2 rounded-lg transition-all duration-200 hover:scale-110 ${isLiked
                ? 'bg-success/20 text-success shadow-[0_0_10px_hsla(120,70%,50%,0.3)]'
                : 'hover:bg-muted text-muted-foreground'
                }`}
            >
              <ThumbsUp size={14} />
            </button>

            <button
              onClick={onDislike}
              className={`p-2 rounded-lg transition-all duration-200 hover:scale-110 ${isDisliked
                ? 'bg-destructive/20 text-destructive shadow-[0_0_10px_hsla(0,75%,60%,0.3)]'
                : 'hover:bg-muted text-muted-foreground'
                }`}
            >
              <ThumbsDown size={14} />
            </button>

            <button
              onClick={onFeedback}
              className="p-2 rounded-lg transition-all duration-200 hover:scale-110 hover:bg-muted text-muted-foreground"
            >
              <MessageSquare size={14} />
            </button>

            
            <button
              onClick={ onCopy}
              className="p-2 rounded-lg transition-all duration-200 hover:scale-110 hover:bg-muted text-muted-foreground"
            >
              <Copy size={14} />
            </button>

              <button
              onClick={ onSpeak}
              className="p-2 rounded-lg transition-all duration-200 hover:scale-110 hover:bg-muted text-muted-foreground"
            >
             {isMuted ? (
             <VolumeX size={14} />
             ) : (
             <Volume2 size={14} />
            )}
            </button>


          </div>
        )}
      </div>

      {/* {!isBot && (
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
            <User size={16} className="text-secondary-foreground" />
          </div>
        </div>
      )} */}
    </div>
  );
};