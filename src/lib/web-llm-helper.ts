// https://github.com/mlc-ai/web-llm/blob/main/examples/get-started-web-worker

import useChatStore from "@/hooks/useChatStore";
import * as webllm from "@mlc-ai/web-llm";
import { Model } from "./models";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { XenovaTransformersEmbeddings } from "../lib/embed";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { Document } from "@langchain/core/documents";

export default class WebLLMHelper {
  engine: webllm.EngineInterface | null;
  storedMessages = useChatStore((state) => state.messages);
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
    input: string
  ): AsyncGenerator<string> {
    const completion = await engine.chat.completions.create({
      stream: true,
      messages: [
        {
          role: "system",
          content:
            "You are a very helpful assistant. Assist the user with their questions.",
        },
        ...this.storedMessages,
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
    fileText: Document<Record<string, any>>[],
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
          const qaPrompt = `You are an AI assistant providing helpful advice. You are given content from a file/document that is provided to you inbetween the <context> HTML tags.
          The user will ask a question about the context and your job is to create a conversational answer based on the context provided.
          If you need to provide the user with a link to a resource from the context, you can do so by providing the URL formatted as such: [URL](https://www.example.com).
          If the question is not related to the context, politely respond that you are tuned to only answer questions that are related to the context.
          If you don't know the answer to the question, politely respond that you don't know the answer. Never come up your with own answer!
          User question: ${userInput}
          =========
          <context>
          ${results.map((result: any) => result.pageContent).join("")}
          </context>
          =========`;
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

      worker.postMessage({ fileText, userInput });
    });
  }
}
