"use client";

import ChatApp from "@/components/docs/chat-app";
import { DocumentList } from "@/components/docs/docs-list";
import { Button } from "@/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Menu, MessageSquare, X } from "lucide-react";
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
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isDocListOpen, setIsDocListOpen] = useState(true);

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
          defaultSize={
            isDocListOpen ? (isChatOpen ? 50 : 80) : isChatOpen ? 70 : 100
          }
          minSize={30}
        >
          <div className="container mx-auto px-4 py-12 max-w-6xl h-full overflow-auto relative">
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

        {isChatOpen && (
          <>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
              <div className="h-full bg-zinc-950 relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 text-gray-400 hover:text-black z-50"
                  onClick={() => setIsChatOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
                <ChatApp docSlug={docSlug} />
              </div>
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>

      {!isChatOpen && (
        <Button
          className="fixed bottom-6 right-6 rounded-full w-12 h-12 bg-amber-500 hover:bg-amber-600 shadow-lg"
          onClick={() => setIsChatOpen(true)}
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
      )}
    </div>
  );
}
