import { z } from "zod";

export const courseSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  thumbnail: z.string().url().optional().or(z.literal("")),
  category: z.string().min(1, "Category is required"),
  price: z.number().min(0, "Price must be non-negative"),
  level: z.enum(["beginner", "intermediate", "advanced"]),
  isPublished: z.boolean().optional(),
});

export const sectionSchema = z.object({
  courseId: z.string().min(1),
  title: z.string().min(1, "Section title is required"),
  order: z.number().int().min(0).optional(),
});

export const lectureSchema = z.object({
  sectionId: z.string().min(1),
  courseId: z.string().min(1),
  title: z.string().min(1, "Lecture title is required"),
  description: z.string().optional(),
  videoUrl: z.string().url("Valid video URL is required"),
  duration: z.number().min(0).optional(),
  order: z.number().int().min(0).optional(),
  resources: z
    .array(
      z.object({
        title: z.string(),
        type: z.enum(["pdf", "link", "note"]),
        url: z.string().url(),
      })
    )
    .optional(),
});

export const reviewSchema = z.object({
  courseId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(10, "Review must be at least 10 characters").max(2000),
});

export const progressUpdateSchema = z.object({
  courseId: z.string().min(1),
  lectureId: z.string().min(1),
  position: z.number().min(0).optional(),
  completed: z.boolean().optional(),
});

export const bookmarkSchema = z.object({
  courseId: z.string().min(1),
  lectureId: z.string().min(1),
  action: z.enum(["add", "remove"]),
});

export type CourseInput = z.infer<typeof courseSchema>;
export type SectionInput = z.infer<typeof sectionSchema>;
export type LectureInput = z.infer<typeof lectureSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
