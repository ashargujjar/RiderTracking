import { Schema, model, type InferSchemaType } from "mongoose";

const guideVideoSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    link: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

export type GuideVideoDocument = InferSchemaType<typeof guideVideoSchema>;
export const GuideVideo = model("GuideVideo", guideVideoSchema);
