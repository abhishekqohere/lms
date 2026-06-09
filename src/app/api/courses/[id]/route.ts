import dbConnect from "@/lib/db/mongodb";
import Course from "@/models/Course";
import Section from "@/models/Section";
import Lecture from "@/models/Lecture";
import Enrollment from "@/models/Enrollment";
import { auth } from "@/lib/auth/auth";
import { courseSchema } from "@/lib/validations/course";
import { successResponse, errorResponse } from "@/lib/api/response";
import { handleApiError } from "@/lib/api/errors";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await dbConnect();

    const course = await Course.findOne({ _id: id, isDeleted: false })
      .populate("instructor", "name avatar bio")
      .lean();

    if (!course) return errorResponse("Course not found", 404);

    const sections = await Section.find({ courseId: id, isDeleted: false })
      .sort({ order: 1 })
      .lean();

    const lectures = await Lecture.find({ courseId: id, isDeleted: false })
      .sort({ order: 1 })
      .lean();

    const sectionsWithLectures = sections.map((section) => ({
      ...section,
      lectures: lectures.filter(
        (l) => l.sectionId.toString() === section._id.toString()
      ),
    }));

    return successResponse({ ...course, sections: sectionsWithLectures });
  } catch (error) {
    const { message, status } = handleApiError(error);
    return errorResponse(message, status);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) return errorResponse("Unauthorized", 401);

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

    const body = await request.json();
    const parsed = courseSchema.partial().safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 400);
    }

    Object.assign(course, parsed.data);
    await course.save();

    return successResponse(course, 200, undefined, "Course updated");
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

    const course = await Course.findOne({ _id: id, isDeleted: false });
    if (!course) return errorResponse("Course not found", 404);

    if (
      course.instructor.toString() !== session.user.id &&
      session.user.role !== "admin"
    ) {
      return errorResponse("Forbidden", 403);
    }

    course.isDeleted = true;
    course.deletedAt = new Date();
    course.isPublished = false;
    await course.save();

    return successResponse(null, 200, undefined, "Course deleted");
  } catch (error) {
    const { message, status } = handleApiError(error);
    return errorResponse(message, status);
  }
}
