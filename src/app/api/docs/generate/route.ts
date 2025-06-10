import { connectToCoreDB } from "@/utils/database";
import { generateDocs } from "@/utils/generateDocs";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 300;

const handler = async (req: NextRequest) => {
  try {
    console.log("Received request to generate docs");
    await connectToCoreDB();
    // Simple request debouncing using a delay. Just a quick debounce
    const debouncingThreshold = parseInt(
      process.env.DEBOUNCING_THRESHOLD || "2_500",
    );

    console.log("Set debouncing threshold (ms) to ", debouncingThreshold);
    await new Promise((resolve) => setTimeout(resolve, debouncingThreshold));
    const { query } = await req.json();

    console.log("Received query: ", query);
    if (!query.trim()) {
      return NextResponse.json(
        { success: false, message: "Query is required" },
        { status: 400 },
      );
    }

    console.log("Now making API call to generate docs with query: ", query);
    // Make API call to backend
    const response = await generateDocs(query);
    console.log("Received response from generateDocs: ", response);

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
