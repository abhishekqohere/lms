import mongoose, { Schema, type Document, type Model, Types } from "mongoose";

export interface IProgress extends Document {
  userId: Types.ObjectId;
  courseId: Types.ObjectId;
  completedLectures: Types.ObjectId[];
  lastWatchedLecture?: Types.ObjectId;
  lastWatchedPosition: number;
  completionPercentage: number;
  bookmarks: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const ProgressSchema = new Schema<IProgress>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    completedLectures: [{ type: Schema.Types.ObjectId, ref: "Lecture" }],
    lastWatchedLecture: { type: Schema.Types.ObjectId, ref: "Lecture" },
    lastWatchedPosition: { type: Number, default: 0 },
    completionPercentage: { type: Number, default: 0, min: 0, max: 100 },
    bookmarks: [{ type: Schema.Types.ObjectId, ref: "Lecture" }],
  },
  { timestamps: true }
);

ProgressSchema.index({ userId: 1, courseId: 1 }, { unique: true });

const Progress: Model<IProgress> =
  mongoose.models.Progress ||
  mongoose.model<IProgress>("Progress", ProgressSchema);

export default Progress;
