// Web Worker for @browser-ai/web-llm model inference
import { WebWorkerMLCEngineHandler } from "@browser-ai/web-llm";

// Hookup an Engine to a worker handler
const handler = new WebWorkerMLCEngineHandler();
self.onmessage = (msg: MessageEvent) => {
  handler.onmessage(msg);
};
