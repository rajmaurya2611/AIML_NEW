import { MessageCircle } from "lucide-react";
import mothersonLogo from "./assets_SMP_BI/motherson-logo.png";

const ChatHeader = () => {
  return (
    <header className="bg-card border-b border-border px-4 py-3">
      <div className="flex items-center justify-between max-w-6xl mx-auto">
        {/* Company Logo */}
        <div className="flex items-center">
          <img
            src={mothersonLogo}
            alt="Motherson Logo"
            className="h-8 w-auto object-contain"
          />
        </div>

        {/* Bot Name with Icon */}
        <div className="flex items-center gap-3">
          <MessageCircle className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">
            <span className="text-primary">MPP Spend </span>Analytics Assistant
          </h1>
        </div>

        {/* Spacer for symmetry */}
        <div className="w-20"></div>
      </div>
    </header>
  );
};

export default ChatHeader;