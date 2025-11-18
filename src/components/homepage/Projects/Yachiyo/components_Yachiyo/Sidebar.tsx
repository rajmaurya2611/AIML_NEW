import { useState,useRef, useEffect } from "react";
import motherson_logo_full from "../assests_Yachiyo/motherson_logo_full.png";
import motherson_logo_shrinked from "../assests_Yachiyo/motherson_logo_shrinked.png";
import NewChat_Icon from "../assests_Yachiyo/NewChat_Icon.svg"
import Chat_Icon from "../assests_Yachiyo/Chats_Icon.svg"
import Toggle_Icon from "../assests_Yachiyo/Toggle_Icon.svg"
import Document_Icon from "../assests_Yachiyo/Documents_Icon.svg"

import Logout_Icon from "../assests_Yachiyo/Logout_Icon.svg";
import ChatDropdownUp_Icon from "../assests_Yachiyo/ChatDropdownUp_Icon.svg"
import ChatDropdownDown_Icon from "../assests_Yachiyo/ChatDropdownDown_Icon.svg"
import ThreeDot_Icon from "../assests_Yachiyo/ThreeDot_Icon.svg"
import Rename_Icon from "../assests_Yachiyo/Rename_Icon.svg"
import DeleteHistory_Icon from "../assests_Yachiyo/DeleteHistory_Icon.svg"
import Account_Icon from "../assests_Yachiyo/Account_Icon.svg"


import { useNavigate } from "react-router-dom";

import { useYachiyoContext } from "./context/YachiyoContext";
import { getUserProfile } from './getUsersEmail';


interface UserProfile {
  name: string;
  given_name:string;
  email: string;
  picture?: string;
  role?: string;
}


interface Session {
  sessionId: string;
  title: string;
  lastUpdated?: string;
  [key: string]: any;
}

// import query_icon from "../assets/query_icon.png";
// import Session_icon from "../assets/Session_icon.png";


export default function YachiyoSidebar({ isOpen, setIsOpen,onNewChat 

}:{
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onNewChat?: () => void; // optional prop
}


) {

  const { triggerNewChat,createNewSession ,setApiResponse  } = useYachiyoContext();

  const [showText, setShowText] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  const navigate = useNavigate();

    const [showMenu, setShowMenu] = useState<boolean>(false);
    const menuRef = useRef<HTMLDivElement | null>(null);

    // placeholder for future chats — only keep setter when needed
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [showHistory, setShowHistory] = useState<boolean>(false);
    const [activeMenu, setActiveMenu] = useState<number | null>(null);

    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    const [, setTodayHistory] = useState<Session[]>([]);
    const [, setRecentHistory] = useState<Session[]>([]);

    const [sessions, setSessions] = useState<Session[]>([]);

  const [renameModal, setRenameModal] = useState<boolean>(false);
  const [renameValue, setRenameValue] = useState<string>("");
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [role, setRole] = useState<string>("User");

    const [user, setUser] = useState<UserProfile | null>(null);
 

  const API_BASE_URL = import.meta.env.VITE_YACHIYO_API_BASE_URL;

  // reference optional prop so it's not reported as unused by TS
  void onNewChat;

   const handleToggleHistory = () => {
    setShowHistory((prev) => !prev);
  };


   const userRoles: Record<string, string> = {
  "rahul.pal02@motherson.com": "Admin", // ✅ give yourself Admin access
  "susmit.banik@motherson.com": "Admin",
  "sai.ganesh@motherson.com": "Admin",
  "Ketan.Kumar@motherson.com": "Admin",
  "sachin.singhal@motherson.com": "Admin",
  "sujit.sahu@motherson.com": "Admin",
  "sonam.tripathi02@motherson.com": "Admin",
  "Raj.Maurya@motherson.com": "Admin",
  "ami.parmar@motherson.com": "Admin",
  "chiranjeevi.kondaka@motherson.com": "User",
  "sunny.sharma02@motherson.com": "User",
  "pragati.bhatia@motherson.com": "Admin",
  "hirohisa.ishihara@motherson.com": "Admin",
  "yasuhiro.taneichi@motherson.com": "Admin",
  "kyoko.kawaguchi@motherson.com": "Admin",
  "tetsuya.harashima@motherson.com": "Admin",
  "kunihiko.kondo@motherson.com": "Admin",
  "eiji.mizutani@motherson.com": "Admin",
  "kyoichi.takahashi@motherson.com": "User",
  "kazunori.saka@motherson.com": "User",
  "susumu.honma@motherson.com": "User",
  "yasuhiko.ueno@motherson.com": "User",
  "masahiro.okada@motherson.com": "User",
  "koji.kawakita@motherson.com": "User",
  "hideki.kobayashi@motherson.com": "User",
  "daisuke.sakuma@motherson.com": "User",
  "kenichi.shimada@motherson.com": "User",
  "hajime.mogi@motherson.com": "User",
  "Yusuke.Hosaka@motherson.com": "Admin",
  "Kazuki.Toyoshima@motherson.com": "Admin",
  "Ikkei.Onishi@motherson.com": "User",
};


//   useEffect(() => {
//   async function fetchUser() {
//     try {
//       // 1️⃣ Try from localStorage first
//       const savedUser = localStorage.getItem("user");
//       if (savedUser) {
//         setUser(JSON.parse(savedUser));
//         return;
//       }

//       // 2️⃣ Otherwise fetch from Okta
//   const profile = await getUserProfile();

//   const email = profile.email?.toLowerCase();
//   const role = userRoles[email?.toLowerCase()] || "User";

//   // attach computed role to profile to avoid unused var and persist it
//   const profileWithRole = { ...profile, role };
//   setUser(profileWithRole);

//   // 3️⃣ Save it for persistence
//   localStorage.setItem("user", JSON.stringify(profileWithRole));
//     } catch (error) {
//       console.error("Failed to load user profile:", error);
//     }
//   }

//   fetchUser();
// }, []);



// changed 



useEffect(() => {
  async function fetchUser() {
    try {
      // 1️⃣ Try from localStorage first
      const savedUser = localStorage.getItem("user");
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
 
        // set role based on email
        const email = parsedUser.email?.toLowerCase();
        setRole(userRoles[email] || "User");
        return;
      }
 
      // 2️⃣ Otherwise fetch from Okta
      const profile = await getUserProfile();
      const email = profile.email?.toLowerCase();
      const userRole = userRoles[email] || "User";
 
      setUser(profile);
      setRole(userRole);
 
      // 3️⃣ Save it for persistence
      localStorage.setItem("user", JSON.stringify(profile));
    } catch (error) {
      console.error("Failed to load user profile:", error);
    }
  }
 
  fetchUser();
}, []);



//   const handleLogout = () => {
//   localStorage.removeItem("accessToken");
//   localStorage.removeItem("user");
//   window.location.href = "https://motherson.workvivo.com/";
// };



  const handleLogout = () => {
  localStorage.removeItem("user");
  localStorage.removeItem("token");
   window.location.href =  `${window.location.origin}/login/`  // "http://localhost:5173/login/";
 // navigate("/login");
   };



     const handleRename = (session: Session) => {
    setSelectedSession(session);
    setRenameValue(session.title);
    setRenameModal(true);
    setActiveMenu(null);
  };



     const handleRenameSubmit = async () => {
    if (!selectedSession || !renameValue.trim()) return;

    try {
      const email = ((await getUserProfile()).email).toLocaleLowerCase();
      const response = await fetch(        
        `${API_BASE_URL}/session/${email}/${selectedSession.sessionId}/rename`,
         
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ title: renameValue }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        alert(data.message); // or use a toast/snackbar
        // ✅ Update title in local state
        const updatedSessions = sessions.map((s) =>
          s.sessionId === selectedSession.sessionId
            ? { ...s, title: renameValue }
            : s
        );
        // Update parent state if you’re lifting sessions up
        if (typeof setSessions === "function") {
          setSessions(updatedSessions);
        }
      } else {
        alert("Rename failed: " + (data.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Rename error:", error);
      alert("Error renaming session");
    }

    setRenameModal(false);
  };



  useEffect(() => {
  if (!isOpen) {
    setShowHistory(false); // collapse chat history when sidebar closes
  }
}, [isOpen]);



  

  const toggleMenu = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveMenu((prev) => (prev === index ? null : index));
  };

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  

  const handleDelete = async (session: Session) => {
  try {
    

    const email = ((await getUserProfile()).email).toLocaleLowerCase();

    const res = await fetch(`${API_BASE_URL}/session/${email}/${session.sessionId}`, {
      method: "DELETE",
    });

    if (res.ok) {
      console.log("Session deleted successfully");

      // ✅ Update list in UI
      setSessions((prev) => prev.filter((s) => s.sessionId !== session.sessionId));
    } else {
      const errorText = await res.text();
      console.error("Failed to delete session:", errorText);
      alert("Failed to delete session");
    }
  } catch (error) {
    console.error("Error deleting session:", error);
    alert("An error occurred while deleting the session");
  } finally {
    setActiveMenu(null);
  }
};

 


   useEffect(() => {
  const fetchHistory = async () => {
    try {
      const email = ((await getUserProfile()).email).toLocaleLowerCase();
      const res = await fetch(`${API_BASE_URL}/sessions/${encodeURIComponent(email)}`);
      const data = await res.json();

      console.log(data);
      console.log(data.sessions);

      if (!data.sessions || !Array.isArray(data.sessions)) {
        console.warn("No sessions found:", data);
        setIsLoading(false);
        return;
      }

      const fetchedSessions: Session[] = Array.isArray(data.sessions) ? data.sessions : [];

      // Separate today's and recent
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todaySessions: Session[] = [];
      const recentSessions: Session[] = [];

      fetchedSessions.forEach((session: Session) => {
        const lastUpdated = new Date(session.lastUpdated || Date.now());
        const sessionDate = new Date(lastUpdated);
        sessionDate.setHours(0, 0, 0, 0);
        if (sessionDate.getTime() === today.getTime()) {
          todaySessions.push(session);
        } else {
          recentSessions.push(session);
        }
      });

      setTodayHistory(todaySessions);
      setRecentHistory(recentSessions);

      // combine both for UI
      setSessions([...todaySessions, ...recentSessions]);
    } catch (err) {
      console.error("Error fetching sessions:", err);
    } finally {
      setIsLoading(false);
    }
  };

  fetchHistory();
}, []);


     const handleSessionClick = async (sessionId: string) => {
        try {
          const email = ((await getUserProfile()).email).toLocaleLowerCase();
          const res = await fetch(`${API_BASE_URL}/session/${encodeURIComponent(email)}/${sessionId}`);
          const data = await res.json();
      
          console.log("Session details:", data);
      
          // ✅ Share the entire response to Chat
          setApiResponse(data);
        } catch (error) {
          console.error("Error fetching session details:", error);
        }
      };


   const handleDocumentsClick = () => {
    setShowMenu(false); // close menu
    navigate("/yachiyo/documents");
  };


   const handleNewChatClick = async () => {
  const email = ((await getUserProfile()).email).toLocaleLowerCase(); // get user ID or email

  // ✅ Wait for the session to be created
  const sessionId = await createNewSession(email);

  if (sessionId) {
    console.log("🆕 New session created:", sessionId);
    localStorage.setItem("session_id", sessionId);
  } else {
    console.error("Failed to create new session");
  }

  // ✅ Then trigger chat reset and navigation
  navigate("/yachiyo");
  setTimeout(() => triggerNewChat(), 5);
};


   useEffect(() => {
    if (!isOpen) {
      setShowMenu(false);
    }
  }, [isOpen]);


   


   useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
 

  // Fade in/out text when sidebar opens
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isOpen) {
      timer = setTimeout(() => setShowText(true), 500);
    } else {
      setShowText(false);
    }
    return () => clearTimeout(timer);
  }, [isOpen]);

  // Menu items configuration
  // const menuItems = [
  //   { id: "sql", icon: Sql_Icon, label: "Zabbix DB", sub: "(MS Sql)" },
  //   { id: "doc", icon: Doc_Icon, label: "SOP DB", sub: "(.pdf,.xlsx,.docx)" },
  // ];

  

  // Toggle lock
  const handleToggleLock = () => setIsLocked(!isLocked);

  // Hover behavior
  const handleMouseEnter = () => {
    if (!isLocked) setIsOpen(true);
  };
  const handleMouseLeave = () => {
    if (!isLocked) setIsOpen(false);
  };



  

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`z-50 fixed left-0 top-0 h-[600px] flex flex-col  ease-in-out ${
        isOpen ? "w-[260px] bg-[#edeff1]" : "w-[75px] border-r-[2px] border-[#ecedee] bg-white shadow-sm "
      }`}
    >
      {/* Logo Section */}
    <div className="flex items-center justify-center h-12 relative px-2">
  {/* Logo */}
  <div className="flex items-center justify-center h-12 relative flex-1 ">
    <img
      src={motherson_logo_shrinked}
      className={`absolute transition-opacity duration-50 ${
        isOpen ? "opacity-0" : "opacity-100"
      }`}
    />
    <img
      src={motherson_logo_full}
      className={`absolute transition-opacity duration-50 ${
        isOpen ? "opacity-100" : "opacity-0"
      }`}
    />
  </div>

  {/* Toggle button (only visible when sidebar is open) */}
  {isOpen && (
    <button
      onClick={handleToggleLock}
      className="ml-2 flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-300 transition"
      title={isLocked ? "Unlock Sidebar" : "Lock Sidebar"}
    >
      {/* SVG Icon */}
    <img
    src={Toggle_Icon}
    alt="New Chat"
    className="w-10 h-10"
  />
    </button>
  )}
</div>

      {/* Menu Items */}


      <div className="flex flex-col gap-4 mt-4">

  {/* New Chat Button */}
  <div
    onClick={handleNewChatClick  }
    // onClick={onNewChat}
    className="h-10 flex items-center gap-2 pl-6 rounded-lg hover:bg-gray-300 cursor-pointer px-3"
  >
    {/* SVG Icon */}
    <img
    src={NewChat_Icon}
    alt="New Chat"
    className="w-6 h-6"
  />

    {/* Label (visible only when expanded) */}
    {showText && <span className="text-[16px] font-medium">New Chat</span>}
  </div>
  





  {/* New Chat Button */}
  {/* <div
    onClick={onNewChat}
    className="flex items-center h-10 pl-6 gap-2   hover:bg-gray-100 cursor-pointer px-3"
  >
    
    <img
    src={SearchChat_Icon}
    alt="Search Icon"
    className="w-6 h-6"
  />
    
    {showText && <span className="text-[16px] font-medium">Search Chats</span>}
  </div>
   */}


  {/* <div
    onClick={onNewChat}
    className="flex items-center h-10 pl-6 gap-2  hover:bg-gray-100 cursor-pointer px-3"
   >
   
    <img
    src={saved_Icon}
    alt="Saved Icon"
    className="w-6 h-6"
  />

    
    {showText && <span className="text-[16px] font-medium">Saved</span>}
  </div> */}




   {/* <div
    onClick={onNewChat}
    className="flex items-start  gap-2 pl-3 cursor-pointer hover:text-red-600
     transition-colors h-[150px] max-h-[315px]">
    {/* SVG Icon */}
{/* <img
    src={chat_Icon}
    alt="Chat Icon"
    className="w-6 h-6"
  />

  
    {showText && <span className="text-[15px] font-medium">Chats</span>}
  </div> */}



<div
      className="flex flex-col gap-2 pl-6 pr-2  px-3 min-h-[150px] h-[430px] overflow-y-auto"
    >
      {/* Section Header */}
      <div
        className="flex items-center justify-between py-2 cursor-pointer  hover:bg-gray-300 rounded-lg"
        onClick={handleToggleHistory}
      >
        <div className="flex items-center gap-2">
          <img src={Chat_Icon} alt="Chat Icon" className="w-6 h-6" />
          {showText && <span className="text-[15px] font-medium">Chats</span>}
        </div>

        {/* Dropdown Icon on right */}
        {showText && (
          <img
            src={showHistory ? ChatDropdownUp_Icon : ChatDropdownDown_Icon}
            alt="Toggle Icon"
            className="w-6 h-6"
            onClick={(e) => {
                    e.stopPropagation(); // ✋ prevent click bubbling to parent div
                    setShowHistory((prev) => !prev); // toggle manually here
                  }}
          />
        )}
      </div>

      {/* History Content */}
      {showHistory && (
        <>
          {isLoading ? (
            <div className="text-gray-400 italic">Loading chats...</div>
          ) : sessions.length > 0 ? (
            sessions.map((session, index) => (
              <div
                key={session.sessionId}
                className="flex items-center justify-between hover:bg-gray-300 px-2 py-1 rounded-md cursor-pointer relative"
                title={session.title}
                onClick={() => handleSessionClick(session.sessionId)}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <span className="truncate flex-1">{session.title}</span>

                {hoveredIndex === index && (
                  <img
                    src={ThreeDot_Icon}
                    alt="Menu"
                    className="w-5 h-5 ml-2 opacity-80 hover:opacity-100"
                    onClick={(e) => toggleMenu(index, e)}
                  />
                )}

                {activeMenu === index && (
                  <div
                    ref={menuRef}
                    className="absolute right-6 top-7 bg-white border border-gray-200 shadow-lg rounded-md w-[180px] z-50"
                  >
                    <div
                      onClick={() => handleRename(session)}
                      className="flex items-center gap-2 px-3 py-2 hover:bg-gray-400 cursor-pointer text-sm text-gray-700"
                    >
                      <img src={Rename_Icon} alt="Rename" className="w-5 h-5 opacity-80" />
                      <span>Rename</span>
                    </div>

                    <div
                      onClick={() => handleDelete(session)}
                      className="flex items-center gap-2 px-3 py-2 hover:bg-gray-400 cursor-pointer text-sm text-red-700"
                    >
                      <img src={DeleteHistory_Icon} alt="Delete" className="w-5 h-5 opacity-80" />
                      <span>Delete</span>
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-gray-400 italic">No chats found</div>
          )}
        </>
      )}

      {/* ✅ Rename Modal */}
      {renameModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
          <div className="bg-white p-6 rounded-lg w-[350px] shadow-lg">
            <h3 className="text-lg font-semibold mb-3">Rename Session</h3>
            <input
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2 mb-4"
              placeholder="Enter new title"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setRenameModal(false)}
                className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleRenameSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
  </div>
      
    




{/* </div> */}





{/* Bottom User Section */}
<div
  onClick={() => setShowMenu(!showMenu)}
  className={`fixed bottom-0 left-0 h-12 flex items-center gap-3 p-3 cursor-pointer
  hover:bg-gray-50 transition-all bg-white ${isOpen ? "w-[260px]" : "w-[75px]"}`}
>
  {/* Profile Image — always visible */}
  <img
      src={user?.picture && user.picture.trim() !== "" ? user.picture : Account_Icon}
    alt={user?.name || "User"}
    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
  />

 {isOpen && (
  <div className="flex flex-col overflow-hidden">
    <div className="flex items-center gap-3">
      <span className="font-semibold text-xs text-gray-900 truncate max-w-[120px] pr-[45px]">
        {user?.given_name || ""}
      </span>
 
      {/* ✅ Role beside name */}
      <span
        className={`text-xs font-medium ${
          role === "Admin" ? "text-red-500" : "text-blue-500"
        }`}
      >
        {role}
      </span>
    </div>
 
    <span
      className="text-xs text-gray-500 truncate max-w-[195px]"
      title={user?.email || ""}
    >
      {user?.email || ""}
    </span>
  </div>
)}
</div>


 {/* Dropdown Menu */}
     {showMenu && isOpen && (
  <div
    className={`absolute bottom-14 bg-white shadow-lg rounded-xl 
      border border-gray-100 p-2 ${isOpen ? "w-[260px]" : "w-[75px]"}`}
  >
    <ul className="text-sm text-gray-700">
       {role === "Admin" && (
  <li
    onClick={handleDocumentsClick}
    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 cursor-pointer"
  >
    <img src={Document_Icon} alt="Documents" className="w-5 h-5" />
    <span>Documents</span>
  </li>
)}

      {/* <li className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 cursor-pointer">
        <img src={Setting_Icon} alt="Settings" className="w-5 h-5" />
        <span>Settings</span>
      </li> */}

       <li
    onClick={handleLogout}
    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 text-red-500 cursor-pointer"
  >
    <img src={Logout_Icon} alt="Logout" className="w-5 h-5" />
    <span>Log out</span>
  </li>
    </ul>
  </div>
)}
  </div>
  </div>
  
 
  );
}