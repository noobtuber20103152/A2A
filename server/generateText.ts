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
