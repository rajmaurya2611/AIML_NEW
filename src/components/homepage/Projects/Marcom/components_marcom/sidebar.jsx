import { useNavigate, useLocation } from "react-router-dom";
import motherson_logo_full from "../assets_marcom/motherson_logo_full.png";
import motherson_logo_shrinked from "../assets_marcom/motherson_logo_shrinked.png";
import persona_icon from "../assets_marcom/persona_icon.svg";
import knowledge_icon from "../assets_marcom/persona_icon.svg";
import chat_history_icon from "../assets_marcom/chat_history_icon.svg";
import information_icon from "../assets_marcom/Document_icon.svg";
import help_icon from "../assets_marcom/sidebar_help_icon.svg";
import creativity_icon from "../assets_marcom/creativity_icon.svg";
import "./sidebar.css";
import { useState, useEffect } from "react";
import down_arrow from "../assets_marcom/persona_down_arrow.svg";

function Sidebar({ isOpen, setIsOpen, sliderValue, setSliderValue, headerTitle, setHeaderTitle,activeBot, setActiveBot, loadKnowledgeHistory, loadPersonaHistory, sessionEmail, showSlider, setShowSlider }) {
  const navigate = useNavigate();
  return (
    <div className={`marcom-sidebar ${isOpen ? "open" : ""}`}>
      {/* Logo Section */}
      <div className="marcom-sidebar-header">
        <img
          src={motherson_logo_full}
          alt="logo-full"
          className={`marcom-logo logo-full ${isOpen ? "visible" : ""}`}
          onClick={() => setIsOpen(!isOpen)}
        />
        <img
          src={motherson_logo_shrinked}
          alt="logo-shrinked"
          className={`marcom-logo logo-shrinked ${!isOpen ? "visible" : ""}`}
          onClick={() => setIsOpen(!isOpen)}
        />
      </div>

      {/* Menu Section */}
      <div className="marcom-sidebar-menu">
        {/* Persona Bot */}
        <div
          className="marcom-menu-item"
          onClick={() => {
            if (activeBot === "knowledge") {
              setHeaderTitle("Persona Bot");
              setActiveBot("persona");
              // navigate("/persona");
            } else {
              setHeaderTitle("Knowledge Bot");
              setActiveBot("knowledge");
              // navigate("/");
            }
          }}
        >
          <img
            src={activeBot === "knowledge" ? persona_icon : knowledge_icon}
            alt={activeBot === "knowledge" ? "Persona Bot Icon" : "Knowledge Bot Icon"}
            className={`marcom-menu-icon collapsed ${!isOpen ? "visible" : ""}`}
          />
          <div className={`marcom-menu-expanded ${isOpen ? "visible" : ""}`}>
            <img
              src={activeBot === "knowledge" ? persona_icon : knowledge_icon}
              alt={activeBot === "knowledge" ? "Persona Bot" : "Knowledge Bot"}
              className="marcom-menu-icon"
            />
            <span className="marcom-menu-text">
              {activeBot === "knowledge" ? "Persona Bot" : "Knowledge Bot"}
            </span>
          </div>
        </div>


        {/* Chat History */}
        <div className="marcom-menu-item" onClick={() => {activeBot === "knowledge" ? loadKnowledgeHistory(sessionEmail): loadPersonaHistory(sessionEmail);}}>
          <img
            src={chat_history_icon}
            alt="Chat History Icon"
            className={`marcom-menu-icon collapsed ${!isOpen ? "visible" : ""}`}
          />
          <div className={`marcom-menu-expanded ${isOpen ? "visible" : ""}`}>
            <img src={chat_history_icon} alt="Chat History" className="menu-icon" />
            <span className="marcom-menu-text">Chat History</span>
          </div>
        </div>

        {/* Tools only visible on PersonaBot */}
        {activeBot=="persona" && (
          <div className="persona-bot-tools-container">
            <p>Tools</p>

            {/* Creativity Bar (collapsible) */}
            <div
              style={{marginTop:"20px"}}
              className="marcom-menu-item"
              onClick={() => setShowSlider((prev) => !prev)}
            >
              {/* Icon only (collapsed) */}
              <img
                src={creativity_icon}
                alt="Creativity Icon"
                className={`marcom-menu-icon collapsed ${!isOpen ? "visible" : ""}`}
              />

              {/* Icon + Text (expanded) */}
              <div className={`marcom-menu-expanded ${isOpen ? "visible" : ""}`}>
                <img src={creativity_icon} alt="Creativity" className="marcom-menu-icon" />
                <span className="marcom-menu-text">Creativity bar</span>
                <img
                  src={down_arrow}
                  alt="expand"
                  className="arrow-icon"
                  style={{
                    marginLeft: "auto",
                    transform: showSlider ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.3s ease",
                  }}
                />
              </div>
            </div>

            {/* Slider box – same width for collapsed & expanded */}
            {showSlider && (
              <div className="marcom-slider-floating">
                <input
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.01"
                  value={sliderValue}
                  onChange={(e) => setSliderValue(e.target.value)}
                  className="marcom-creativity-slider"
                />
                <span className="marcom-slider-value">{sliderValue}</span>
              </div>
            )}
          </div>
        )}


        {/* Bottom Section */}
        <div style={{ position: "absolute", bottom: "50px" }}>
          <div className="marcom-menu-item">
            <img
              src={information_icon}
              alt="Information Icon"
              className={`marcom-menu-icon collapsed ${!isOpen ? "visible" : ""}`}
            />
            <div className={`marcom-menu-expanded ${isOpen ? "visible" : ""}`}>
              <img src={information_icon} alt="Information" className="marcom-menu-icon" />
              <span className="marcom-menu-text">Information</span>
            </div>
          </div>

          <div className="marcom-menu-item" style={{ marginTop: "20px" }}>
            <img
              src={help_icon}
              alt="Help Icon"
              className={`marcom-menu-icon collapsed ${!isOpen ? "visible" : ""}`}
            />
            <div className={`marcom-menu-expanded ${isOpen ? "visible" : ""}`}>
              <img src={help_icon} alt="Help" className="marcom-menu-icon" />
              <span className="marcom-menu-text">Help</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
