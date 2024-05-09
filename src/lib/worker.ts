// https://www.npmjs.com/package/@mlc-ai/web-llm
import { EngineWorkerHandler, Engine } from "@mlc-ai/web-llm";

// Hookup an Engine to a worker handler
const engine = new Engine();
const handler = new EngineWorkerHandler(engine);
self.onmessage = (msg: MessageEvent) => {
  handler.onmessage(msg);
};
