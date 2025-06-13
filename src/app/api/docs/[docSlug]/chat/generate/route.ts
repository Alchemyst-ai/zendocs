import Doc from "@/models/doc";
import DocChat from "@/models/docChat";
import { connectToCoreDB } from "@/utils/database";
import { findRelevantDocChat } from "@/utils/docAndChatUtils";
import { fetchContext, LangChainJSON } from "@/utils/generateDocs";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const maxDuration = 300;

const schema = z.object({
  content: z.string().min(1, "Content is required"),
  chatId: z.string().optional(),
});

const handler = async (
  req: NextRequest,
  { params }: { params: { docSlug: string } }
) => {
  await connectToCoreDB();
  if (req.method !== "POST") {
    return NextResponse.json(
      {
        message: "Method Not Allowed",
      },
      {
        status: 405,
      }
    );
  }

  const docSlug = params.docSlug;

  const body = await req.json();
  const { success, error, data } = schema.safeParse(body);

  if (!success) {
    return NextResponse.json(
      { success: false, message: error.format() },
      { status: 400 }
    );
  }

  if (!docSlug) {
    return NextResponse.json(
      { error: "No document slug given by user." },
      { status: 400 }
    );
  }
  const requiredDoc = await Doc.findOne({ slug: docSlug });
  if (!requiredDoc) {
    return NextResponse.json(
      { error: "No such document slug found." },
      { status: 404 }
    );
  }

  const relevantContext = await fetchContext(data.content);
  const augmentedQuery = `
  The doc content is:
  \`\`\`
  ${requiredDoc.content}
  \`\`\`

  The relevant context from the knowledge base is:
  \`\`\`
  ${relevantContext}
  \`\`\`

  User query:
  \`\`\`
  ${data.content}
  \`\`\`

  Answer the user query by grounding your answer on the doc content and the knowledge base.
  `;

  const concernedDoc = await Doc.findOne({ slug: docSlug });

  if (!concernedDoc) {
    return NextResponse.json({}, { status: 404 });
  }

  let concernedChat = await findRelevantDocChat(concernedDoc._id);

  if (!concernedChat) {
    console.log("Couldn't find the relevant Doc Chat, creating new chat...");

    concernedChat = await DocChat.create({
      docId: concernedDoc._id,
      messages: [],
      title: concernedDoc.title,
    });

    // return NextResponse.json({ error: "Cannot find chat corresponding to the document." }, { status: 500 });
  }

  const apiCompatibleMessages: LangChainJSON[] = (
    concernedChat.messages ?? []
  ).map((msg) => ({ role: msg.role, content: msg.message }));
  const newChatMessage = await fetch(
    process.env.BACKEND_BASE_URL + "/api/v1/chat/generate",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.ALCHEMYST_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_history: [
          ...apiCompatibleMessages,
          { role: "user", content: augmentedQuery } satisfies LangChainJSON,
        ],
        chatId: concernedChat._id.toString(),
        researchMode: false,
        stream: false,
        source: "integrations.zendocs",
        scope: "internal",
        title: concernedDoc.title,
      }),
    }
  );

  if (!newChatMessage.ok) {
    return NextResponse.json(
      { error: "Failed to generate new chat message." },
      { status: 500 }
    );
  }

  const chatMessageResponse = await newChatMessage.json();

  console.log("Received data = ");
  console.log(chatMessageResponse.result.response.kwargs.content);

  const { content } = chatMessageResponse.result.response.kwargs;

  return NextResponse.json(
    {
      message: content,
      role: "assistant",
      timestamp: Date.now(),
      id: crypto.randomUUID(),
      chatId: concernedChat._id.toString(),
    },
    { status: 201 }
  );
};

export { handler as POST };
