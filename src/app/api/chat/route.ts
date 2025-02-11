import { streamText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
const google = createGoogleGenerativeAI({
  apiKey
});

export const maxDuration = 30;

const FINANCE_SYSTEM_PROMPT = `You are a financial assistant specializing in budgeting and expense management. Format your responses as follows:

• For general advice: Use short bullet points starting with "•"
• For budgeting breakdowns: Use this exact format:
  1. Essential Expenses (50%): [brief details]
  2. Non-Essential Spending (30%): [brief details]
  3. Savings & Debt (20%): [brief details]

Keep responses under 3-4 points total. Be direct and specific with numbers.`;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    console.log('Received messages:', messages);

    const result = streamText({
      model: google("models/gemini-1.5-pro-latest"),
      system: FINANCE_SYSTEM_PROMPT,
      messages,
      temperature: 0.7,
      maxTokens: 150,
    });

    console.log('Streaming result initialized:', result);
    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Error handling POST request:', error);
    return new Response(JSON.stringify({ error: 'Failed to process the request' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}