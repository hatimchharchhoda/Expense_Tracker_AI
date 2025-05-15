// app/api/chat/route.ts
import { streamText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
const google = createGoogleGenerativeAI({
  apiKey
});

export const maxDuration = 60; // Increase timeout to 60 seconds

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    
    // Extract the system message if present
    const systemMessage = messages.find((m: any) => m.role === 'system');
    
    // Filter out system messages for Gemini
    const userMessages = messages.filter((m: any) => m.role !== 'system');
    
    // Create a complete version of the system message
    let systemPrompt = `You are a financial assistant helping with budgeting and expense management.`;
    
    // IMPORTANT: Pass through the ENTIRE system message without filtering
    if (systemMessage) {
      systemPrompt = systemMessage.content;
      
      // Add this section to ensure expense details are analyzed correctly
      systemPrompt += `
When analyzing expense data:
1. Focus on the TOP SPENDING CATEGORIES section
2. Provide specific amounts and percentages when discussing spending
3. Never say you don't have enough information about expenses`;
    }
    
    console.log("System prompt used:", systemPrompt.substring(0, 200) + "..."); // Log for debugging
    
    try {
      const result = streamText({
        model: google("models/gemini-1.5-flash-latest"),
        system: systemPrompt,
        messages: userMessages,
        temperature: 0.3, // Lower temperature for more focused, factual responses
        maxTokens: 800, // Increased token limit to handle more data
      });
      
      return result.toDataStreamResponse();
    } catch (streamError) {
      console.error("Streaming error:", streamError);
      
      // Fallback to non-streaming response
      return new Response(JSON.stringify({
        role: "assistant",
        content: "I apologize, but I'm having trouble analyzing your financial data right now. Please try again in a moment."
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('Error handling chat request:', error);
    return new Response(JSON.stringify({ 
      role: "assistant",
      content: "Sorry, I encountered an error while processing your request. Please try again." 
    }), {
      status: 200, // Return 200 to avoid UI errors
      headers: { 'Content-Type': 'application/json' },
    });
  }
}