import OpenAI from "openai";
const client = new OpenAI({
  apiKey: ADD_YOUR_OPEN_AI_API_KEY,
});

export async function generate(prompt: string) {
  const response = await client.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [{ role: "user", content: prompt }],
  });
  return response.choices[0].message.content;
}
