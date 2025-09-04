import Doc from "@/models/doc";
import DocChat from "@/models/docChat";
import { z } from "zod";
import { connectToCoreDB } from "./database";
import { parseUntilJson } from "./parseUntilJson";

/** ---------------------------- Schemas ---------------------------- */
// export const LangChainJSONSchema = z.object({
//   lc: z.number().describe("LangChain-specific number field"),
//   type: z.string().describe("Type of the LangChain message"),
//   id: z.array(z.string()).describe("Array of IDs associated with the message"),
//   lc_kwargs: z
//     .object({
//       content: z.string().describe("Content of the message"),
//       additional_kwargs: z
//         .record(z.any())
//         .describe("Additional keyword arguments"),
//       response_metadata: z
//         .record(z.any())
//         .describe("Metadata related to the response"),
//       tool_calls: z
//         .array(z.any())
//         .optional()
//         .describe("Optional array of tool calls"),
//       invalid_tool_calls: z
//         .array(z.any())
//         .optional()
//         .describe("Optional array of invalid tool calls"),
//     })
//     .describe("Key arguments related to the LangChain message"),
// });

export const LangChainJSONSchema = z.object({
  role: z
    .enum(["system", "user", "assistant"])
    .describe("Type of the LangChain message"),
  content: z.string().describe("Content of the message"),
  json: z
    .record(z.string(), z.any())
    .optional()
    .describe("An optional JSON if needed"),
});

export const ChatRequestBodySchema = z.object({
  chat_history: z
    .array(LangChainJSONSchema)
    .describe("Array of chat history in LangChain JSON format"),
  persona: z.string().optional().describe("Optional persona for the chat"),
});

export const ChatRequestBodyWithIdSchema = ChatRequestBodySchema.extend({
  chatId: z.string().optional().nullable(),
  researchMode: z.boolean().optional(),
  stream: z.boolean().optional(),
  phone: z.string().optional(),
  username: z.string().optional(),
  source: z.string().optional(),
  title: z.string().optional(),
  scope: z.enum(["internal", "external"]).optional().default("internal"),
});

export type LangChainJSON = z.infer<typeof LangChainJSONSchema>;
export type ChatRequestBody = z.infer<typeof ChatRequestBodySchema>;
export type ChatRequestBodyWithId = z.infer<typeof ChatRequestBodyWithIdSchema>;

export const GenerationResultSchema = z.object({
  response: z.record(z.any()).and(
    z.object({
      content: z.string(),
      additional_kwargs: z.record(z.any()),
      response_metadata: z.record(z.any()),
    })
  ),
  json: z.object({
    searchResults: z.array(z.record(z.any())),
  }),
});

export const GenerationResponseSchema = z.object({
  result: GenerationResultSchema,
  chatId: z.string(),
  title: z.string(),
  researchMode: z.boolean(),
  stream: z.boolean(),
});

export const ParsedDataSchema = z.object({
  title: z.string(),
  result: z
    .object({
      content: z.string(),
    })
    .and(z.record(z.any())),
  slug: z.string(),
  timestamp: z.number(),
  chatId: z.string().optional().nullable(),
});

export type GenerationResult = z.infer<typeof GenerationResultSchema>;
export type GenerationResponse = z.infer<typeof GenerationResponseSchema>;
export type ParsedData = z.infer<typeof ParsedDataSchema>;

/** ---------------------------- Handlers ---------------------------- */
export function slugify(title: string): string {
  return title
    .toLowerCase() // Convert to lowercase
    .trim() // Remove whitespace from start and end
    .replace(/[^a-z0-9 -]/g, "") // Remove non-alphanumeric characters (except spaces and hyphens)
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-"); // Replace multiple hyphens with a single hyphen
}

export const generateDocs = async (
  query: string
): Promise<ParsedData | null> => {
  await connectToCoreDB();
  const parsedQuery = `You are a helpful JSON generator assistant. Please return me the JSON for the question I want to get an answer in the following format:

{
"title": string,
"content": string
}
Return to me information on the user query as a JSON, based on the reference data you will be given.

The user query is:
\`\`\`
How does Maya help me with researching on people to sell?
\`\`\`

For the reference data, you can use context. Be as elaborate as possible. Assume the user has no working knowledge about GenAI, LLMs or the Alchemyst Platform. Introduce yourself as Maya. Do not call the user's name. If you have multiple "content" fields, combine them into one.
`;
  const requestBody = {
    chat_history: [
      {
        content: parsedQuery,
        role: "user",
      },
    ],
    researchMode: false,
    stream: false,
    source: "integrations.zendocs",
    scope: "internal",
  } satisfies ChatRequestBodyWithId;

  const response = await fetch(
    `${process.env.BACKEND_BASE_URL}/api/v1/chat/generate`,
    {
      method: "POST",
      body: JSON.stringify(requestBody),
      headers: {
        Authorization: `Bearer ${process.env.ALCHEMYST_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  console.log("Response status: ", response.status);
  if (!response.ok) {
    console.error(
      "Error in response while generating docs:",
      response.statusText
    );
    console.error("Response body: ", await response.text());
    return null;
  }

  if (response.ok) {
    const data = (await response.json()) as GenerationResponse;
    console.log("Received data = ");
    console.log(data.result.response.kwargs.content);

    let parsedData: ParsedData = {
      title: data.title,
      result: parseUntilJson(data.result.response.kwargs.content) as never,
      slug: slugify(data.title),
      timestamp: Date.now(),
    };

    if (!!parsedData.result.content) {
      // First check if the document already exists
      const existingDoc = await Doc.findOne({
        slug: slugify(parsedData.title),
      });

      if (existingDoc) {
        console.log("Document already exists, skipping creation.");
        return {
          title: existingDoc.title,
          result: {
            content: existingDoc.content,
            ...existingDoc.metadata,
          },
          slug: existingDoc.slug,
          timestamp: existingDoc.metadata.timestamp,
          chatId: null,
        };
      }

      console.log("Creating documentation entry...");
      // Create the document entry based on user's query
      const createdDoc = await Doc.create({
        content: parsedData.result.content,
        slug: slugify(parsedData.title),
        title: parsedData.title,
        name: slugify(parsedData.title), // system name from slug
        description: parsedData.result.content.split('\n')[0].replace('#', '').trim(), // Use first line as description
        authors: ['AI'], // Mark as AI-generated
        tags: [], // Empty tags by default
        metadata: {
          timestamp: parsedData.timestamp,
          isAIGenerated: true
        },
      });

      // Now create a corresponding doc entry
      const correspondingChat = await DocChat.create({
        docId: createdDoc._id,
        messages: [],
        title: createdDoc.title,
      });
    }

    return parsedData;
  } else {
    return null;
  }
};
