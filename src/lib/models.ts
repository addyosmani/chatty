export enum Model {
  TINYLAMA_1_1B_CHAT_V0_4_Q4F32_1_1K = "TinyLlama-1.1B-Chat-v0.4-q4f32_1-1k",
}

export const MODELS: {
  [key in Model]: {
    displayName: string;
    size: string;
  };
} = {
  [Model.TINYLAMA_1_1B_CHAT_V0_4_Q4F32_1_1K]: {
    displayName: "Tiny Llama 1.1B",
    size: "1.1B",
  },
};

export const MODEL_OPTIONS = Object.entries(MODELS).map(([key, value]) => ({
  value: key,
  label: value.displayName,
}));
