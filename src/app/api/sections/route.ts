import dbConnect from "@/lib/db/mongodb";
import Section from "@/models/Section";
import Course from "@/models/Course";
import { auth } from "@/lib/auth/auth";
import { sectionSchema } from "@/lib/validations/course";
import { successResponse, errorResponse } from "@/lib/api/response";
import { handleApiError } from "@/lib/api/errors";
import { getValidationError } from "@/lib/utils/validation";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) return errorResponse("Unauthorized", 401);

    const body = await request.json();
    const parsed = sectionSchema.safeParse(body);
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

    const count = await Section.countDocuments({
      courseId: parsed.data.courseId,
      isDeleted: false,
    });

    const section = await Section.create({
      ...parsed.data,
      order: parsed.data.order ?? count,
    });

    return successResponse(section, 201, undefined, "Section created");
  } catch (error) {
    const { message, status } = handleApiError(error);
    return errorResponse(message, status);
  }
}
