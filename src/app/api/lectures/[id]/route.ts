import dbConnect from "@/lib/db/mongodb";
import Lecture from "@/models/Lecture";
import Course from "@/models/Course";
import { auth } from "@/lib/auth/auth";
import { lectureSchema } from "@/lib/validations/course";
import { successResponse, errorResponse } from "@/lib/api/response";
import { handleApiError } from "@/lib/api/errors";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) return errorResponse("Unauthorized", 401);

    const { id } = await params;
    const body = await request.json();
    const parsed = lectureSchema.partial().safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 400);
    }

    await dbConnect();
    const lecture = await Lecture.findOne({ _id: id, isDeleted: false });
    if (!lecture) return errorResponse("Lecture not found", 404);

    const course = await Course.findById(lecture.courseId);
    if (
      course?.instructor.toString() !== session.user.id &&
      session.user.role !== "admin"
    ) {
      return errorResponse("Forbidden", 403);
    }

    Object.assign(lecture, parsed.data);
    await lecture.save();

    return successResponse(lecture, 200, undefined, "Lecture updated");
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

    const lecture = await Lecture.findOne({ _id: id, isDeleted: false });
    if (!lecture) return errorResponse("Lecture not found", 404);

    const course = await Course.findById(lecture.courseId);
    if (
      course?.instructor.toString() !== session.user.id &&
      session.user.role !== "admin"
    ) {
      return errorResponse("Forbidden", 403);
    }

    lecture.isDeleted = true;
    lecture.deletedAt = new Date();
    await lecture.save();

    return successResponse(null, 200, undefined, "Lecture deleted");
  } catch (error) {
    const { message, status } = handleApiError(error);
    return errorResponse(message, status);
  }
}
