import {
  Document,
  InferSchemaType,
  Model,
  Schema,
  model,
  models,
} from "mongoose";

// Interface for metadata
interface IMetadata {
  [key: string]: any;
}

// Interface for the document
export interface IDoc extends Document {
  content: string;
  title: string;
  metadata: IMetadata;
  createdAt: Date;
  updatedAt: Date;
}

// Schema definition
const docSchema = new Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    content: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

docSchema.index({ content: "text", title: "text" });
// Export the model and its type
export type DocType = InferSchemaType<typeof docSchema>;
const Doc: Model<DocType> = models.Doc || model<IDoc>("Doc", docSchema);

export default Doc;
