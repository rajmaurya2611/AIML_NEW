import "./Header.css";
import profile_image from "../assets_marcom/Marcom_profile_button.svg";

function Header({ 
  isSidebarOpen, 
  headerTitle, 
  knowledgeMessages, 
  personaMessages, 
  sessionEmail,
  knowledgeHistoryMessages,
  personaHistoryMessages   
}) {
  return (
    <div className={`marcom-header ${isSidebarOpen ? "shifted" : ""}`}>
      {headerTitle === "Persona Bot" && (Boolean(personaMessages.length)|| Boolean(personaHistoryMessages.length)) && (
        <h1 className="marcom-header-title">MyEcho</h1>
      )}
      {headerTitle === "Knowledge Bot" && (Boolean(knowledgeMessages.length) || Boolean(knowledgeHistoryMessages.length)) && (
        <h1 className="marcom-header-title">MyInsight</h1>
      )}

      <div className="marcom-profile-icon-container" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <img src={profile_image} alt="profile" />
        {sessionEmail && (
          <span className="marcom-session-email">{sessionEmail}</span> // ⬅️ show email
        )}
      </div>
    </div>
  );
}

export default Header;


// import "./Header.css";
// import profile_image from "../assets_marcom/Marcom_profile_button.svg";

// function Header({ isSidebarOpen,headerTitle, knowledgeMessages, personaMessages }) {

//   return (
//     <div className={`header ${isSidebarOpen ? "shifted" : ""}`}>
//       {headerTitle === "Persona Bot" && personaMessages.length>0 && (
//         <h1 className="header-title">
//           Persona Bot
//         </h1>
//       )}
//       {headerTitle === "Knowledge Bot" && knowledgeMessages.length>0 && (
//         <h1 className="header-title">
//           Knowledge Bot
//         </h1>
//       )}
//       <div className="marcom-profile-icon-container">
//         <img src={profile_image} />
//       </div>
//     </div>
//   );
// }

// export default Header;
