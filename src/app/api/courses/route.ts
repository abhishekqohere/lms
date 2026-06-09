import dbConnect from "@/lib/db/mongodb";
import Course from "@/models/Course";
import { auth } from "@/lib/auth/auth";
import { courseSchema } from "@/lib/validations/course";
import { successResponse, errorResponse } from "@/lib/api/response";
import { handleApiError } from "@/lib/api/errors";
import { generateSlug } from "@/lib/utils/slug";
import {
  getPaginationParams,
  buildPaginationMeta,
} from "@/lib/utils/pagination";
import { createNotification } from "@/lib/services/notification.service";
import User from "@/models/User";
import { getValidationError } from "@/lib/utils/validation";

export async function GET(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = getPaginationParams(searchParams);

    const filter: Record<string, unknown> = { isDeleted: false };

    const search = searchParams.get("search");
    const category = searchParams.get("category");
    const level = searchParams.get("level");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const sortBy = searchParams.get("sortBy") || "newest";
    const instructorOnly = searchParams.get("instructorOnly");

    const session = await auth();

    if (instructorOnly === "true" && session?.user) {
      filter.instructor = session.user.id;
    } else {
      filter.isPublished = true;
    }

    if (search) {
      filter.$text = { $search: search };
    }
    if (category) filter.category = category;
    if (level) filter.level = level;
    if (minPrice) filter.price = { ...((filter.price as object) || {}), $gte: Number(minPrice) };
    if (maxPrice) {
      filter.price = { ...((filter.price as object) || {}), $lte: Number(maxPrice) };
    }

    let sort: Record<string, 1 | -1> = { createdAt: -1 };
    switch (sortBy) {
      case "rating":
        sort = { rating: -1 };
        break;
      case "popularity":
        sort = { enrollmentCount: -1 };
        break;
      case "price_asc":
        sort = { price: 1 };
        break;
      case "price_desc":
        sort = { price: -1 };
        break;
    }

    const [courses, total] = await Promise.all([
      Course.find(filter)
        .populate("instructor", "name avatar")
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Course.countDocuments(filter),
    ]);

    return successResponse(courses, 200, buildPaginationMeta(total, page, limit));
  } catch (error) {
    const { message, status } = handleApiError(error);
    return errorResponse(message, status);
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) return errorResponse("Unauthorized", 401);
    if (session.user.role !== "instructor" && session.user.role !== "admin") {
      return errorResponse("Forbidden", 403);
    }

    const body = await request.json();
    const parsed = courseSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(getValidationError(parsed.error), 400);
    }

    await dbConnect();

    let slug = generateSlug(parsed.data.title);
    const existing = await Course.findOne({ slug });
    if (existing) slug = `${slug}-${Date.now()}`;

    const course = await Course.create({
      ...parsed.data,
      slug,
      instructor: session.user.id,
    });

    if (parsed.data.isPublished) {
      const students = await User.find({ role: "student", isDeleted: false });
      await Promise.all(
        students.slice(0, 50).map((student) =>
          createNotification(
            student._id,
            "course_published",
            "New Course Available",
            `"${course.title}" has been published`,
            { courseId: course._id }
          )
        )
      );
    }

    return successResponse(course, 201, undefined, "Course created");
  } catch (error) {
    const { message, status } = handleApiError(error);
    return errorResponse(message, status);
  }
}
