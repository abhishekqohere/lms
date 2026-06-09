import dbConnect from "@/lib/db/mongodb";
import User from "@/models/User";
import Course from "@/models/Course";
import Enrollment from "@/models/Enrollment";
import Review from "@/models/Review";
import { auth } from "@/lib/auth/auth";
import { successResponse, errorResponse } from "@/lib/api/response";
import { handleApiError } from "@/lib/api/errors";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return errorResponse("Forbidden", 403);
    }

    await dbConnect();

    const [
      totalUsers,
      totalStudents,
      totalInstructors,
      pendingInstructors,
      totalCourses,
      publishedCourses,
      totalEnrollments,
      totalReviews,
    ] = await Promise.all([
      User.countDocuments({ isDeleted: false }),
      User.countDocuments({ role: "student", isDeleted: false }),
      User.countDocuments({ role: "instructor", isDeleted: false }),
      User.countDocuments({
        role: "instructor",
        isApproved: false,
        isDeleted: false,
      }),
      Course.countDocuments({ isDeleted: false }),
      Course.countDocuments({ isPublished: true, isDeleted: false }),
      Enrollment.countDocuments({ isDeleted: false }),
      Review.countDocuments({ isDeleted: false }),
    ]);

    const revenue = await Enrollment.aggregate([
      { $match: { isDeleted: false } },
      {
        $lookup: {
          from: "courses",
          localField: "courseId",
          foreignField: "_id",
          as: "course",
        },
      },
      { $unwind: "$course" },
      { $group: { _id: null, total: { $sum: "$course.price" } } },
    ]);

    return successResponse({
      users: {
        total: totalUsers,
        students: totalStudents,
        instructors: totalInstructors,
        pendingInstructors,
      },
      courses: { total: totalCourses, published: publishedCourses },
      enrollments: totalEnrollments,
      reviews: totalReviews,
      revenue: revenue[0]?.total ?? 0,
    });
  } catch (error) {
    const { message, status } = handleApiError(error);
    return errorResponse(message, status);
  }
}
