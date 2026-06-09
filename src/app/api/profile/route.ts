import dbConnect from "@/lib/db/mongodb";
import User from "@/models/User";
import Enrollment from "@/models/Enrollment";
import Course from "@/models/Course";
import { auth } from "@/lib/auth/auth";
import { updateProfileSchema } from "@/lib/validations/auth";
import { successResponse, errorResponse } from "@/lib/api/response";
import { handleApiError } from "@/lib/api/errors";
import { getValidationError } from "@/lib/utils/validation";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return errorResponse("Unauthorized", 401);

    await dbConnect();

    const user = await User.findOne({
      _id: session.user.id,
      isDeleted: false,
    }).select("-password");

    if (!user) return errorResponse("User not found", 404);

    const enrollments = await Enrollment.countDocuments({
      userId: session.user.id,
      isDeleted: false,
    });

    let instructorStats = null;
    if (user.role === "instructor" || user.role === "admin") {
      const courses = await Course.find({
        instructor: session.user.id,
        isDeleted: false,
      }).lean();

      const revenue = courses.reduce(
        (sum, c) => sum + c.price * c.enrollmentCount,
        0
      );

      instructorStats = {
        courseCount: courses.length,
        totalStudents: courses.reduce((sum, c) => sum + c.enrollmentCount, 0),
        revenue,
      };
    }

    return successResponse({ user, enrollments, instructorStats });
  } catch (error) {
    const { message, status } = handleApiError(error);
    return errorResponse(message, status);
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) return errorResponse("Unauthorized", 401);

    const body = await request.json();
    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(getValidationError(parsed.error), 400);
    }

    await dbConnect();

    const user = await User.findOne({
      _id: session.user.id,
      isDeleted: false,
    });
    if (!user) return errorResponse("User not found", 404);

    Object.assign(user, parsed.data);
    await user.save();

    return successResponse(
      {
        id: user._id,
        name: user.name,
        email: user.email,
        bio: user.bio,
        avatar: user.avatar,
        role: user.role,
      },
      200,
      undefined,
      "Profile updated"
    );
  } catch (error) {
    const { message, status } = handleApiError(error);
    return errorResponse(message, status);
  }
}
