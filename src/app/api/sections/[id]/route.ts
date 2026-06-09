import dbConnect from "@/lib/db/mongodb";
import Section from "@/models/Section";
import Course from "@/models/Course";
import { auth } from "@/lib/auth/auth";
import { successResponse, errorResponse } from "@/lib/api/response";
import { handleApiError } from "@/lib/api/errors";
import { z } from "zod";

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  order: z.number().int().min(0).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) return errorResponse("Unauthorized", 401);

    const { id } = await params;
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 400);
    }

    await dbConnect();
    const section = await Section.findOne({ _id: id, isDeleted: false });
    if (!section) return errorResponse("Section not found", 404);

    const course = await Course.findById(section.courseId);
    if (
      course?.instructor.toString() !== session.user.id &&
      session.user.role !== "admin"
    ) {
      return errorResponse("Forbidden", 403);
    }

    Object.assign(section, parsed.data);
    await section.save();

    return successResponse(section, 200, undefined, "Section updated");
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

    const section = await Section.findOne({ _id: id, isDeleted: false });
    if (!section) return errorResponse("Section not found", 404);

    const course = await Course.findById(section.courseId);
    if (
      course?.instructor.toString() !== session.user.id &&
      session.user.role !== "admin"
    ) {
      return errorResponse("Forbidden", 403);
    }

    section.isDeleted = true;
    section.deletedAt = new Date();
    await section.save();

    return successResponse(null, 200, undefined, "Section deleted");
  } catch (error) {
    const { message, status } = handleApiError(error);
    return errorResponse(message, status);
  }
}
