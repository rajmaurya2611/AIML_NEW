export async function getChatbotResponse(message: string): Promise<string> {
  try {
    const BASE = import.meta.env.VITE_KNOWLEDGEKINGDOM_API;     // "/knowledgekingdom/api"
    const API_URL = `${BASE}/chat`;                             // "/knowledgekingdom/api/chat"

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt: message }),
    });

    if (!response.ok) {
      throw new Error(`API error ${response.status}: ${response.statusText}`);
    }

    const { response: botReply } = await response.json();
    return botReply;
  } catch (error) {
    console.error("Failed to get chatbot response:", error);
    throw error;
  }
}
