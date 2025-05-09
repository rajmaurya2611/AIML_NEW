// api.ts
export async function getChatbotResponse(
  message: string,
  temperature: number
): Promise<string> {
  try {
    // Base comes from your .env: VITE_PERSONAPRIME_API=/personaprime/api
    const BASE = import.meta.env.VITE_PERSONAPRIME_API;
    // append the actual backend path
    const API_URL = `${BASE}/generate`;

    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: message, temperature }),
    });

    if (!res.ok) {
      throw new Error(`API error ${res.status}: ${res.statusText}`);
    }

    // assumes your service responds { response: "…" }
    const { response: botReply } = await res.json();
    return botReply;
  } catch (err) {
    console.error("Failed to get chatbot response:", err);
    throw err;
  }
}
