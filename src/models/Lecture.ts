import mongoose, { Schema, type Document, type Model, Types } from "mongoose";

export interface ILectureResource {
  title: string;
  type: "pdf" | "link" | "note";
  url: string;
}

export interface ILecture extends Document {
  sectionId: Types.ObjectId;
  courseId: Types.ObjectId;
  title: string;
  description?: string;
  videoUrl: string;
  duration: number;
  order: number;
  resources: ILectureResource[];
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const LectureResourceSchema = new Schema<ILectureResource>(
  {
    title: { type: String, required: true },
    type: { type: String, enum: ["pdf", "link", "note"], required: true },
    url: { type: String, required: true },
  },
  { _id: false }
);

const LectureSchema = new Schema<ILecture>(
  {
    sectionId: {
      type: Schema.Types.ObjectId,
      ref: "Section",
      required: true,
      index: true,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String },
    videoUrl: { type: String, required: true },
    duration: { type: Number, default: 0 },
    order: { type: Number, required: true, default: 0 },
    resources: { type: [LectureResourceSchema], default: [] },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

LectureSchema.index({ courseId: 1, sectionId: 1, order: 1 });

const Lecture: Model<ILecture> =
  mongoose.models.Lecture ||
  mongoose.model<ILecture>("Lecture", LectureSchema);

export default Lecture;
