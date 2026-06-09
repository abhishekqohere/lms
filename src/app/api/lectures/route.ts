import dbConnect from "@/lib/db/mongodb";
import Lecture from "@/models/Lecture";
import Course from "@/models/Course";
import { auth } from "@/lib/auth/auth";
import { lectureSchema } from "@/lib/validations/course";
import { successResponse, errorResponse } from "@/lib/api/response";
import { handleApiError } from "@/lib/api/errors";
import { getValidationError } from "@/lib/utils/validation";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) return errorResponse("Unauthorized", 401);

    const body = await request.json();
    const parsed = lectureSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(getValidationError(parsed.error), 400);
    }

    await dbConnect();

    const course = await Course.findOne({
      _id: parsed.data.courseId,
      isDeleted: false,
    });
    if (!course) return errorResponse("Course not found", 404);

    if (
      course.instructor.toString() !== session.user.id &&
      session.user.role !== "admin"
    ) {
      return errorResponse("Forbidden", 403);
    }

    const count = await Lecture.countDocuments({
      sectionId: parsed.data.sectionId,
      isDeleted: false,
    });

    const lecture = await Lecture.create({
      ...parsed.data,
      order: parsed.data.order ?? count,
      duration: parsed.data.duration ?? 0,
      resources: parsed.data.resources ?? [],
    });

    return successResponse(lecture, 201, undefined, "Lecture created");
  } catch (error) {
    const { message, status } = handleApiError(error);
    return errorResponse(message, status);
  }
}
