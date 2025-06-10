"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Home, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

interface Document {
  id: string;
  title: string;
  slug: string;
  category: string;
  updatedAt: string;
}

interface DocumentListProps {
  currentSlug: string;
}

export type BoxType<T> =
  | {
      content: T;
      error: null;
    }
  | {
      content: null;
      error: Error;
    };

const fetchDocuments = async (): Promise<BoxType<Document[]>> => {
  const documentResponse = await fetch("/api/docs/list");

  if (!documentResponse.ok) {
    return {
      content: null,
      error: new Error(
        `Failed to fetch documents. Error: ${documentResponse.status} - ${documentResponse.statusText}`,
      ),
    };
  }

  const { success, data } = await documentResponse.json();

  if (!success) {
    return { content: null, error: new Error("Failed to fetch documents.") };
  }
  return { content: data, error: null };
};

export function DocumentList({ currentSlug }: DocumentListProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocs, setFilteredDocs] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDocuments().then((data) => {
      const { content: documents, error } = data;
      if (!!error || !documents) {
        console.error(error);
        setIsLoading(false);
        return;
      }
      setDocuments(documents);
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    console.log("Documents fetched:", documents);
  }, [documents]);

  // Filter documents based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredDocs(documents);
    } else {
      const filtered = documents.filter(
        (doc) => doc.title.toLowerCase().includes(searchQuery.toLowerCase()), // ||
        // doc.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredDocs(filtered);
    }
  }, [searchQuery, documents]);

  const handleDocumentClick = (slug: string) => {
    router.push(`/docs/${slug}`);
  };

  const handleHomeClick = () => {
    router.push("/");
  };

  return (
    <div className="flex flex-col h-full p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Documents</h2>
        {currentSlug && (
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:text-black"
            onClick={handleHomeClick}
            title="Return to home page"
          >
            <Home className="h-5 w-5" />
          </Button>
        )}
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search documents..."
          className="pl-9 bg-zinc-900 border-zinc-800 text-white"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <ScrollArea className="flex-grow">
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="bg-zinc-900 border-zinc-800">
                <CardContent className="p-3">
                  <div className="h-5 w-3/4 bg-zinc-800 rounded animate-pulse" />
                  <div className="h-4 w-1/2 bg-zinc-800 rounded animate-pulse mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredDocs.length > 0 ? (
          <div className="space-y-2">
            {filteredDocs.map((doc) => (
              <Card
                key={doc.id}
                className={`bg-zinc-900 border-zinc-800 hover:bg-zinc-800 transition-colors cursor-pointer ${
                  doc.slug === currentSlug
                    ? "border-l-4 border-l-amber-500"
                    : ""
                }`}
                onClick={() => handleDocumentClick(doc.slug)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-6 w-6 mt-1 text-gray-400" />
                    <div>
                      <h3 className="font-medium text-sm text-gray-200">
                        {doc.title.length > 40 ? doc.title.slice(0, 40) + "..." : doc.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-400">
                          {doc.category || "Uncategorized"}
                        </span>
                        <span className="text-xs text-gray-500">•</span>
                        <span className="text-xs text-gray-500">
                          {doc.updatedAt.slice(0, 10)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <p>No documents found</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
