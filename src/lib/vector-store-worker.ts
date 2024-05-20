import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { XenovaTransformersEmbeddings } from "../lib/embed";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { Document } from "@langchain/core/documents";

self.onmessage = async (e: MessageEvent) => {
  const { fileText, fileType, userInput } = e.data;

  console.log("Vector search worker received data:", fileText, userInput);

  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 50,
  });
  console.log("Text Splitter has been created");
  console.log(fileType);

  if (fileType === "application/pdf") {
    const docs = await textSplitter.splitDocuments(fileText);
    console.log("Docs have been created");
    console.log({ docs });
    let results;
    try {
      const vectorStore = await MemoryVectorStore.fromDocuments(
        docs,
        new XenovaTransformersEmbeddings()
      );
      results = await vectorStore.similaritySearch(userInput, 5);
      console.log("Vector search worker results:", results);
      postMessage(results);
    } catch (err) {
      console.error("Vector search worker error:", err);
      postMessage(null);
    }
  } else {
    // Read normal .txt or .csv files
    const docs = await textSplitter.splitText(fileText);
    console.log("Docs have been created");
    console.log({ docs });
    let results;
    try {
      const vectorStore = await MemoryVectorStore.fromTexts(
        docs,
        { text: "text" },
        new XenovaTransformersEmbeddings()
      );
      results = await vectorStore.similaritySearch(userInput, 5);
      console.log("Vector search worker results:", results);
      postMessage(results);
    } catch (err) {
      console.error("Vector search worker error:", err);
      postMessage(null);
    }
  }
};
