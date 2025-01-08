import { streamText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

// Initialize Google Generative AI with the API key
const google = createGoogleGenerativeAI({
  apiKey: "AIzaSyAf61goeFziI7H9cMRqKFmzjT_YfRdyAQs",
});

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    // Parse incoming request JSON
    const { messages } = await req.json();
    console.log('Received messages:', messages);

    // Start streaming text from Google Generative AI
    const result = streamText({
      model: google("models/gemini-1.5-pro-latest"), // Specify the model correctly
      system: 'You are a helpful assistant.',
      messages,
    });

    // Log the result object for debugging
    console.log('Streaming result initialized:', result);

    // Return the response as a data stream
    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Error handling POST request:', error);
    return new Response(JSON.stringify({ error: 'Failed to process the request' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
