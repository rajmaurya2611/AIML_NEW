// export async function getChatbotResponse(message: string): Promise<string> {
//   try {
//     const BASE = import.meta.env.VITE_KNOWLEDGEKINGDOM_API;     // "/knowledgekingdom/api"
//     const API_URL = `${BASE}/chat`;                             // "/knowledgekingdom/api/chat"

//     const response = await fetch(API_URL, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({ prompt: message }),
//     });
    
//     if (!response.ok) {
//       throw new Error(`API error: ${response.statusText}`);
//     }
    
//     const data = await response.json();
//     // Assumes the API returns an object with a property named "response"
//     return data.response;
//   } catch (error) {
//     console.error("Failed to get chatbot response:", error);
//     throw error;
//   }
// }

// src/apps/knowledge/api.ts
import { getUserEmail } from "../getUsersEmail";

const BASE     = import.meta.env.VITE_KNOWLEDGEKINGDOM_API;   // e.g. "/knowledgekingdom/api"
const API_URL  = `${BASE}/chat`;

/**
 * Sends the user's prompt to the Knowledge Kingdom backend,
 * automatically attaching session_id = <user email>.
 */
export async function getChatbotResponse(prompt: string): Promise<string> {
  // one-liner to grab the e-mail from Okta
  const sessionId = await getUserEmail();              // "alice@example.com"

  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt,
      session_id: sessionId,                           // <-- now included
    }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  const { response: botReply } = await response.json(); // { response: "..." }
  return botReply;
}
