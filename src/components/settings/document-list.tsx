"use client";

import { useEffect } from "react";
import { useDocumentStore } from "@/hooks/useDocumentStore";
import { Button } from "@/components/ui/button";
import { Trash2, FileText } from "lucide-react";
import { toast } from "sonner";
import { formatFileSize, getFileTypeLabel } from "@/lib/pdf-parser";

export default function DocumentList() {
  const { documents, loadDocuments, deleteDocument, isLoading } =
    useDocumentStore();

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleDelete = async (id: string, fileName: string) => {
    try {
      await deleteDocument(id);
      toast.success(`Deleted ${fileName}`);
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(`Failed to delete ${fileName}`);
    }
  };

  if (isLoading && documents.length === 0) {
    return <div className="text-center py-8">Loading documents...</div>;
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No documents uploaded yet</p>
        <p className="text-sm">Upload documents above to enable RAG</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-muted-foreground mb-4">
        Uploaded Documents ({documents.length})
      </h3>
      {documents.map((doc) => (
        <div
          key={doc.id}
          className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
        >
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="font-medium">{doc.fileName}</p>
              <p className="text-sm text-muted-foreground">
                {formatFileSize(doc.fileSize)} -{" "}
                {getFileTypeLabel(doc.fileType, doc.fileName)}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDelete(doc.id, doc.fileName)}
            disabled={isLoading}
          >
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      ))}
    </div>
  );
}
