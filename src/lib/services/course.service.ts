import Review from "@/models/Review";
import Course from "@/models/Course";
import type { Types } from "mongoose";

export async function updateCourseRating(courseId: Types.ObjectId | string) {
  const stats = await Review.aggregate([
    {
      $match: {
        courseId:
          typeof courseId === "string"
            ? new (await import("mongoose")).default.Types.ObjectId(courseId)
            : courseId,
        isDeleted: false,
      },
    },
    {
      $group: {
        _id: "$courseId",
        avgRating: { $avg: "$rating" },
        count: { $sum: 1 },
      },
    },
  ]);

  if (stats.length === 0) {
    await Course.findByIdAndUpdate(courseId, { rating: 0, reviewCount: 0 });
    return;
  }

  await Course.findByIdAndUpdate(courseId, {
    rating: Math.round(stats[0].avgRating * 10) / 10,
    reviewCount: stats[0].count,
  });
}

export async function calculateCompletionPercentage(
  userId: string,
  courseId: string
): Promise<number> {
  const Lecture = (await import("@/models/Lecture")).default;
  const Progress = (await import("@/models/Progress")).default;

  const totalLectures = await Lecture.countDocuments({
    courseId,
    isDeleted: false,
  });

  if (totalLectures === 0) return 0;

  const progress = await Progress.findOne({ userId, courseId });
  const completed = progress?.completedLectures.length ?? 0;

  return Math.round((completed / totalLectures) * 100);
}
