// https://github.com/mlc-ai/web-llm/blob/main/examples/get-started-web-worker

import useChatStore from "@/hooks/useChatStore";
import * as webllm from "@mlc-ai/web-llm";
import { Model } from "./models";
import { Document } from "@langchain/core/documents";

export default class WebLLMHelper {
  engine: webllm.EngineInterface | null;
  setStoredMessages = useChatStore((state) => state.setMessages);
  setEngine = useChatStore((state) => state.setEngine);
  appConfig = webllm.prebuiltAppConfig;

  public constructor(engine: webllm.EngineInterface | null) {
    this.appConfig.useIndexedDBCache = true;
    this.engine = engine;
  }

  // Initialize progress callback
  private initProgressCallback = (report: webllm.InitProgressReport) => {
    this.setStoredMessages((message) => [
      ...message.slice(0, -1),
      { role: "assistant", content: report.text },
    ]);
  };

  // Initialize the engine
  public async initialize(
    selectedModel: Model
  ): Promise<webllm.EngineInterface> {
    this.setStoredMessages((message) => [
      ...message.slice(0, -1),
      {
        role: "assistant",
        content: "Loading model... This might take a while",
      },
    ]);
    const engine: webllm.EngineInterface = await webllm.CreateWebWorkerEngine(
      new Worker(new URL("./worker.ts", import.meta.url), {
        type: "module",
      }),
      selectedModel.name,
      {
        initProgressCallback: this.initProgressCallback,
        appConfig: this.appConfig,
      }
    );
    this.setEngine(engine);
    return engine;
  }

  // Generate streaming completion
  public async *generateCompletion(
    engine: webllm.EngineInterface,
    input: string,
    customizedInstructions: string,
    isCustomizedInstructionsEnabled: boolean
  ): AsyncGenerator<string> {
    const storedMessages = useChatStore.getState().messages;

    console.log(storedMessages);

    const completion = await engine.chat.completions.create({
      stream: true,
      messages: [
        {
          role: "system",
          content:
            customizedInstructions && isCustomizedInstructionsEnabled
              ? "You are a helpful assistant. Assist the user with their questions. You are also provided with the following information from the user, keep them in mind for your responses: " +
                customizedInstructions
              : "You are a helpful assistant. Assist the user with their questions.",
        },
        ...storedMessages,
        { role: "user", content: input },
      ],
      temperature: 0.6,
      max_gen_len: 1024,
    });
    for await (const chunk of completion) {
      const delta = chunk.choices[0].delta.content;
      if (delta) {
        yield delta;
      }
    }
  }

  // Handle document processing using WebWorker to avoid freezing the UI
  public async processDocuments(
    fileText: Document<Record<string, any>>[] | string,
    fileType: string,
    userInput: string
  ): Promise<string | undefined> {
    console.log("Processing documents in WebLLMHelper");

    return new Promise((resolve, reject) => {
      const worker = new Worker(
        new URL("./vector-store-worker.ts", import.meta.url),
        {
          type: "module",
        }
      );

      worker.onmessage = (e: MessageEvent) => {
        const results = e.data;
        console.log("Worker returned results:", results);
        if (results) {
          // Process results
          const qaPrompt = `Answer the question based on the context provided below. Also, always keep old messages in mind when answering questions.
          If the question cannot be answered using the information provided, answer with "I don't know" and never make up your own information.
          
          Context:
          "${results.map((result: any) => result.pageContent).join("")}"

          Question:
          "${userInput}"

          Answer:
          ""
          `;
          console.log("Processed QA prompt:", qaPrompt);
          resolve(qaPrompt);
        } else {
          reject("Error processing documents");
        }
      };

      worker.onerror = (err) => {
        console.error("Vector search worker error:", err);
        reject(err);
      };

      worker.postMessage({ fileText, fileType, userInput });
    });
  }
}
