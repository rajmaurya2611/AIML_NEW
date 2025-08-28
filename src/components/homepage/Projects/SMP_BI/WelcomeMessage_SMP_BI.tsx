import { MessageCircle } from "lucide-react";

const WelcomeMessage_SMP_BI = () => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="chat-container bg-card p-8 max-w-md w-full text-center">
        {/* Chat Icon */}
        <div className="mb-6">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <MessageCircle className="h-8 w-8 text-primary" />
          </div>
        </div>
        
        {/* Welcome Text */}
        <h2 className="text-2xl font-bold mb-3">
          Welcome to <span className="text-primary">Motherson</span>!
        </h2>
        
        {/* Subtext */}
        <p className="text-muted-foreground text-base leading-relaxed">
          Hi there! How can I help you today?
        </p>
      </div>
    </div>
  );
};

export default WelcomeMessage_SMP_BI;