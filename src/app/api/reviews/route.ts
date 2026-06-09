import dbConnect from "@/lib/db/mongodb";
import Review from "@/models/Review";
import Course from "@/models/Course";
import Enrollment from "@/models/Enrollment";
import { auth } from "@/lib/auth/auth";
import { reviewSchema } from "@/lib/validations/course";
import { successResponse, errorResponse } from "@/lib/api/response";
import { handleApiError } from "@/lib/api/errors";
import { updateCourseRating } from "@/lib/services/course.service";
import { getValidationError } from "@/lib/utils/validation";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("courseId");
    if (!courseId) return errorResponse("courseId is required", 400);

    await dbConnect();

    const reviews = await Review.find({ courseId, isDeleted: false })
      .populate("userId", "name avatar")
      .sort({ createdAt: -1 })
      .lean();

    return successResponse(reviews);
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
    const parsed = reviewSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(getValidationError(parsed.error), 400);
    }

    await dbConnect();

    const enrollment = await Enrollment.findOne({
      userId: session.user.id,
      courseId: parsed.data.courseId,
      isDeleted: false,
    });
    if (!enrollment) {
      return errorResponse("Must be enrolled to review", 403);
    }

    const existing = await Review.findOne({
      userId: session.user.id,
      courseId: parsed.data.courseId,
      isDeleted: false,
    });
    if (existing) return errorResponse("Review already exists", 409);

    const review = await Review.create({
      userId: session.user.id,
      ...parsed.data,
    });

    await updateCourseRating(parsed.data.courseId);

    return successResponse(review, 201, undefined, "Review submitted");
  } catch (error) {
    const { message, status } = handleApiError(error);
    return errorResponse(message, status);
  }
}
