import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { NextResponse } from 'next/server';

const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

const google = createGoogleGenerativeAI({
  apiKey
});

export const runtime = 'edge';

export async function POST() {
  try {
    const prompt =
      "Create a list of five Budget Recommendations formatted as a single string. Each recommendation should be separated by '||'. These recommendations are for users on an Expense Tracker Website.";

    const { text: answer } = await generateText({
      model: google("gemini-1.5-flash"),
      prompt,
    });
    return NextResponse.json({ answer }); // Return as string
  } catch (error) {
    console.error("Error generating recommendations:", error);
    return NextResponse.json(
      { error: "Failed to generate recommendations. Please try again later." },
      { status: 500 }
    );
  }
}
