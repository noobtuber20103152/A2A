import OpenAI from "openai";
const client = new OpenAI({
    apiKey: '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'
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
