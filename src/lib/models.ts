export enum Model {
  LLAMA_3_8B_INSTRUCT_Q4F16_1 = "Llama-3-8B-Instruct-q4f16_1",
}

export const MODELS: {
  [key in Model]: {
    displayName: string;
    size: string;
  };
} = {
  [Model.LLAMA_3_8B_INSTRUCT_Q4F16_1]: {
    displayName: "Llama 3.8B",
    size: "3.8B",
  },
};

export const MODEL_OPTIONS = Object.entries(MODELS).map(([key, value]) => ({
  value: key,
  label: value.displayName,
}));
