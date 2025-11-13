import { useState } from "react";
import { Outlet } from "react-router-dom";
import YachiyoSidebar from "./Sidebar";
import FooterLayout from "./common/Footer";


export default function YachiyoLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

 return (

  //   <div className={`flex bg-gradient-ambient min-h-screen overflow-hidden
  //    ${isSidebarOpen ? "ml-[260px]" : "ml-[75px]"}
  // `}>


    <div className="flex bg-gradient-ambient min-h-screen overflow-hidden">
      {/* Sidebar always visible */}
      <YachiyoSidebar
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      {/* Main content area */}
      <div
        className={`transition-all duration-50 flex-1 overflow-y-auto ${
          isSidebarOpen ? "ml-[260px]" : "ml-[75px]" 
        }`} style={{ paddingBottom: "56 px"}}
      >
        <Outlet /> {/* 👈 This will render Chat (Index) OR Documents */}
      </div>


          <div>
                 <FooterLayout/>
        
             </div>

    </div>
  );
}