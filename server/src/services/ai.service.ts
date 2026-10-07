import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function getAIResponse(userMessage: string) {
  const response = await openai.responses.create({
    model: "gpt-5.5",
    input: userMessage,
  });

  return response.output_text;
}
