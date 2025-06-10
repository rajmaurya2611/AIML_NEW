// Version 0.0
// import React from 'react';

// const Logo: React.FC = () => {
//   return (
//     <div className="flex items-center gap-2">
//       <div className="w-8 h-8 rounded-full bg-chat-red flex items-center justify-center">
//         <svg
//           xmlns="http://www.w3.org/2000/svg"
//           viewBox="0 0 24 24"
//           fill="none"
//           stroke="currentColor"
//           strokeWidth="2.5"
//           strokeLinecap="round"
//           strokeLinejoin="round"
//           className="w-5 h-5 text-white"
//         >
//           <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
//         </svg>
//       </div>
//       <span className="font-bold text-xl text-chat-red">Red Chat</span>
//     </div>
//   );
// };

// export default Logo;
















// import React from 'react';
// import logo from '../assets/logo.png'; // Adjust the path as necessary

// const Logo: React.FC = () => {
//   return (
//     <div className="flex items-center gap-2">
//       <img src="/logo.png" alt="Logo" className="w-28 h-30 object-contain" />
//     </div>

//   );
// };

// export default Logo;











import React from 'react';
import logo from '../assests_do33/logo.png'; // ensure the folder is really named "assets"!

const Logo: React.FC = () => {
  return (
    <div className="flex items-center gap-2">
      <img src={logo} alt="Logo" className="object-contain" />
    </div>
  );
};

export default Logo;
