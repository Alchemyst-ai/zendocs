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
  name: string;
  description: string;
  content: string;
  title: string;
  slug: string;
  authors: string[];
  reviewers: string[];
  editors: string[];
  tags: string[];
  children: string[]; // Store child document IDs as references
  createdAt: Date;
  updatedAt: Date;
  metadata: IMetadata;
}

// Schema definition
const docSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    authors: {
      type: [String],
      default: [],
    },
    reviewers: {
      type: [String],
      default: [],
    },
    editors: {
      type: [String],
      default: [],
    },
    tags: {
      type: [String],
      default: [],
    },
    children: {
      type: [String], // References to other document IDs
      default: [],
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true },
);

docSchema.index({ content: "text", title: "text" });
// Export the model and its type
export type DocType = InferSchemaType<typeof docSchema>;
const Doc: Model<DocType> = models.Doc || model<IDoc>("Doc", docSchema);

export default Doc;
