// MessageInput.jsx
import React from 'react';
import sendButton from "../assets_talentAI/send-button.png";
 
export default function MessageInput({ value, onChange, onSend, disabled }) {
  return (
    <div className="interview-bot-user-input-container">
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        // Rohan Singh
        placeholder="Type your message here..."
        onContextMenu={e => e.preventDefault()}
        style={{
          border: "8px solid #f0e9e9",
          width: "25vw",
          borderRadius: 15,
          resize: "none",
          height: 50,
          paddingTop: 7,
          paddingLeft: 5,
          color: "#2C2C2E",
        }}
        id="interview-bot-user-message"
      />
      <button
        onClick={onSend}
        disabled={disabled}
        style={{ position: "absolute", right: 15, top: 17 }}
      >
        <img src={sendButton} alt="Send" style={{ height: 20 }} />
      </button>
    </div>
  );
}
 