import dbConnect from "@/lib/db/mongodb";
import Course from "@/models/Course";
import Enrollment from "@/models/Enrollment";
import { auth } from "@/lib/auth/auth";
import { successResponse, errorResponse } from "@/lib/api/response";
import { handleApiError } from "@/lib/api/errors";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) return errorResponse("Unauthorized", 401);
    if (session.user.role !== "instructor" && session.user.role !== "admin") {
      return errorResponse("Forbidden", 403);
    }

    const { id } = await params;
    await dbConnect();

    const course = await Course.findOne({ _id: id, isDeleted: false });
    if (!course) return errorResponse("Course not found", 404);

    if (
      course.instructor.toString() !== session.user.id &&
      session.user.role !== "admin"
    ) {
      return errorResponse("Forbidden", 403);
    }

    const enrollments = await Enrollment.find({
      courseId: id,
      isDeleted: false,
    })
      .populate("userId", "name email avatar")
      .sort({ enrolledAt: -1 })
      .lean();

    const revenue = course.price * enrollments.length;

    return successResponse({
      course: {
        title: course.title,
        enrollmentCount: enrollments.length,
        rating: course.rating,
        reviewCount: course.reviewCount,
        price: course.price,
        revenue,
      },
      students: enrollments,
    });
  } catch (error) {
    const { message, status } = handleApiError(error);
    return errorResponse(message, status);
  }
}
