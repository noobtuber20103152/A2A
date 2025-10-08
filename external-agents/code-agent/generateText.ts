import OpenAI from "openai";
const client = new OpenAI({
    apiKey: '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',
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
