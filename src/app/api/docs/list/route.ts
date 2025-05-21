import Doc from "@/models/doc";
import { connectToCoreDB } from "@/utils/database";
import { NextRequest, NextResponse } from "next/server";

const handler = async (req: NextRequest) => {
  // Connect to the database
  await connectToCoreDB();

  if (req.method !== "GET") {
    return NextResponse.json(
      { success: false, message: "Method Not Allowed" },
      { status: 405 },
    );
  }

  const docs = Doc.find({}).sort({ createdAt: -1 });
  const docsList = await docs.exec();
  const docsListWithoutChatId = docsList.map((doc) => ({
    ...doc.toObject(),
    chatId: undefined,
  }));
  return NextResponse.json(
    { success: true, data: docsListWithoutChatId },
    { status: 200 },
  );
};

export { handler as GET };
