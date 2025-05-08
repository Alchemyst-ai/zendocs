import Doc from "@/models/doc";
import { connectToCoreDB } from "@/utils/database";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const searchObjectSchema = z.object({
  query: z.string(),
  metadata: z
    .object({
      sort: z.union([z.literal(1), z.literal(-1)]),
    })
    .and(z.record(z.string(), z.any()))
    .optional(),
});

type SearchObject = z.infer<typeof searchObjectSchema>;

const handler = async (req: NextRequest) => {
  await connectToCoreDB();

  const reqJson = await req.json();

  const {
    data: requestData,
    error,
    success,
  } = searchObjectSchema.safeParse(reqJson);

  if (!requestData || !!error || !success) {
    return NextResponse.json({}, { status: 400 });
  }

  const userQuery = requestData.query;

  const searchResults = await Doc.find({
    $text: {
      $search: userQuery,
      $caseSensitive: false,
      $diacriticSensitive: false,
    },
    ...requestData.metadata,
  }).sort({
    score: { $meta: "textScore" },
    // createdAt: requestData?.metadata.sort,
  });

  const resultsWithoutId = searchResults.map((searchResult) => ({
    ...((searchResult as Record<string, any>)["_doc"] ?? {}),
    _id: undefined,
    _v: undefined,
  }));

  return NextResponse.json({ results: resultsWithoutId });
};

export { handler as POST };
