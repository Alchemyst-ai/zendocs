"use client";

import ChatApp from "@/components/docs/chat-app";
import { DocumentList } from "@/components/docs/docs-list";
import TableOfContents from "@/components/docs/table-of-contents";
import { Button } from "@/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Menu, X } from "lucide-react";
import { useState } from "react";

interface DocumentLayoutProps {
  title: string;
  date: string;
  content: string;
  docSlug: string;
}

export default function DocumentLayout({
  title,
  date,
  content,
  docSlug,
}: DocumentLayoutProps) {
  const [isDocListOpen, setIsDocListOpen] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div className="h-screen bg-black text-white relative">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-[linear-gradient(315deg,rgba(249,115,22,0.15)_0%,rgba(249,115,22,0.05)_50%,transparent_100%)]" />
      
      <ResizablePanelGroup
        direction="horizontal"
        className="min-h-full rounded-lg border-none"
      >
        {isDocListOpen && (
          <>
            <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
              <div className="h-full bg-zinc-950 relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 text-gray-400 hover:text-white md:hidden"
                  onClick={() => setIsDocListOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
                <DocumentList currentSlug={docSlug} />
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
          </>
        )}

        <ResizablePanel
          defaultSize={60}
          minSize={40}
        >
          <div className="container mx-auto px-4 py-12 max-w-4xl h-full overflow-auto relative">
            <header className="mb-10 flex items-center relative z-10">
              {!isDocListOpen && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="mr-2 text-gray-400 hover:text-white"
                  onClick={() => setIsDocListOpen(true)}
                >
                  <Menu className="h-5 w-5" />
                </Button>
              )}
              <div>
                <h1 className="text-4xl font-bold mb-3">{title}</h1>
                <time className="text-gray-400">{date}</time>
              </div>
            </header>

            <div className="space-y-8 relative z-10">
              {/* Main content with improved styling */}
              <div
                className="prose prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: content }}
              />
            </div>
          </div>
        </ResizablePanel>

        {/* Right side Table of Contents - No divider */}
        <ResizablePanel defaultSize={20} minSize={15} maxSize={25}>
          <div className="h-full p-6 flex-shrink-0">
            <TableOfContents content={content} />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Chat Widget Toggle Icon */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="w-12 h-12 rounded-full bg-black hover:bg-black shadow-lg p-0 overflow-hidden"
        >
          <img
            src="/logo/alchemyst-ai.jpeg"
            alt="Alchemyst AI"
            className="w-8 h-8 object-cover"
          />
        </Button>
      </div>

      {/* Floating Chat Widget (toggleable) */}
      {isChatOpen && (
        <div className="fixed bottom-24 right-6 z-40 w-[380px] h-[520px] shadow-2xl rounded-lg overflow-hidden">
          <ChatApp docSlug={docSlug} />
        </div>
      )}
    </div>
  );
}
