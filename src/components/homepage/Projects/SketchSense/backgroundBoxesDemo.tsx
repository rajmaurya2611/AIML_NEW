// import React, { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import Button from "./button";
// import Lottie from "lottie-react";
// import Animation from "../assets/Animations/Animation - 1730955775370.json";
// import logo from "../assets/Images/logo.png";
// import HeroImage from "../assets/Images/Hero Image.png"; // Background image
// import api from "../lib/axios";

// export function BackgroundBoxesDemo() {
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [errorMessage, setErrorMessage] = useState<string>(""); // Added type
//   const navigate = useNavigate();

//   const openModal = () => setIsModalOpen(true);
//   const closeModal = () => {
//     setIsModalOpen(false);
//     setErrorMessage("");
//   };

//   const handleLogin = async (e: React.FormEvent) => {
//     e.preventDefault();
//     const email = (
//       document.querySelector('input[type="text"]') as HTMLInputElement
//     ).value;
//     const password = (
//       document.querySelector('input[type="password"]') as HTMLInputElement
//     ).value;

//     try {
//       const response = await api.post("/login", { email, password });
//       if (response.status === 200) {
//         navigate("/home");
//       } else {
//         setErrorMessage("Login failed");
//       }
//     } catch (error: any) {
//       console.error("Login error:", error);
//       setErrorMessage(error.response?.data?.message || "An error occurred.");
//     }
//   };

//   return (
//     <div
//       className="h-screen relative w-full flex flex-col items-center justify-center bg-cover bg-center"
//       style={{ backgroundImage: `url(${HeroImage})` }}
//     >
//       {/* Black Overlay */}
//       <div className="absolute inset-0 bg-black/50"></div>
//       {/* Logo */}
//       <img
//         src={logo}
//         alt="Logo"
//         className="z-20 absolute top-0 left-0 p-2 w-1/6"
//       />{" "}
//       {/* Added alt attribute */}
//       {/* Heading */}
//       <h1 className="md:text-6xl text-xl font-extrabold text-white font-poppins relative z-20">
//         Welcome to{" "}
//         <span className="bg-clip-text md:text-7xl text-transparent bg-gradient-to-r from-pink-500 to-violet-500 font-poppins">
//           SketchSense
//         </span>
//       </h1>
//       {/* Login Button */}
//       <div className="relative z-30 pt-6 pb-12">
//         <Button onClick={openModal}>Login</Button>
//       </div>
//       {/* Modal */}
//       {isModalOpen && (
//         <div className="fixed inset-0 z-40 bg-black bg-opacity-60 flex items-center justify-center">
//           <div className="bg-[#FFFAEC] w-7/12 h-3/5 rounded-lg shadow-lg flex relative">
//             {/* Lottie Animation */}
//             <div className="w-1/2 rounded-l-lg flex items-center justify-center overflow-hidden">
//               <Lottie
//                 animationData={Animation}
//                 style={{ width: "100%", height: "100%" }}
//               />
//             </div>

//             {/* Login Form */}
//             <div className="w-1/2 p-6">
//               <h2 className="text-2xl font-bold mb-4">Login</h2>
//               <form>
//                 <label className="block mb-2">
//                   <span className="text-gray-700">Username</span>
//                   <input
//                     type="text"
//                     className="mt-1 block w-full p-2 border border-gray-300 rounded"
//                   />
//                 </label>
//                 <label className="block mb-8">
//                   <span className="text-gray-700">Password</span>
//                   <input
//                     type="password"
//                     className="mt-1 block w-full p-2 border border-gray-300 rounded"
//                   />
//                 </label>
//                 {errorMessage && (
//                   <div className="text-red-500 mb-4">{errorMessage}</div>
//                 )}
//                 <button
//                   type="button"
//                   onClick={handleLogin}
//                   className="w-full bg-red-500 text-white py-2 rounded hover:bg-red-600"
//                 >
//                   Login
//                 </button>
//               </form>
//             </div>

//             {/* Close Button */}
//             <button
//               onClick={closeModal}
//               className="absolute top-2 right-4 text-gray-500 hover:text-gray-800 text-xl font-bold"
//             >
//               &times;
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }


import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "./button";
import Lottie from "lottie-react";
import Animation from "./assets_sketchsense/Animations/Animation - 1730955775370.json";
import logo from "./assets_sketchsense/logo.png";
import HeroImage from "./assets_sketchsense/Hero Image.png"; // Background image
import api from "./lib_sketchsense/axios";

export function BackgroundBoxesDemo() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const navigate = useNavigate();

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => {
    setIsModalOpen(false);
    setErrorMessage("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = (
      document.querySelector('input[type="text"]') as HTMLInputElement
    ).value;
    const password = (
      document.querySelector('input[type="password"]') as HTMLInputElement
    ).value;

    try {
      const response = await api.post("/login", { email, password });
      // pull the JWT out of the response body
      const { token } = response.data;
      // configure axios to send it on every request
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      // navigate into your protected area
      navigate("/sketchsense/home");
    } catch (error: any) {
      console.error("Login error:", error);
      setErrorMessage(error.response?.data?.message || "An error occurred.");
    }
  };

  return (
    <div
      className="h-screen relative w-full flex flex-col items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: `url(${HeroImage})` }}
    >
      {/* Black Overlay */}
      <div className="absolute inset-0 bg-black/50"></div>
      {/* Logo */}
      <img
        src={logo}
        alt="Logo"
        className="z-20 absolute top-0 left-0 p-2 w-1/6"
      />
      {/* Heading */}
      <h1 className="md:text-6xl text-xl font-extrabold text-white font-poppins relative z-20">
        Welcome to{" "}
        <span className="bg-clip-text md:text-7xl text-transparent bg-gradient-to-r from-pink-500 to-violet-500 font-poppins">
          SketchSense
        </span>
      </h1>
      {/* Login Button */}
      <div className="relative z-30 pt-6 pb-12">
        <Button onClick={openModal}>Login</Button>
      </div>
      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-60 flex items-center justify-center">
          <div className="bg-[#FFFAEC] w-7/12 h-3/5 rounded-lg shadow-lg flex relative">
            {/* Lottie Animation */}
            <div className="w-1/2 rounded-l-lg flex items-center justify-center overflow-hidden">
              <Lottie
                animationData={Animation}
                style={{ width: "100%", height: "100%" }}
              />
            </div>

            {/* Login Form */}
            <div className="w-1/2 p-6">
              <h2 className="text-2xl font-bold mb-4">Login</h2>
              <form>
                <label className="block mb-2">
                  <span className="text-gray-700">Username</span>
                  <input
                    type="text"
                    className="mt-1 block w-full p-2 border border-gray-300 rounded"
                  />
                </label>
                <label className="block mb-8">
                  <span className="text-gray-700">Password</span>
                  <input
                    type="password"
                    className="mt-1 block w-full p-2 border border-gray-300 rounded"
                  />
                </label>
                {errorMessage && (
                  <div className="text-red-500 mb-4">{errorMessage}</div>
                )}
                <button
                  type="button"
                  onClick={handleLogin}
                  className="w-full bg-red-500 text-white py-2 rounded hover:bg-red-600"
                >
                  Login
                </button>
              </form>
            </div>

            {/* Close Button */}
            <button
              onClick={closeModal}
              className="absolute top-2 right-4 text-gray-500 hover:text-gray-800 text-xl font-bold"
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
