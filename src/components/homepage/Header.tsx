import  { useState } from "react";
import whiteLogo from '../../assets/images/homepage/logo.png';

export default function Header() {
  // State to toggle the mobile menu
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <header className="fixed top-0 left-0 w-full bg-transparent text-white flex justify-between items-center px-6 py-4 z-50">
      <div className="logo">
        <img src={whiteLogo} alt="Logo" className="h-10" />
      </div>

      {/* Hamburger Menu for Mobile */}
      <div className="lg:hidden">
        <button onClick={toggleMenu} className="text-white">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </div>
    </header>
  );
}