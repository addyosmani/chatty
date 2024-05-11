export interface Model {
  name: string;
  displayName: string;
  size: string;
}

export const Models: Model[] = [
  {
    name: "TinyLlama-1.1B-Chat-v0.4-q4f32_1-1k",
    displayName: "Tiny Llama 1.1B",
    size: "1.1B",
  },
  {
    name: "gemma-2b-it-q4f16_1",
    displayName: "Gemma 2B",
    size: "2B",
  },
];
