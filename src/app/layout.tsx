import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/providers/theme-provider";
import { WebLLMProvider } from "@/providers/web-llm-provider";
import { GoogleAnalytics } from "@next/third-parties/google";

const metainfo = {
  name: "Chatty",
  title: "Chatty",
  description: "Chat with web-llm models in the browser",
  url: "https://chattyui.com",
  icons: {
    icon: "/favicon-32x32.png",
  },
  image: "https://chattyui.com/metaimg.jpg",
};

export const metadata: Metadata = {
  metadataBase: new URL(metainfo.url),
  title: {
    default: metainfo.name,
    template: "%s - " + metainfo.name,
  },
  description: metainfo.description,
  authors: [
    {
      name: "Jakob Hoeg Mørk",
      url: "https://jakobhoeg.dev",
    },
    {
      name: "Addy Osmani",
      url: "https://addyosmani.com",
    },
  ],
  openGraph: {
    type: "website",
    title: metainfo.name,
    url: metainfo.url,
    description: metainfo.description,
    images: [metainfo.image],
    siteName: metainfo.name,
  },
  twitter: {
    card: "summary_large_image",
    site: metainfo.url,
    title: metainfo.name,
    description: metainfo.description,
    images: [metainfo.image],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={GeistSans.className}>
        <WebLLMProvider>
          <ThemeProvider attribute="class" defaultTheme="system">
            {children}
            <Toaster position="top-right" />
          </ThemeProvider>
        </WebLLMProvider>
      </body>
      <GoogleAnalytics gaId="G-6X7CQT49KF" />
    </html>
  );
}
