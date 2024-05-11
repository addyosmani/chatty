import useChatStore from "@/hooks/useChatStore";
import * as webllm from "@mlc-ai/web-llm";

export default class WebLLMHelper {
  engine: webllm.EngineInterface | null;
  storedMessages = useChatStore((state) => state.messages);
  setStoredMessages = useChatStore((state) => state.setMessages);
  selectedModel = useChatStore((state) => state.selectedModel);
  setEngine = useChatStore((state) => state.setEngine);
  appConfig = webllm.prebuiltAppConfig;

  public constructor(engine: webllm.EngineInterface | null) {
    this.appConfig.useIndexedDBCache = true;
    this.engine = engine;
    this.setEngine(engine);
  }

  // Initialize progress callback
  private initProgressCallback = (report: webllm.InitProgressReport) => {
    this.setStoredMessages((message) => [
      ...message.slice(0, -1),
      { role: "assistant", content: report.text },
    ]);
  };

  // Initialize the engine
  public async initialize(): Promise<webllm.EngineInterface> {
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
      this.selectedModel.name,
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
}
