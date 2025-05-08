import Doc from "@/models/doc";
import { connectToCoreDB } from "@/utils/database";
import { slugify } from "@/utils/generateDocs";
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

  const fetchChatsResponse = await fetch(
    process.env.BACKEND_BASE_URL +
      "/api/chat/history?source=integrations.zendocs",
    { headers: { Authorization: `Bearer ${process.env.ALCHEMYST_API_KEY}` } }
  );

  if (!fetchChatsResponse.ok) {
    return NextResponse.json(
      { error: "Failed to fetch chat history." },
      { status: 500 }
    );
  }

  const {
    chats,
  }: { chats: { title: string; id: string; timestamp: number }[] } =
    await fetchChatsResponse.json();

  const concernedChat = chats.find((chat) => slugify(chat.title) === docSlug);

  if (!concernedChat) {
    return NextResponse.json(
      {
        error:
          "CRIT-404: Critical - No such chat found in the backend for the user. Contact the admin team of this ZenDocs website!",
      },
      { status: 404 }
    );
  }

  const { id: concernedChatId, title: concernedChatTitle } = concernedChat;

  const concernedChatHistoryResponse = await fetch(
    process.env.BACKEND_BASE_URL + "/api/chat/maya/recall",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.ALCHEMYST_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: concernedChatTitle,
        source: "integrations.zendocs",
      }),
    }
  );

  const augmenteQuery = `
  \`\`\`
  ${requiredDoc.content}
  \`\`\`

  User query:
  \`\`\`
  ${data.content}
  \`\`\`
  `;
  const newChatMessage = await fetch(
    process.env.BACKEND_BASE_URL + "/api/chat/generate",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.ALCHEMYST_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_history: [
          {
            lc: 0,
            type: "user",
            id: [concernedChatId],
            lc_kwargs: {
              content: augmenteQuery,
              additional_kwargs: {
                content: augmenteQuery,
              },
              response_metadata: {},
            },
          },
        ],
        chatId: concernedChatId,
        researchMode: false,
        stream: false,
        source: "integrations.zendocs",
        scope: "internal",
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
      chatId: concernedChatId,
    },
    { status: 201 }
  );
};

export { handler as POST };
