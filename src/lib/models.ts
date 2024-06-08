export interface Model {
  name: string;
  displayName: string;
}

// source is AppConfig
// https://github.com/mlc-ai/web-llm/blob/main/src/config.ts
export const Models: Model[] = [
  {
    name: "TinyLlama-1.1B-Chat-v0.4-q4f32_1-MLC-1k",
    displayName: "Tiny Llama 1.1B - (1k)",
  },
  {
    name: "phi-1_5-q4f32_1-MLC",
    displayName: "Phi-1.5",
  },
  {
    name: "gemma-2b-it-q4f32_1-MLC",
    displayName: "Gemma 2B",
  },
  {
    name: "RedPajama-INCITE-Chat-3B-v1-q4f32_1-MLC",
    displayName: "RedPajama 3B",
  },
  {
    name: "Mistral-7B-Instruct-v0.3-q4f16_1-MLC",
    displayName: "Mistral 7B Instruct",
  },
  {
    name: "Llama-2-7b-chat-hf-q4f16_1-MLC",
    displayName: "Llama2 7B",
  },
  {
    name: "Llama-2-7b-chat-hf-q4f32_1-MLC-1k",
    displayName: "Llama2 7B - (1k)",
  },
  {
    name: "Llama-2-13b-chat-hf-q4f16_1-MLC",
    displayName: "Llama2 13B",
  },
  {
    name: "Llama-3-8B-Instruct-q4f16_1-MLC",
    displayName: "Llama3 8B Instruct",
  },
  {
    name: "Llama-3-8B-Instruct-q4f32_1-MLC-1k",
    displayName: "Llama3 8B Instruct - (1k)",
  },
  {
    name: "Llama-3-70B-Instruct-q3f16_1-MLC",
    displayName: "Llama3 70B Instruct",
  },
];
