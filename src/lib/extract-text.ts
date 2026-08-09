import type { ChatDocument } from "./rag";

/** File types we can pull plain text out of, for the attachment picker. */
export const DOCUMENT_ACCEPT = ".pdf,.txt,.md,.csv,.json,text/*,application/pdf";

async function extractPdfText(file: File): Promise<string> {
  // pdfjs touches DOM/worker APIs, so it is only ever loaded in the browser.
  const pdfjs = await import("pdfjs-dist");

  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();

  const buffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buffer }).promise;

  const pages: string[] = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    if (text) {
      pages.push(text);
    }
  }

  return pages.join("\n\n");
}

/** Read an uploaded file into a `ChatDocument` ready for embedding. */
export async function extractDocument(file: File): Promise<ChatDocument> {
  const isPdf =
    file.type === "application/pdf" ||
    file.name.toLowerCase().endsWith(".pdf");

  const text = isPdf ? await extractPdfText(file) : await file.text();

  if (!text.trim()) {
    throw new Error("No readable text found in this file.");
  }

  return {
    name: file.name,
    mediaType: file.type || (isPdf ? "application/pdf" : "text/plain"),
    text,
  };
}
