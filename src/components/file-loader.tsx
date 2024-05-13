import { useState } from "react";
import FileEmbedder from "./file-embedder";
import { WebPDFLoader } from "langchain/document_loaders/web/pdf";
import { Button } from "./ui/button";
import { Cross2Icon } from "@radix-ui/react-icons";

export default function FileLoader({ setFileText }: { setFileText: any }) {
  const [files, setFiles] = useState<File[]>();
  const [uploadStatus, setUploadStatus] = useState("Embed");

  const handleEmbed = async (files: File[]) => {
    if (files && files.length) {
      setFiles(files);
      const file = files[0];
      let text;
      const blob = new Blob([file]);

      const pdfLoader = new WebPDFLoader(blob);
      text = await pdfLoader.load();

      setFileText(text);
      setUploadStatus("Embed Complete");
    }
  };

  const readFileContent = async (file: File) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        // Resolve with the text content
        resolve(reader.result);
      };
      reader.onerror = reject;
      reader.readAsText(file); // Read file as text
    });
  };

  return (
    <div>
      {!files ? (
        <FileEmbedder handleEmbed={handleEmbed} />
      ) : (
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-full shrink-0"
        >
          <span>.pdf</span>
          <span className="absolute top-0 right-0 text-white bg-red-400 hover:bg-red-600 w-3 h-3 rounded-full flex items-center justify-center">
            <Cross2Icon
              className="w-3 h-3"
              onClick={() => {
                setFiles(undefined);
                setFileText(null);
                setUploadStatus("Embed");
              }}
            />
          </span>
        </Button>
      )}
    </div>
  );
}
