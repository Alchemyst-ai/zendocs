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
            <DialogTitle>Search Results for: &quot;{query}&quot;</DialogTitle>
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
                  className="py-2 my-1 px-3 cursor-pointer"
                  onClick={() => window.open(`/docs/${result.slug}`, "_blank")}
                >
                  <CardTitle className="font-medium">{result.title}</CardTitle>
                  <CardDescription>
                    {result.content.slice(0, 30)}...
                  </CardDescription>
                </Card>
              ))}
            </div>
          )}
          {!!searchResultsLoading && <div>Loading results...</div>}
          {!searchResultsLoading && searchResults.length === 0 && (
            <div>No results found.</div>
          )}
          <Button onClick={handleGenerate}>Generate content</Button>
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
