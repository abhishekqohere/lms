import mongoose, { Schema, type Document, type Model, Types } from "mongoose";

export interface ISection extends Document {
  courseId: Types.ObjectId;
  title: string;
  order: number;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SectionSchema = new Schema<ISection>(
  {
    courseId: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    order: { type: Number, required: true, default: 0 },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

SectionSchema.index({ courseId: 1, order: 1 });

const Section: Model<ISection> =
  mongoose.models.Section ||
  mongoose.model<ISection>("Section", SectionSchema);

export default Section;
