import mongoose, { Schema, type Document, type Model, Types } from "mongoose";
import type { CourseLevel } from "@/types";

export interface ICourse extends Document {
  title: string;
  slug: string;
  description: string;
  thumbnail?: string;
  category: string;
  price: number;
  level: CourseLevel;
  instructor: Types.ObjectId;
  isPublished: boolean;
  rating: number;
  reviewCount: number;
  enrollmentCount: number;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CourseSchema = new Schema<ICourse>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, required: true },
    thumbnail: { type: String },
    category: { type: String, required: true, index: true },
    price: { type: Number, required: true, min: 0, default: 0 },
    level: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    },
    instructor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    isPublished: { type: Boolean, default: false, index: true },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    enrollmentCount: { type: Number, default: 0 },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

CourseSchema.index({ title: "text", description: "text" });
CourseSchema.index({ category: 1, level: 1, price: 1, isPublished: 1 });

const Course: Model<ICourse> =
  mongoose.models.Course || mongoose.model<ICourse>("Course", CourseSchema);

export default Course;
