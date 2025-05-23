import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { SaveOutlined, DeleteOutlined, StopOutlined } from "@ant-design/icons";

interface HeaderProps {
  onSave: () => void;
  onClear: () => void;
  onStop: () => void;
}

export default function Header({ onSave, onClear, onStop }: HeaderProps) {
  return (
    <header className="bg-red-500 text-white shadow-md z-10 px-8">
      <div className="container mx-auto flex justify-between items-center pt-2">
        {/* Logo and Title */}
        <div className="flex items-center space-x-2">
          <DotLottieReact
            src="https://lottie.host/910d0a6d-d9bc-4e46-b80d-000bc077f82e/RZV3nE6vu1.lottie"
            loop
            autoplay
            style={{ width: "60px", height: "60px" }}
          />
          <h1 className="text-2xl font-bold">Process Chat</h1>
        </div>
        {/* Action Buttons */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onSave}
            title="Save Chats"
            className="px-2 "
          >
            <SaveOutlined className="text-xl" />
          </button>
          <button
            onClick={onClear}
            title="Clear Chats"
            className="px-2 "
          >
            <DeleteOutlined className="text-xl" />
          </button>
          <button
            onClick={onStop}
            title="Stop Bot Response"
            className="px-2 "
          >
            <StopOutlined className="text-xl" />
          </button>
        </div>
      </div>
    </header>
  );
}
