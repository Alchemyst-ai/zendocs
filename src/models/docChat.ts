/* ----------------- Imports --------------- */
import { InferSchemaType, model, Model, models, Schema } from "mongoose";

/* ----------------- Schema --------------- */
const messageSchema = new Schema(
  {
    id: { type: String, required: true },
    role: {
      type: String,
      required: true,
      enum: ["user", "assistant", "system"],
    },
    message: { type: String, required: true },
    json: { type: String, required: false, default: "" }, // Assuming json is a stringified JSON object
  },
  { timestamps: true }
); // Disable _id for subdocuments if not needed

const docChatSchema = new Schema(
  {
    messages: [messageSchema],
    docId: { type: Schema.Types.ObjectId, ref: "Doc", required: true },
    title: { type: String, required: true },
  },
  { timestamps: true }
);

/* ----------------- Model --------------- */
export type DocChatSchemaType = InferSchemaType<typeof docChatSchema>;
const DocChat: Model<DocChatSchemaType> =
  models.ChatHistory || model("ChatHistory", docChatSchema);

export default DocChat;
