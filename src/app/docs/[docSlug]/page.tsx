import DocumentLayout from "@/components/docs/document-layout";
import { remarkDocx } from "@m2d/remark-docx";
import { Metadata } from "next";
import rehypeStringify from 'rehype-stringify';
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import type { VFile } from 'vfile';

interface DocResponse {
  title: string;
  slug: string;
  content: string;
  metadata: {
    timestamp: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const processMarkdownContentBeforeConversion = (content: string) => {
  let data = content;

  data = data.replace(/\\n/g, "\n\n");
  data = data.replace(/\n/g, "\n\n");
};


const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkFrontmatter)
  .use(remarkMath)
  .use(remarkDocx)
  .use(remarkRehype)
  .use(rehypeStringify, { allowDangerousHtml: true });

export async function generateMetadata({
  params,
}: {
  params: { docSlug: string };
}): Promise<Metadata> {
  const { success, data } = await getData(params.docSlug);
  return {
    title: data.title,
  };
}

async function getData(
  slug: string
): Promise<{ data: DocResponse; success: boolean }> {
  const res = await fetch(
    `${process.env.NEXT_APP_BACKEND_URL ?? "http://localhost:4163"}/api/docs/${slug}?t=${Date.now()}`,
    {
      method: "GET",
      cache: "no-store",
      // signal: new AbortController().abort(5_000),
    }
  );

  if (!res.ok) {
    throw new Error("Failed to fetch document");
  }

  let { data, success }: { data: DocResponse; success: boolean } =
    await res.json();

  console.log("Raw API response:", { data, success });
  data.content = ((await processor.process(data.content)) as VFile).toString();

  return { data, success };
}

export default async function DocPage({
  params,
}: {
  params: { docSlug: string };
}) {
  const { success, data: doc } = await getData(params.docSlug);
  console.log("Received doc data:", doc);
  const formattedDate = new Date(doc.metadata.timestamp).toLocaleDateString();

  return (
    <DocumentLayout
      title={doc.title}
      date={formattedDate}
      content={doc.content}
      docSlug={params.docSlug}
    />
  );
}
