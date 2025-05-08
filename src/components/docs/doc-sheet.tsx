"use client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Download, ExternalLink } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/** --------------------------------------------- Props --------------------------------------------- */
interface DocSheetProps {
  isSheetOpen: boolean;
  setIsSheetOpen: (value: boolean) => void;
  generatedContentTitle: string;
  generatedContentTimestamp: number;
  generatedContentSlug: string;
  generatedContent: string;
  query: string;
}

/* --------------------------------------------- Utils --------------------------------------------- */
const downloadAsTxt = (
  generatedContent: string,
  generatedContentTitle: string
) => {
  // Convert HTML to plain text (basic conversion)
  const plainText = generatedContent
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]*>/g, "");

  // Create a blob with the text content
  const blob = new Blob([plainText], { type: "text/plain" });

  // Create a URL for the blob
  const url = URL.createObjectURL(blob);

  // Create a temporary anchor element
  const a = document.createElement("a");
  a.href = url;
  a.download = `${generatedContentTitle || "document"}.md`;

  // Append to the body, click, and remove
  document.body.appendChild(a);
  a.click();

  // Clean up
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const openInNewTab = (docSlug: string) => {
  // Create a new window/tab with the generated content
  window.open(`/docs/${docSlug}`, "_blank");
};

/** --------------------------------------------- Component --------------------------------------------- */
function DocSheet({
  isSheetOpen,
  setIsSheetOpen,
  generatedContent,
  generatedContentTimestamp,
  generatedContentTitle,
  generatedContentSlug,
  query,
}: DocSheetProps): React.ReactNode {
  return (
    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
      <SheetContent side="bottom" className="h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center">
          <SheetHeader className="text-left">
            <SheetTitle>{generatedContentTitle}</SheetTitle>
            <SheetDescription>
              Generated on {new Date(generatedContentTimestamp).toUTCString()},
              based on your query: {query}
            </SheetDescription>
          </SheetHeader>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => openInNewTab(generatedContentSlug)}
              className="h-8 w-8"
              title="Open in new tab"
            >
              <ExternalLink className="h-4 w-4" />
              <span className="sr-only">Open in new tab</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                downloadAsTxt(generatedContent, generatedContentTitle)
              }
              className="h-8 w-8"
              title="Download as text file"
            >
              <Download className="h-4 w-4" />
              <span className="sr-only">Download</span>
            </Button>
          </div>
        </div>
        <div className="mt-6 prose prose-sm dark:prose-invert max-w-none container mx-5">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {generatedContent}
          </ReactMarkdown>
        </div>
      </SheetContent>
      <SheetFooter>
        Generated on: {new Date(generatedContentTimestamp).toUTCString()}
      </SheetFooter>
    </Sheet>
  );
}

export default DocSheet;
