// Updated API call using your new endpoint.
export async function getChatbotResponse(message: string): Promise<string> {
  try {

    const API_URL = import.meta.env.VITE_KNOWLEDGEKINGDOM_API;

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt: message }),
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    // Assumes the API returns an object with a property named "response"
    return data.response;
  } catch (error) {
    console.error("Failed to get chatbot response:", error);
    throw error;
  }
}
