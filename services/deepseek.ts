// deepseek.ts
import Constants from "expo-constants";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";


function getApiKey(): string {
  // Fallback to app.json extra if running in Expo Go
  const config = Constants.expoConfig ?? Constants.manifest;
  const extraKey = config?.extra?.openRouterApiKey;

  const key = extraKey;

  if (!key) {
    throw new Error(
      "❌ Missing OpenRouter API key. Please set it either in:\n" +
        "- .env → EXPO_PUBLIC_OPENROUTER_KEY=your_key_here\n" +
        "or\n" +
        "- app.json → expo.extra.API_KEY"
    );
  }

  return key;
}

/**
 * Generic OpenRouter chat completion helper
 */
export async function chatComplete(prompt: string): Promise<string> {
  const apiKey = getApiKey();

  console.log("🧠 Sending prompt to OpenRouter:", prompt);

    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are a helpful budgeting assistant. Respond first like a human and make sure that you classify your response as either:
            'Needs', 'Wants', or 'Savings'. If the user message is not related to budgeting, respond like a human, else default the amount to 0`
          },
          { role: "user", content: prompt },
        ],
      }),
    });

  if (!response.ok) {
    const errText = await response.text();
    console.error("❌ OpenRouter error:", errText);
    throw new Error("OpenRouter API request failed");
  }

  const data = await response.json();

  const reply =
    data?.choices?.[0]?.message?.content ??
    "⚠️ No response from OpenRouter model.";

  console.log("✅ OpenRouter reply:", reply);
  return reply;
}

/**
 * Convenience wrapper for specific queries
 */
export async function askOpenRouter(question: string): Promise<string> {
  try {
    const answer = await chatComplete(question);
    return answer;
  } catch (error) {
    console.error("🚨 Error asking OpenRouter:", error);
    return "An error occurred while contacting OpenRouter.";
  }
}
