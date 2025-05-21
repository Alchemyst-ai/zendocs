import Doc from "@/models/doc";
import DocChat from "@/models/docChat";
import { connectToCoreDB } from "@/utils/database";
import { NextRequest, NextResponse } from "next/server";

const handler = async (
  req: NextRequest,
  { params }: { params: { docSlug: string } },
) => {
  await connectToCoreDB();
  const docSlug = params.docSlug;

  const requiredDoc = await Doc.findOne({ slug: docSlug });

  if (!requiredDoc) {
    console.log("\n\n\n\nDocument not found");
    return NextResponse.json(
      {
        success: false,
        error: "Document not found",
      },
      { status: 404 },
    );
  }

  const requiredDocChat = await DocChat.findOne({ docId: requiredDoc._id });
  return NextResponse.json(
    {
      success: true,
      data: requiredDocChat,
    },
    { status: 200 },
  );
};

export { handler as GET };
