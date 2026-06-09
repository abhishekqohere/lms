import bcrypt from "bcryptjs";
import dbConnect from "@/lib/db/mongodb";
import User from "@/models/User";
import { registerSchema } from "@/lib/validations/auth";
import { successResponse, errorResponse } from "@/lib/api/response";
import { handleApiError } from "@/lib/api/errors";
import { getValidationError } from "@/lib/utils/validation";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(getValidationError(parsed.error), 400);
    }

    await dbConnect();

    const existing = await User.findOne({ email: parsed.data.email });
    if (existing) {
      return errorResponse("Email already registered", 409);
    }

    const hashedPassword = await bcrypt.hash(parsed.data.password, 12);
    const isApproved = parsed.data.role === "student";

    const user = await User.create({
      name: parsed.data.name,
      email: parsed.data.email,
      password: hashedPassword,
      role: parsed.data.role,
      isApproved,
    });

    return successResponse(
      {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved,
      },
      201,
      undefined,
      "Registration successful"
    );
  } catch (error) {
    const { message, status } = handleApiError(error);
    return errorResponse(message, status);
  }
}
