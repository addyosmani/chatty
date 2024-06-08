// https://www.npmjs.com/package/@mlc-ai/web-llm
import { MLCEngineWorkerHandler, MLCEngine } from "@mlc-ai/web-llm";

// Hookup an Engine to a worker handler
const engine = new MLCEngine();
const handler = new MLCEngineWorkerHandler(engine);
self.onmessage = (msg: MessageEvent) => {
  handler.onmessage(msg);
};
