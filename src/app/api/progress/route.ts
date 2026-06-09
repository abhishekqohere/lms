import mongoose from "mongoose";
import dbConnect from "@/lib/db/mongodb";
import Progress from "@/models/Progress";
import Lecture from "@/models/Lecture";
import Enrollment from "@/models/Enrollment";
import { auth } from "@/lib/auth/auth";
import {
  progressUpdateSchema,
  bookmarkSchema,
} from "@/lib/validations/course";
import { successResponse, errorResponse } from "@/lib/api/response";
import { handleApiError } from "@/lib/api/errors";
import { createNotification } from "@/lib/services/notification.service";
import { calculateCompletionPercentage } from "@/lib/services/course.service";
import { getValidationError } from "@/lib/utils/validation";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) return errorResponse("Unauthorized", 401);

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("courseId");
    if (!courseId) return errorResponse("courseId is required", 400);

    await dbConnect();

    const progress = await Progress.findOne({
      userId: session.user.id,
      courseId,
    }).lean();

    return successResponse(progress ?? null);
  } catch (error) {
    const { message, status } = handleApiError(error);
    return errorResponse(message, status);
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) return errorResponse("Unauthorized", 401);

    const body = await request.json();

    if (body.type === "bookmark") {
      return handleBookmark(session.user.id, body);
    }

    return handleProgressUpdate(session.user.id, body);
  } catch (error) {
    const { message, status } = handleApiError(error);
    return errorResponse(message, status);
  }
}

async function handleProgressUpdate(userId: string, body: unknown) {
  const parsed = progressUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(getValidationError(parsed.error), 400);
  }

  await dbConnect();

  const enrollment = await Enrollment.findOne({
    userId,
    courseId: parsed.data.courseId,
    isDeleted: false,
  });
  if (!enrollment) return errorResponse("Not enrolled", 403);

  let progress = await Progress.findOne({
    userId,
    courseId: parsed.data.courseId,
  });

  if (!progress) {
    progress = await Progress.create({
      userId,
      courseId: parsed.data.courseId,
    });
  }

  const lectureObjectId = new mongoose.Types.ObjectId(parsed.data.lectureId);

  if (parsed.data.completed) {
    const alreadyCompleted = progress.completedLectures.some(
      (id) => id.toString() === parsed.data.lectureId
    );
    if (!alreadyCompleted) {
      progress.completedLectures.push(lectureObjectId);
    }
  }

  if (parsed.data.position !== undefined) {
    progress.lastWatchedLecture = lectureObjectId;
    progress.lastWatchedPosition = parsed.data.position;
  }

  const percentage = await calculateCompletionPercentage(
    userId,
    parsed.data.courseId
  );
  progress.completionPercentage = percentage;
  await progress.save();

  const milestones = [25, 50, 75, 100];
  if (milestones.includes(percentage)) {
    await createNotification(
      userId,
      "progress_milestone",
      "Progress Milestone",
      `You've reached ${percentage}% completion!`,
      { courseId: parsed.data.courseId, percentage }
    );
  }

  return successResponse(progress, 200, undefined, "Progress updated");
}

async function handleBookmark(userId: string, body: unknown) {
  const parsed = bookmarkSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(getValidationError(parsed.error), 400);
  }

  await dbConnect();

  const progress = await Progress.findOne({
    userId,
    courseId: parsed.data.courseId,
  });
  if (!progress) return errorResponse("Progress not found", 404);

  const lectureId = new mongoose.Types.ObjectId(parsed.data.lectureId);

  if (parsed.data.action === "add") {
    const exists = progress.bookmarks.some(
      (id) => id.toString() === parsed.data.lectureId
    );
    if (!exists) progress.bookmarks.push(lectureId);
  } else {
    progress.bookmarks = progress.bookmarks.filter(
      (id) => id.toString() !== parsed.data.lectureId
    );
  }

  await progress.save();
  return successResponse(progress, 200, undefined, "Bookmark updated");
}
