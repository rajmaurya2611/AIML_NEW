
// import React from 'react';
// import Logo from './Logo';
// import { BotMessageSquare } from 'lucide-react';

// const ChatHeader: React.FC = () => {
//   return (
//     <header className="w-full pt-4 pb-3 px-4 sm:px-6">
//       <div className="flex items-center justify-between">
//         <Logo />
//         <div className="flex items-center gap-2">
//           <BotMessageSquare className="w-12 h-12 text-chat-red" />
//           <span className="font-bold text-3xl text-chat-red">DO33 Bot</span>
//         </div>
//         <div className="w-[100px]">
//           {/* Empty div to balance the header */}
//         </div>
//       </div>
//       <div className="mt-4 h-px bg-gradient-to-r from-transparent via-chat-red/30 to-transparent" />
//     </header>
//   );
// };

// export default ChatHeader;















import React from 'react';
import Logo from './do33_ui/Logo';
import { BotMessageSquare } from 'lucide-react';
 
const ChatHeader: React.FC = () => {
  return (
    <header className="w-full pt-4 pb-3 px-4 sm:px-6">
      <div className="flex items-center justify-between">
        <Logo />
        <div className="product-logo flex items-center gap-2">
          <BotMessageSquare className="w-12 h-12 product-logo-img" />
          <span className="font-bold text-3xl product-logo-text">DO33 Bot</span>
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