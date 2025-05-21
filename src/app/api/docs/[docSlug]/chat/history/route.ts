import Doc from "@/models/doc";
import { connectToCoreDB } from "@/utils/database";
import { findRelevantDocChat } from "@/utils/docAndChatUtils";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  content: z.string().min(1, "Content is required"),
  chatId: z.string().optional(),
});

const handler = async (
  req: NextRequest,
  { params }: { params: { docSlug: string } },
) => {
  await connectToCoreDB();
  const docSlug = params.docSlug;

  if (!docSlug) {
    console.log("No docSlug");
    return NextResponse.json(
      { error: "No document slug given by user." },
      { status: 400 },
    );
  }
  const requiredDoc = await Doc.findOne({ slug: docSlug });
  if (!requiredDoc) {
    console.log("No requiredDoc found");
    return NextResponse.json(
      { error: "No such document slug found." },
      { status: 404 },
    );
  }

  const concernedChat = await findRelevantDocChat(requiredDoc._id);
  if (!concernedChat) {
    return NextResponse.json(
      {
        error:
          "CRIT-404: Critical - No such chat found in the backend for the user. Contact the admin team of this ZenDocs website!",
      },
      { status: 404 },
    );
  }

  const { id: concernedChatId, title: concernedChatTitle } = concernedChat;

  console.log("concernedChatId", concernedChatId);
  console.log("concernedChatTitle", concernedChatTitle);

  const chatHistoryMessages = concernedChat.messages.slice(2) ?? [];

  let modifiedChatHistoryMessages = chatHistoryMessages.map((message) => {
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
        ...concernedChat,
        messages: modifiedChatHistoryMessages,
      },
    },
    { status: 200 },
  );
};

export { handler as GET, handler as POST };
