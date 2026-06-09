import dbConnect from "@/lib/db/mongodb";
import User from "@/models/User";
import { forgotPasswordSchema } from "@/lib/validations/auth";
import { successResponse, errorResponse } from "@/lib/api/response";
import { handleApiError } from "@/lib/api/errors";
import { generateResetToken } from "@/lib/services/notification.service";
import { getValidationError } from "@/lib/utils/validation";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(getValidationError(parsed.error), 400);
    }

    await dbConnect();

    const user = await User.findOne({
      email: parsed.data.email,
      isDeleted: false,
    });

    if (!user) {
      return successResponse(
        { message: "If the email exists, a reset link has been sent" },
        200
      );
    }

    const { token, hash, expires } = generateResetToken();
    user.resetPasswordToken = hash;
    user.resetPasswordExpires = expires;
    await user.save();

    // In production, send email with token
    return successResponse({
      message: "If the email exists, a reset link has been sent",
      ...(process.env.NODE_ENV === "development" && { resetToken: token }),
    });
  } catch (error) {
    const { message, status } = handleApiError(error);
    return errorResponse(message, status);
  }
}
