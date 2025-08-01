// MessageList.jsx
import React from 'react';
import avatar from "../assets_talentAI/avatar.svg";
 
export default function MessageList({ messages }) {
  return (
    <>
      {messages.map((msg, i) => {
        const isBot = msg.sender === "HR Bot" || msg.role === "assistant";
        const sender = isBot ? "HR Bot" : "You";
        const text = msg.text ?? msg.content;
        return (
          <div
            key={i}
            className={`interview-bot-message ${sender.toLowerCase().replace(" ", "-")}`}
          >
            <div
              className="interview-bot-message-container"
              style={{
                display: "flex",
                flexDirection: isBot ? "row" : "row-reverse",
              }}
            >
              <div className="interview-bot-message-head">
                <img src={avatar} alt={sender} />
              </div>
              <div className="interview-bot-message-body">
                <strong>{sender}</strong>
                <p>{text}</p>
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}