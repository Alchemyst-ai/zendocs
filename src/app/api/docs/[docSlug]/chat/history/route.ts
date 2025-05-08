import Doc from "@/models/doc";
import { connectToCoreDB } from "@/utils/database";
import { slugify } from "@/utils/generateDocs";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  content: z.string().min(1, "Content is required"),
  chatId: z.string().optional(),
});

const handler = async (
  req: NextRequest,
  { params }: { params: { docSlug: string } }
) => {
  await connectToCoreDB();
  const docSlug = params.docSlug;

  if (!docSlug) {
    console.log("No docSlug");
    return NextResponse.json(
      { error: "No document slug given by user." },
      { status: 400 }
    );
  }
  const requiredDoc = await Doc.findOne({ slug: docSlug });
  if (!requiredDoc) {
    console.log("No requiredDoc found");
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
    console.log(
      "Error in fetchChatsResponse",
      fetchChatsResponse.status,
      fetchChatsResponse.statusText
    );
    return NextResponse.json(
      { error: "Failed to fetch chat history." },
      { status: 500 }
    );
  }

  const {
    chats,
  }: { chats: { title: string; id: string; timestamp: number }[] } =
    await fetchChatsResponse.json();

  console.log("Count of found chats", chats.length);

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

  console.log("concernedChatId", concernedChatId);
  console.log("concernedChatTitle", concernedChatTitle);

  const concernedChatHistoryResponse = await fetch(
    process.env.BACKEND_BASE_URL + "/api/maya/recall",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.ALCHEMYST_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: concernedChatTitle,
        id: concernedChatId,
        source: "integrations.zendocs",
      }),
    }
  );

  if (!concernedChatHistoryResponse.ok) {
    console.log(
      "Error in concernedChatHistoryResponse",
      concernedChatHistoryResponse.status,
      concernedChatHistoryResponse.statusText
    );
    return NextResponse.json(
      { error: "Failed to fetch chat history 2." },
      { status: 500 }
    );
  }

  const chatHistory: {
    createdAt: NativeDate;
    updatedAt: NativeDate;
    title: string;
    scope: "internal" | "external";
    messages: {
      message: string;
      id: string;
      role: string;
      json: string;
      thinking_steps: Record<string, any>[];
    }[];
  } = await concernedChatHistoryResponse.json();

  let modifiedChatHistoryMessages = chatHistory.messages.slice(2) ?? [];

  modifiedChatHistoryMessages = modifiedChatHistoryMessages.map((message) => {
    const startPhrase = "User query:\n```";
    const messageStartIndex = message.message.indexOf("User query:");
    const modifiedMessageContent =
      messageStartIndex >= 0
        ? message.message.slice(messageStartIndex + startPhrase.length).trim()
        : message.message;
    return {
      ...message,
      message: modifiedMessageContent,
    };
  });

  return NextResponse.json(
    {
      chatHistory: {
        ...chatHistory,
        messages: modifiedChatHistoryMessages,
      },
    },
    { status: 200 }
  );
};

export { handler as GET, handler as POST };
