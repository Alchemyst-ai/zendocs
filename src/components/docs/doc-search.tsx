"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Card, CardDescription, CardTitle } from "../ui/card";
import DocSheet from "./doc-sheet";
// import type { ReactNode } from 'react';

function DocSearch({
  query,
  open: modalOpen,
}: {
  query: string;
  open: boolean;
}): React.ReactNode {
  const [searchResultsModalOpen, setSearchResultsModalOpen] =
    useState(modalOpen);
  const [searchResultsLoading, setSearchResultsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<
    {
      slug: string;
      content: string;
      title: string;
      metadata: { timestamp: number };
    }[]
  >([]);
  const [generatedContentTitle, setGeneratedContentTitle] = useState("");
  const [generatedContent, setGeneratedContent] = useState("");
  const [generatedContentTimestamp, setGeneratedContentTimestamp] = useState(0);
  const [generatedContentSlug, setGeneratedContentSlug] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    setSearchResultsLoading(true);
    try {
      const response = await fetch("/api/docs/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          metadata: {
            sort: -1, // Default sort order newest first
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.results);
        setSearchResultsModalOpen(true);
      } else {
        console.error("Search API call failed");
      }
    } catch (error) {
      console.error("Error making search API call:", error);
    } finally {
      setSearchResultsLoading(false);
      setIsLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    setIsGenerating(true);

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
            "Generated document content will appear here.",
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
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    console.log("Modal open = ", modalOpen);
    // handleSearch();
  }, []);

  return (
    <>
      <Dialog>
        <DialogTrigger asChild>
          <Button
            disabled={isLoading}
            className="bg-orange-500 hover:bg-orange-600 text-white"
            onClick={handleSearch}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              "Go Zen!"
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              Search Results for: &quot;
              <span className="truncate inline-block max-w-[200px] align-bottom overflow-hidden">{query}</span>
              {query.length > 30 ? "..." : ""}&quot;
            </DialogTitle>
            <DialogDescription>
              {searchResultsLoading
                ? "Loading..."
                : `Found ${searchResults.length} results`}
            </DialogDescription>
          </DialogHeader>
          {!searchResultsLoading && searchResults.length > 0 && (
            <div className="grid gap-4 py-4 overflow-auto max-h-[50vh]">
              {searchResults.map((result, index) => (
                <Card
                  key={index}
                  className="py-2 my-1 px-3 cursor-pointer flex items-center"
                  onClick={() => window.open(`/docs/${result.slug}`, "_blank")}
                >
                  <img src="/logo/documents.png" alt="document" width={16} height={16} />
                  <div className="ml-2">
                    <CardTitle className="font-medium">{result.title.length > 30 ? result.title.slice(0, 30) + "..." : result.title}</CardTitle>
                    <CardDescription>
                      {result.content.slice(0, 30)}...
                    </CardDescription>
                  </div>
                </Card>
              ))}
            </div>
          )}
          {!!searchResultsLoading && <div>Loading results...</div>}
          {!searchResultsLoading && searchResults.length === 0 && (
            <div>No results found.</div>
          )}
          <div className="mt-4 border-t pt-4">
            {isGenerating ? (
              <div className="p-4 text-center">
                <Loader2 className="h-6 w-6 animate-spin inline-block mr-2" />
                <div className="mt-2 text-sm">Generating document about "<span className="font-medium">{query.length > 25 ? query.slice(0, 25) + "..." : query}</span>"</div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 p-2 rounded-md">
                  <div className="text-white p-1 rounded-md">
                    <img src="/logo/ai.png" alt="AI assistant" width={16} height={16} />
                  </div>
                  <div>Ask AI assistant</div>
                </div>
                <div className="text-purple-500 ml-8 mt-1 text-sm cursor-pointer hover:bg-gray-100 p-2 rounded-md" onClick={handleGenerate}>
                  Can you tell me about {query}{query.length > 30 ? "..." : "?"}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
      {isSheetOpen && (
        <DocSheet
          isSheetOpen={isSheetOpen}
          setIsSheetOpen={setIsSheetOpen}
          generatedContent={generatedContent}
          generatedContentSlug={generatedContentSlug}
          generatedContentTimestamp={generatedContentTimestamp}
          generatedContentTitle={generatedContentTitle}
          query={query}
        />
      )}
    </>
  );
}

export default DocSearch;
