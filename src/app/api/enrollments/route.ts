import dbConnect from "@/lib/db/mongodb";
import Enrollment from "@/models/Enrollment";
import Course from "@/models/Course";
import Progress from "@/models/Progress";
import { auth } from "@/lib/auth/auth";
import { successResponse, errorResponse } from "@/lib/api/response";
import { handleApiError } from "@/lib/api/errors";
import { createNotification } from "@/lib/services/notification.service";
import { z } from "zod";
import { getValidationError } from "@/lib/utils/validation";

const enrollSchema = z.object({
  courseId: z.string().min(1),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return errorResponse("Unauthorized", 401);

    await dbConnect();

    const enrollments = await Enrollment.find({
      userId: session.user.id,
      isDeleted: false,
    })
      .populate({
        path: "courseId",
        populate: { path: "instructor", select: "name avatar" },
      })
      .sort({ enrolledAt: -1 })
      .lean();

    return successResponse(enrollments);
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
    const parsed = enrollSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(getValidationError(parsed.error), 400);
    }

    await dbConnect();

    const course = await Course.findOne({
      _id: parsed.data.courseId,
      isPublished: true,
      isDeleted: false,
    });
    if (!course) return errorResponse("Course not found", 404);

    const existing = await Enrollment.findOne({
      userId: session.user.id,
      courseId: parsed.data.courseId,
      isDeleted: false,
    });
    if (existing) return errorResponse("Already enrolled", 409);

    const enrollment = await Enrollment.create({
      userId: session.user.id,
      courseId: parsed.data.courseId,
    });

    await Progress.create({
      userId: session.user.id,
      courseId: parsed.data.courseId,
    });

    await Course.findByIdAndUpdate(parsed.data.courseId, {
      $inc: { enrollmentCount: 1 },
    });

    await createNotification(
      session.user.id,
      "enrollment",
      "Enrollment Confirmed",
      `You have enrolled in "${course.title}"`,
      { courseId: course._id }
    );

    return successResponse(enrollment, 201, undefined, "Enrolled successfully");
  } catch (error) {
    const { message, status } = handleApiError(error);
    return errorResponse(message, status);
  }
}
