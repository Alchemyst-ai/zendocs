import { generateDocs } from "@/utils/generateDocs";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 300;

const handler = async (req: NextRequest) => {
  try {
    // Simple request debouncing using a delay. Just a quick debounce
    const debouncingThreshold = parseInt(
      process.env.DEBOUNCING_THRESHOLD || "2_500",
    );
    await new Promise((resolve) => setTimeout(resolve, debouncingThreshold));
    const { query } = await req.json();

    if (!query.trim()) {
      return NextResponse.json(
        { success: false, message: "Query is required" },
        { status: 400 },
      );
    }

    // Make API call to backend
    const response = await generateDocs(query);

    if (!response) {
      return NextResponse.json(
        { success: false, message: "API call failed" },
        { status: 404 },
      );
    }

    const responseWithoutChatId = { ...response, chatId: undefined };

    return NextResponse.json(
      { success: true, data: responseWithoutChatId },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json({}, { status: 500 });
  }
};

export { handler as POST };
