"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Home, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { DocItem } from "@/types/docs";

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

const fetchDocuments = async (): Promise<BoxType<DocItem[]>> => {
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
  const [documents, setDocuments] = useState<DocItem[]>([]);
  const [filteredDocs, setFilteredDocs] = useState<DocItem[]>([]);
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
      const filtered = documents.filter((doc) => {
        const searchLower = searchQuery.toLowerCase();
        return (
          doc.title.toLowerCase().includes(searchLower) ||
          doc.name.toLowerCase().includes(searchLower) ||
          doc.description.toLowerCase().includes(searchLower) ||
          doc.tags.some(tag => tag.toLowerCase().includes(searchLower)) ||
          doc.authors.some(author => author.toLowerCase().includes(searchLower))
        );
      });
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
                key={`${doc.name}-${doc.slug}`}
                className={`bg-zinc-900 border-zinc-800 hover:bg-zinc-800 transition-colors cursor-pointer ${doc.slug === currentSlug
                  ? "border-l-4 border-l-amber-500"
                  : ""
                  }`}
                onClick={() => handleDocumentClick(doc.slug)}
              >
                <CardContent className="p-3">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-start gap-2">
                      <FileText className="h-6 w-6 mt-1 text-gray-400" />
                      <div className="flex-1">
                        <h3 className="font-medium text-sm text-gray-200">
                          {doc.title.length > 40 ? doc.title.slice(0, 40) + "..." : doc.title}
                        </h3>
                        {doc.description && (
                          <div className="text-xs text-gray-500 mt-1">
                            {doc.description.length > 60 ? doc.description.slice(0, 60) + "..." : doc.description}
                          </div>
                        )}
                      </div>
                    </div>

                    {doc.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {doc.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-0.5 text-xs rounded-full bg-amber-500/10 text-amber-500"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      {doc.authors.length > 0 && (
                        <>
                          <span className="text-gray-400">By {doc.authors.join(", ")}</span>
                          <span>•</span>
                        </>
                      )}
                      <span>Generated on {new Date(doc.createdAt).toLocaleDateString('en-US', {
                        month: 'numeric',
                        day: 'numeric',
                        year: 'numeric'
                      })}</span>
                    </div>

                    {doc.children.length > 0 && (
                      <div className="mt-1 pl-3 border-l-2 border-zinc-800">
                        {doc.children.map((child) => (
                          <div
                            key={child.slug}
                            className="text-xs text-gray-400 hover:text-amber-500 cursor-pointer py-0.5"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDocumentClick(child.slug);
                            }}
                          >
                            {child.title}
                          </div>
                        ))}
                      </div>
                    )}
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
