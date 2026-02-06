"use client";

import dynamic from "next/dynamic";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// Dynamically import components that use browser-only libraries (embeddings/transformers.js)
const DocumentList = dynamic(() => import("@/components/settings/document-list"), {
  ssr: false,
});
const DocumentUpload = dynamic(() => import("@/components/settings/document-upload"), {
  ssr: false,
});

export default function SettingsPage() {
  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-semibold">Settings</h1>
      </div>

      <Tabs defaultValue="documents">
        <TabsList>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="general">General</TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="mt-6">
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-medium mb-2">Knowledge Base</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Upload documents to enable RAG (Retrieval-Augmented Generation).
                When chatting, toggle &quot;Search in documents&quot; to include
                relevant context from your uploaded files.
              </p>
            </div>

            <DocumentUpload />
            <DocumentList />
          </div>
        </TabsContent>

        <TabsContent value="general" className="mt-6">
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-medium mb-2">General Settings</h2>
              <p className="text-sm text-muted-foreground">
                Configure your preferences.
              </p>
            </div>

            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Additional settings coming soon...
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
