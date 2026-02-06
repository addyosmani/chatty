/**
 * Parse different file types and extract text content.
 * PDF parsing runs client-side using pdfjs-dist (same approach as local-rag).
 */

/**
 * Parse a PDF file and extract text client-side using pdfjs-dist.
 */
export async function parsePDF(file: File): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const textParts: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    textParts.push(pageText);
  }

  return textParts.join("\n\n");
}

/**
 * Parse a text file (txt, md, csv)
 */
export async function parseTextFile(file: File): Promise<string> {
  return file.text();
}

/**
 * Parse any supported file type
 */
export async function parseFile(file: File): Promise<string> {
  const fileType = file.type.toLowerCase();
  const fileName = file.name.toLowerCase();

  // PDF files
  if (fileType === "application/pdf" || fileName.endsWith(".pdf")) {
    return parsePDF(file);
  }

  // Text-based files
  if (
    fileType.startsWith("text/") ||
    fileName.endsWith(".txt") ||
    fileName.endsWith(".md") ||
    fileName.endsWith(".csv") ||
    fileName.endsWith(".json")
  ) {
    return parseTextFile(file);
  }

  // Fallback: try to read as text
  try {
    return await file.text();
  } catch {
    throw new Error(`Unsupported file type: ${file.type || file.name}`);
  }
}

/**
 * Split text into chunks with overlap
 */
export function splitIntoChunks(
  text: string,
  chunkSize: number = 1000,
  overlap: number = 100
): string[] {
  const chunks: string[] = [];

  // Normalize whitespace
  const normalizedText = text.replace(/\s+/g, " ").trim();

  if (normalizedText.length <= chunkSize) {
    return [normalizedText];
  }

  let start = 0;

  while (start < normalizedText.length) {
    let end = start + chunkSize;

    // Try to break at a sentence or word boundary
    if (end < normalizedText.length) {
      // Look for sentence end within the last 100 characters
      const searchStart = Math.max(start + chunkSize - 100, start);
      const searchEnd = Math.min(start + chunkSize + 50, normalizedText.length);
      const searchText = normalizedText.slice(searchStart, searchEnd);

      // Try to find sentence boundary
      const sentenceEnd = searchText.search(/[.!?]\s/);
      if (sentenceEnd !== -1 && sentenceEnd < 150) {
        end = searchStart + sentenceEnd + 2; // Include the punctuation and space
      } else {
        // Fall back to word boundary
        const lastSpace = normalizedText.lastIndexOf(" ", end);
        if (lastSpace > start) {
          end = lastSpace + 1;
        }
      }
    } else {
      end = normalizedText.length;
    }

    const chunk = normalizedText.slice(start, end).trim();
    if (chunk.length > 0) {
      chunks.push(chunk);
    }

    // Move start forward, accounting for overlap
    start = end - overlap;

    // Prevent infinite loop
    if (start >= normalizedText.length - overlap) break;
  }

  return chunks;
}

/**
 * Get file type label for display
 */
export function getFileTypeLabel(mimeType: string, fileName?: string): string {
  const typeMap: Record<string, string> = {
    "application/pdf": "PDF",
    "text/plain": "TXT",
    "text/markdown": "MD",
    "text/csv": "CSV",
    "application/json": "JSON",
  };

  if (typeMap[mimeType]) {
    return typeMap[mimeType];
  }

  // Check file extension
  if (fileName) {
    const ext = fileName.split(".").pop()?.toUpperCase();
    if (ext) return ext;
  }

  return "FILE";
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
