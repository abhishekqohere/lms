import dbConnect from "@/lib/db/mongodb";
import Review from "@/models/Review";
import { auth } from "@/lib/auth/auth";
import { reviewSchema } from "@/lib/validations/course";
import { successResponse, errorResponse } from "@/lib/api/response";
import { handleApiError } from "@/lib/api/errors";
import { updateCourseRating } from "@/lib/services/course.service";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) return errorResponse("Unauthorized", 401);

    const { id } = await params;
    const body = await request.json();
    const parsed = reviewSchema.partial().safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 400);
    }

    await dbConnect();
    const review = await Review.findOne({ _id: id, isDeleted: false });
    if (!review) return errorResponse("Review not found", 404);

    if (review.userId.toString() !== session.user.id) {
      return errorResponse("Forbidden", 403);
    }

    Object.assign(review, parsed.data);
    await review.save();
    await updateCourseRating(review.courseId);

    return successResponse(review, 200, undefined, "Review updated");
  } catch (error) {
    const { message, status } = handleApiError(error);
    return errorResponse(message, status);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) return errorResponse("Unauthorized", 401);

    const { id } = await params;
    await dbConnect();

    const review = await Review.findOne({ _id: id, isDeleted: false });
    if (!review) return errorResponse("Review not found", 404);

    if (
      review.userId.toString() !== session.user.id &&
      session.user.role !== "admin"
    ) {
      return errorResponse("Forbidden", 403);
    }

    review.isDeleted = true;
    review.deletedAt = new Date();
    await review.save();
    await updateCourseRating(review.courseId);

    return successResponse(null, 200, undefined, "Review deleted");
  } catch (error) {
    const { message, status } = handleApiError(error);
    return errorResponse(message, status);
  }
}
