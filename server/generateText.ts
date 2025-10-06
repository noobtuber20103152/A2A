import OpenAI from "openai";
const client = new OpenAI({
    apiKey: '',
});


export async function generate(prompt: string) {
    const response = await client.chat.completions.create({
        model: "gpt-4.1-mini",
        messages: [
            { role: "user", content: prompt }
        ],
    });
    return response.choices[0].message.content;
}
