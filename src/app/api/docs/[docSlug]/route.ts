import Doc from "@/models/doc";
import { connectToCoreDB } from "@/utils/database";
import { NextRequest, NextResponse } from "next/server";

const handler = async (
  req: NextRequest,
  { params }: { params: { docSlug: string } }
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
      { status: 404 }
    );
  }

  return NextResponse.json(
    {
      success: true,
      data: requiredDoc,
    },
    { status: 200 }
  );
};

export { handler as GET };
