import Doc from "@/models/doc";
import { connectToCoreDB } from "@/utils/database";
import { NextRequest, NextResponse } from "next/server";
// Return an XML file showing all the docs. Docs are given with the route https://zendocs.getalchemystai.com/docs/[docSlug]

// Change return type for Next.js App Router
export const GET = async (req: NextRequest): Promise<NextResponse> => {
  await connectToCoreDB();
  const docs = await Doc.find({});
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${docs
        .map(
          (doc) => `
        <url>
          <loc>https://zendocs.getalchemystai.com/docs/${doc.slug}</loc>
          <lastmod>${doc.updatedAt.toISOString()}</lastmod>
        </url>
      `
        )
        .join("")}
    </urlset>`;

  // Use NextResponse for better type safety and headers handling
  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
};
