import dbConnect from "@/lib/db/mongodb";
import Course from "@/models/Course";
import Enrollment from "@/models/Enrollment";
import { auth } from "@/lib/auth/auth";
import { successResponse, errorResponse } from "@/lib/api/response";
import { handleApiError } from "@/lib/api/errors";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return errorResponse("Forbidden", 403);
    }

    await dbConnect();
    const { searchParams } = new URL(request.url);
    const abusiveOnly = searchParams.get("abusive") === "true";

    const filter: Record<string, unknown> = { isDeleted: false };
    if (abusiveOnly) {
      filter.rating = { $lt: 2 };
      filter.reviewCount = { $gte: 3 };
    }

    const courses = await Course.find(filter)
      .populate("instructor", "name email")
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return successResponse(courses);
  } catch (error) {
    const { message, status } = handleApiError(error);
    return errorResponse(message, status);
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return errorResponse("Forbidden", 403);
    }

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("courseId");
    if (!courseId) return errorResponse("courseId required", 400);

    await dbConnect();

    const course = await Course.findOne({ _id: courseId, isDeleted: false });
    if (!course) return errorResponse("Course not found", 404);

    course.isDeleted = true;
    course.deletedAt = new Date();
    course.isPublished = false;
    await course.save();

    return successResponse(null, 200, undefined, "Course removed");
  } catch (error) {
    const { message, status } = handleApiError(error);
    return errorResponse(message, status);
  }
}
