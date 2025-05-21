import DocChat from "@/models/docChat";
import { Types } from "mongoose";
import { connectToCoreDB } from "./database";

export const findRelevantDocChat = async (docId: Types.ObjectId) => {
  await connectToCoreDB();
  return DocChat.findOne({ docId });
}