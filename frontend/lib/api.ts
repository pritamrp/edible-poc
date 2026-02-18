import { ChatRequest, ChatResponse, EdibleProduct } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export async function sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
  const response = await fetch(`${API_URL}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Chat request failed: ${response.statusText}`);
  }

  return response.json();
}

export async function searchProducts(keyword: string): Promise<EdibleProduct[]> {
  const response = await fetch(`${API_URL}/search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ keyword }),
  });

  if (!response.ok) {
    throw new Error(`Search request failed: ${response.statusText}`);
  }

  return response.json();
}

export async function trackClick(
  sessionId: string,
  sku: string,
  name: string,
  position: number
): Promise<void> {
  await fetch(`${API_URL}/analytics/click`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      session_id: sessionId,
      sku,
      name,
      position,
    }),
  });
}

export async function trackConversion(sessionId: string): Promise<void> {
  await fetch(`${API_URL}/analytics/convert`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      session_id: sessionId,
    }),
  });
}
