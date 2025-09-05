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

export const fetchOpenApiJson = async () => {
  const response = await fetch(
    "https://platform-dev.getalchemystai.com/api/openapi.json"
  );
  const data = await response.json();
  return data;
};

export const fetchContext = async (query: string) => {
  try {
    await connectToCoreDB();
    const requestBody = {
      query,
      similarity_threshold: 0.1,
      // minimum_similarity_threshold: 0.6,
      scope: "external",
      metadata: {},
    };

    const contextResponse = await fetch(
      `${process.env.BACKEND_BASE_URL}/api/v1/context/search`,
      {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: {
          Authorization: `Bearer ${process.env.ALCHEMYST_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!contextResponse.ok || contextResponse.redirected) {
      return [];
    }

    const response = await contextResponse.text();
    console.log("Received response = ", response);
    return JSON.parse(response);
  } catch (error) {
    console.log("Error caused while fetching context = ", error);
    return [];
  }
};

export const generateDocs = async (
  query: string
): Promise<ParsedData | null> => {
  await connectToCoreDB();

  let fetchedContext = await fetchContext(query);
  // TODO: A quick hack for now, should be removed later.

  if (Array.isArray(fetchedContext) && fetchedContext.length === 0) {
    fetchedContext = [await fetchOpenApiJson()];
  }
  // const fetchedContext = await fetchContext(query);

  const parsedQuery = `You are a technical documentation generator. Generate a JSON response in the following format:

{
"title": string,
"content": string
}

Instructions for generating the documentation:

1. Content Requirements:
   - Must be comprehensive technical documentation in markdown format
   - Must directly address the user query
   - Must only use information present in the provided context
   - Must not make up or infer information
   - Must set content to "Context not found" if relevant information is missing

2. Formatting Requirements:
   - Use proper markdown syntax
   - Include appropriate headers
   - Use code blocks where relevant
   - Include lists and other markdown elements
   - Combine multiple content sections into a single coherent document

3. Quality Requirements:
   - Focus on technical accuracy
   - Ensure completeness of information
   - Maintain clarity and readability
   - Structure information logically
   - Use paragraphs and newlines adequately
   - Elaborate and provide examples whenever possible, but do not make up information
   - You may use the context to derive or deduce more information

4. JSON Response Requirements:
   - All special characters in the content field must be properly escaped
   - Backticks (\`) should be escaped as \\\`
   - Triple backticks (\`\`\`) should be escaped as \\\`\\\`\\\`
   - Double quotes (") should be escaped as \\"
   - Newlines should be escaped as \\n
   - Any other special characters that could break JSON parsing should be escaped

The user query is:
\`\`\`
${query}
\`\`\`

The relevant context is:
\`\`\`
${JSON.stringify(fetchedContext)}
\`\`\`

There should be no other text or backticks before or after the JSON in the response.`;

  console.log("Parsed query = ");
  console.log(parsedQuery);

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

// TEST CASE

// const test = async () => {
//   const query = "Can you give me some examples of context APIs?";
//   const result = await generateDocs(query);
//   console.log(result);
// };

// test();
