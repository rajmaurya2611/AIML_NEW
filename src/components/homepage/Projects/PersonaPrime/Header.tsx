// Header.tsx
import { useState } from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { SaveOutlined, DeleteOutlined, StopOutlined } from "@ant-design/icons";

interface HeaderProps {
  onSave: () => void;
  onClear: () => void;
  onStop: () => void;
  onTemperatureChange: (temperature: number) => void;
}

export default function Header({
  onSave,
  onClear,
  onStop,
  onTemperatureChange,
}: HeaderProps) {
  const [temperature, setTemperature] = useState(1.00);

  const handleTemperatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setTemperature(value);
    onTemperatureChange(value); // Notify parent of the new temperature
  };

  return (
    <>
      <header className="bg-red-500 text-white shadow-md z-10">
        <div className="container mx-auto flex justify-between items-center pt-2">
          {/* Logo and Title */}
          <div className="flex items-center space-x-2">
            <DotLottieReact
              src="https://lottie.host/910d0a6d-d9bc-4e46-b80d-000bc077f82e/RZV3nE6vu1.lottie"
              loop
              autoplay
              style={{ width: "60px", height: "60px" }}
            />
            <h1 className="text-2xl font-bold">Persona Prime</h1>
          </div>
          {/* Action Buttons */}
          <div className="flex items-center space-x-4">
            {/* Temperature Input */}
            <div className="flex items-center space-x-2">
              <label htmlFor="temperature" className="text-lg font-semibold">
                Creativeness:
              </label>
              <input
                type="number"
                id="temperature"
                name="temperature"
                step="0.01"
                min="0"
                max="1.50"
                value={temperature}
                onChange={handleTemperatureChange}
                className="border rounded px-2 py-1 w-20 text-black"
              />
            </div>
            <button onClick={onSave} title="Save Chats" className="px-2">
              <SaveOutlined className="text-xl" />
            </button>
            <button onClick={onClear} title="Clear Chats" className="px-2">
              <DeleteOutlined className="text-xl" />
            </button>
            <button onClick={onStop} title="Stop Bot Response" className="px-2">
              <StopOutlined className="text-xl" />
            </button>
          </div>
        </div>
      </header>
      <div className="text-center italic text-gray-600">
        <p>Increase the value above for more creative answers (0 to 1.50)</p>
      </div>
    </>
  );
}
