// Runs WebLLM model inference off the main thread.
// https://www.npmjs.com/package/@browser-ai/web-llm
import { WebWorkerMLCEngineHandler } from "@browser-ai/web-llm";

const handler = new WebWorkerMLCEngineHandler();

self.onmessage = (msg: MessageEvent) => {
  handler.onmessage(msg);
};
