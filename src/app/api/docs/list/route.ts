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

  const docs = Doc.find({})
    .select('name description title slug authors reviewers editors tags children createdAt updatedAt')
    .sort({ createdAt: -1 });
  
  const docsList = await docs.exec();
  
  // Process the documents to handle children
  const docsMap = new Map();
  docsList.forEach(doc => {
    docsMap.set(doc._id.toString(), doc.toObject());
  });

  const processedDocs = docsList.map(doc => {
    const docObj = docsMap.get(doc._id.toString());
    return {
      ...docObj,
      children: doc.children.map(childId => {
        const child = docsMap.get(childId);
        return child ? {
          title: child.title,
          slug: child.slug,
          name: child.name
        } : null;
      }).filter(child => child !== null)
    };
  });
  return NextResponse.json(
    { success: true, data: processedDocs },
    { status: 200 },
  );
};

export { handler as GET };
