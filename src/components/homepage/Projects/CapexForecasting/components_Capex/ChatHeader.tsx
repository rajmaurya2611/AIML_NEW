
import React from 'react';
import Logo from '../assets_Capex/logo.png';
//import { BotMessageSquare } from 'lucide-react';

const ChatHeader: React.FC = () => {
  return (
    <header className="w-full pt-4 pb-3 px-4 sm:px-6">
      <div className="flex items-center justify-between">
        <img src={Logo} alt="Logo" className="h-10" />
        <div className="product-logo flex items-center gap-2">
          {/* <BotMessageSquare className="w-12 h-12 product-logo-img" /> */}
          {/* <span className="font-bold text-3xl product-logo-text">Capex Forecasting</span> */}
        </div>
        <div className="w-[100px]">
          {/* Empty div to balance the header */}
        </div>
      </div>
      <div className="mt-4 h-px bg-gradient-to-r from-transparent via-chat-red/30 to-transparent" />
    </header>
  );
};

export default ChatHeader;
