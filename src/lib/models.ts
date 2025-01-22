export enum ModelGroup {
  QWEN = 'Qwen',
  LLAMA = 'Llama',
  MISTRAL = 'Mistral',
  DEEPSEEK = 'DeepSeek',
  PHI = 'Phi',
  GEMMA = 'Gemma',
  REDPAJAMA = 'RedPajama'
}

export interface ModelDetails {
  group: ModelGroup;
  name: string;
  icon: string;
}

export const modelDetailsList: ModelDetails[] = [
  {
    group: ModelGroup.QWEN,
    name: "Qwen",
    icon: "/model-icons/qwen.webp",
  },
  {
    group: ModelGroup.LLAMA,
    name: "Llama",
    icon: "/model-icons/meta.svg",
  },
  {
    group: ModelGroup.MISTRAL,
    name: "Mistral",
    icon: "/model-icons/mistral.svg",
  },
  {
    group: ModelGroup.DEEPSEEK,
    name: "DeepSeek",
    icon: "/model-icons/deepseek.svg",
  },
  {
    group: ModelGroup.PHI,
    name: "Phi",
    icon: "/model-icons/microsoft.svg",
  },
  {
    group: ModelGroup.GEMMA,
    name: "Gemma",
    icon: "/model-icons/google.svg",
  },
  {
    group: ModelGroup.REDPAJAMA,
    name: "RedPajama",
    icon: "/model-icons/together.svg",
  }
];


export interface Model {
  group: ModelGroup;
  name: string;
  displayName: string;
  badge?: string;
  vision?: boolean;
}

// source is AppConfig
// https://github.com/mlc-ai/web-llm/blob/main/src/config.ts
export const Models: Model[] = [
  {
    group: ModelGroup.DEEPSEEK,
    name: "DeepSeek-R1-Distill-Qwen-7B-q4f16_1-MLC",
    displayName: "DeepSeek R1 Distill Qwen 7B (q4f16)",
  },
  {
    group: ModelGroup.DEEPSEEK,
    name: "DeepSeek-R1-Distill-Qwen-7B-q4f32_1-MLC",
    displayName: "DeepSeek R1 Distill Qwen 7B (q4f32)",
  },
  {
    group: ModelGroup.DEEPSEEK,
    name: "DeepSeek-R1-Distill-Llama-8B-q4f16_1-MLC",
    displayName: "DeepSeek R1 Distill Llama 8B (q4f16)",
  },
  {
    group: ModelGroup.DEEPSEEK,
    name: "DeepSeek-R1-Distill-Llama-8B-q4f32_1-MLC",
    displayName: "DeepSeek R1 Distill Llama 8B (q4f32)",
  },
  {
    group: ModelGroup.LLAMA,
    name: "TinyLlama-1.1B-Chat-v0.4-q4f32_1-MLC-1k",
    displayName: "Tiny Llama 1.1B - (1k)",
  },
  {
    group: ModelGroup.PHI,
    name: "phi-1_5-q4f32_1-MLC",
    displayName: "Phi-1.5",
  },
  {
    group: ModelGroup.GEMMA,
    name: "gemma-2b-it-q4f32_1-MLC",
    displayName: "Gemma 2B",
  },
  {
    group: ModelGroup.GEMMA,
    name: "gemma-2-2b-it-q4f32_1-MLC",
    displayName: "Gemma2 2B",
  },
  {
    group: ModelGroup.GEMMA,
    name: "gemma-2-2b-it-q4f32_1-MLC-1k",
    displayName: "Gemma2 2B - (1k)",
  },
  {
    group: ModelGroup.GEMMA,
    name: "gemma-2-9b-it-q4f32_1-MLC",
    displayName: "Gemma2 9B",
  },
  {
    group: ModelGroup.PHI,
    name: "Phi-3.5-vision-instruct-q4f16_1-MLC",
    displayName: "Phi-3.5 Vision Instruct",
    vision: true,
  },
  {
    group: ModelGroup.REDPAJAMA,
    name: "RedPajama-INCITE-Chat-3B-v1-q4f32_1-MLC",
    displayName: "RedPajama 3B",
  },
  {
    group: ModelGroup.QWEN,
    name: "Qwen2-1.5B-Instruct-q4f32_1-MLC",
    displayName: "Qwen2 1.5B Instruct",
  },
  {
    group: ModelGroup.QWEN,
    name: "Qwen2-7B-Instruct-q4f32_1-MLC",
    displayName: "Qwen2 7B Instruct",
  },
  {
    group: ModelGroup.MISTRAL,
    name: "Mistral-7B-Instruct-v0.3-q4f16_1-MLC",
    displayName: "Mistral 7B Instruct",
  },
  {
    group: ModelGroup.LLAMA,
    name: "Llama-2-7b-chat-hf-q4f16_1-MLC",
    displayName: "Llama2 7B",
  },
  {
    group: ModelGroup.LLAMA,
    name: "Llama-2-7b-chat-hf-q4f32_1-MLC-1k",
    displayName: "Llama2 7B - (1k)",
  },
  {
    group: ModelGroup.LLAMA,
    name: "Llama-2-13b-chat-hf-q4f16_1-MLC",
    displayName: "Llama2 13B",
  },
  {
    group: ModelGroup.LLAMA,
    name: "Llama-3-8B-Instruct-q4f16_1-MLC",
    displayName: "Llama3 8B Instruct",
  },
  {
    group: ModelGroup.LLAMA,
    name: "Llama-3-8B-Instruct-q4f32_1-MLC-1k",
    displayName: "Llama3 8B Instruct - (1k)",
  },
  {
    group: ModelGroup.LLAMA,
    name: "Llama-3-70B-Instruct-q3f16_1-MLC",
    displayName: "Llama3 70B Instruct",
  },
  {
    group: ModelGroup.LLAMA,
    name: "Llama-3.1-8B-Instruct-q4f32_1-MLC",
    displayName: "Llama3.1 8B Instruct",
  },
  {
    group: ModelGroup.LLAMA,
    name: "Llama-3.1-8B-Instruct-q4f32_1-MLC-1k",
    displayName: "Llama3.1 8B Instruct - (1k)",
  },
  {
    group: ModelGroup.LLAMA,
    name: "Llama-3.1-70B-Instruct-q3f16_1-MLC",
    displayName: "Llama3.1 70B Instruct",
  }
];
