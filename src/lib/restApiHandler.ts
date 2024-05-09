/*
  This file uses the GeminiApiClient class to make requests to the Gemini API.
*/
import GeminiApiClient from './geminiApiClient';

// Function to handle REST API requests using the Gemini API
async function handleRESTAPIRequest(messages: any[]) {
  // Assuming the API key is stored in environment variables
  const API_KEY = process.env.GEMINI_API_KEY;

  if (!API_KEY) {
    console.error('Gemini API key not found in environment variables');
    return new Response(JSON.stringify({ error: 'Gemini API key not found' }), { status: 500 });
  }

  const geminiClient = new GeminiApiClient(API_KEY);

  // Join all messages into a single text block for the prompt
  const prompt = messages.map(message => message.content).join("\n");

  try {
    const summary = await geminiClient.generateContent(prompt, "gemini-pro");
    return new Response(summary, { status: 200 });
  } catch (error) {
    console.error('Error processing request with Gemini API:', error);
    return new Response(JSON.stringify({ error: 'Failed to process request with Gemini API' }), { status: 500 });
  }
}

export { handleRESTAPIRequest };
