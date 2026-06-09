import dbConnect from "@/lib/db/mongodb";
import User from "@/models/User";
import { auth } from "@/lib/auth/auth";
import { successResponse, errorResponse } from "@/lib/api/response";
import { handleApiError } from "@/lib/api/errors";
import {
  getPaginationParams,
  buildPaginationMeta,
} from "@/lib/utils/pagination";
import { z } from "zod";
import { getValidationError } from "@/lib/utils/validation";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return errorResponse("Forbidden", 403);
    }

    await dbConnect();
    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = getPaginationParams(searchParams, 20);
    const role = searchParams.get("role");

    const filter: Record<string, unknown> = { isDeleted: false };
    if (role) filter.role = role;

    const [users, total] = await Promise.all([
      User.find(filter)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    return successResponse(users, 200, buildPaginationMeta(total, page, limit));
  } catch (error) {
    const { message, status } = handleApiError(error);
    return errorResponse(message, status);
  }
}

const updateUserSchema = z.object({
  userId: z.string(),
  isApproved: z.boolean().optional(),
  role: z.enum(["admin", "instructor", "student"]).optional(),
});

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return errorResponse("Forbidden", 403);
    }

    const body = await request.json();
    const parsed = updateUserSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(getValidationError(parsed.error), 400);
    }

    await dbConnect();

    const user = await User.findOne({
      _id: parsed.data.userId,
      isDeleted: false,
    });
    if (!user) return errorResponse("User not found", 404);

    if (parsed.data.isApproved !== undefined) {
      user.isApproved = parsed.data.isApproved;
    }
    if (parsed.data.role) {
      user.role = parsed.data.role;
    }
    await user.save();

    return successResponse(
      { id: user._id, role: user.role, isApproved: user.isApproved },
      200,
      undefined,
      "User updated"
    );
  } catch (error) {
    const { message, status } = handleApiError(error);
    return errorResponse(message, status);
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return errorResponse("Forbidden", 403);
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    if (!userId) return errorResponse("userId required", 400);

    await dbConnect();

    const user = await User.findOne({ _id: userId, isDeleted: false });
    if (!user) return errorResponse("User not found", 404);

    user.isDeleted = true;
    user.deletedAt = new Date();
    await user.save();

    return successResponse(null, 200, undefined, "User deleted");
  } catch (error) {
    const { message, status } = handleApiError(error);
    return errorResponse(message, status);
  }
}
