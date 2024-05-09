
import { GoogleGenerativeAI } from "@google/generative-ai";

class GeminiApiClient {
  private genAI: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async generateContent(prompt: string, modelId: string = "gemini-pro"): Promise<string> {
    try {
      const model = this.genAI.getGenerativeModel({ model: modelId });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      throw new Error('Failed to generate content with Gemini API');
    }
  }
}

export default GeminiApiClient;
