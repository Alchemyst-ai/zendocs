"use client";

import type React from "react";

import { DocumentList } from "@/components/docs/docs-list";
import { Button } from "@/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Menu, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { Textarea } from "../ui/textarea";
import DocSearch from "./doc-search";

export default function DocGen() {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [generatedContentTitle, setGeneratedContentTitle] = useState("");
  const [generatedContent, setGeneratedContent] = useState("");
  const [generatedContentTimestamp, setGeneratedContentTimestamp] = useState(0);
  const [generatedContentSlug, setGeneratedContentSlug] = useState("");
  const [isDocsListOpen, setIsDocsListOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(true);

  const toggleSearchModal = () => {
    setIsLoading(true);
    setSearchModalOpen(true);
  };

  const handleGenerate = async () => {
    if (!query.trim()) return;

    setIsLoading(true);

    try {
      // Make API call to backend
      const response = await fetch("/api/docs/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      });

      if (response.ok) {
        const data: {
          data: {
            title: string;
            slug: string;
            result: { content?: string; title: string };
            timestamp: number;
          };
          success: boolean;
        } = await response.json();
        console.log("Received data = ", data);

        // Set the generated content and open the sheet
        setGeneratedContent(
          data.data.result.content?.replaceAll("\\n", "\n\n") ||
            // .replaceAll("\\n", "<br />")
            // .replaceAll("\n", "<br />")
            "Generated document content will appear here."
        );
        setGeneratedContentTitle(data.data.title);
        setGeneratedContentTimestamp(data.data.timestamp);
        setGeneratedContentSlug(data.data.slug);
        setIsSheetOpen(true);
      } else {
        console.error("API call failed");
      }
    } catch (error) {
      console.error("Error making API call:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Check for Ctrl+Enter
    if (e.ctrlKey && e.key === "Enter") {
      e.preventDefault();
      await handleGenerate();
    }
  };

  return (
    <div className="h-screen w-full">
      <ResizablePanelGroup direction="horizontal" className="min-h-full">
        {isDocsListOpen && (
          <>
            <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
              <div className="h-full bg-zinc-950 relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 text-gray-400 hover:text-white"
                  onClick={() => setIsDocsListOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
                <DocumentList currentSlug={generatedContentSlug} />
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
          </>
        )}

        <ResizablePanel defaultSize={isDocsListOpen ? 80 : 100}>
          {/* Hamburger Menu - Fixed at top left */}
          <div className="absolute top-4 left-4 z-10">
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-white"
              onClick={() => setIsDocsListOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>

          {/* Main content centered in the middle */}
          <div className="h-full w-full flex items-center justify-center">
            <div className="w-full max-w-md flex flex-col items-center">
              {/* Logo */}
              <div className="mb-8">
                <Image
                  src="/logo/alchemyst_long_dark.svg"
                  alt="Alchemyst Logo"
                  width={272}
                  height={92}
                />
              </div>

              {/* Search Box */}
              <div className="w-full relative mb-6">
                <div className="relative">
                  <Textarea
                    value={query}
                    rows={3}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown as never}
                    placeholder="Generate your doc on..."
                    className="bg-background border-orange-500 focus-visible:ring-orange-500 pr-10 py-6 text-base min-h-[100px]"
                    disabled={isLoading}
                  />
                  {query && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setQuery("")}
                      className="absolute right-2 top-4 h-8 w-8 text-muted-foreground hover:text-foreground"
                      disabled={isLoading}
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Clear search</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex space-x-4">
                {/* <Button
                  onClick={toggleSearchModal}
                  disabled={isLoading}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "Go Zen!"
                  )}
                </Button> */}

                {/* DocSearch modal goes here */}
                <DocSearch open={searchModalOpen} query={query} />
              </div>

              {/* Instructions */}
              <p className="mt-6 text-muted-foreground text-sm text-center">
                Press{" "}
                <kbd className="px-1.5 py-0.5 bg-muted rounded text-orange-500 font-semibold">
                  Ctrl
                </kbd>{" "}
                +{" "}
                <kbd className="px-1.5 py-0.5 bg-muted rounded text-orange-500 font-semibold">
                  Enter
                </kbd>{" "}
                to generate
              </p>
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Sheet for displaying generated content */}
      {/* {isSheetOpen && (
        <DocSheet
          isSheetOpen={isSheetOpen}
          setIsSheetOpen={setIsSheetOpen}
          generatedContent={generatedContent}
          generatedContentSlug={generatedContentSlug}
          generatedContentTimestamp={generatedContentTimestamp}
          generatedContentTitle={generatedContentTitle}
          query={query}
        />
      )} */}
    </div>
  );
}
