import bcrypt from "bcryptjs";
import dbConnect from "@/lib/db/mongodb";
import User from "@/models/User";
import { resetPasswordSchema } from "@/lib/validations/auth";
import { successResponse, errorResponse } from "@/lib/api/response";
import { handleApiError } from "@/lib/api/errors";
import { hashToken } from "@/lib/services/notification.service";
import { getValidationError } from "@/lib/utils/validation";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(getValidationError(parsed.error), 400);
    }

    await dbConnect();

    const hashedToken = hashToken(parsed.data.token);
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
      isDeleted: false,
    }).select("+resetPasswordToken +resetPasswordExpires");

    if (!user) {
      return errorResponse("Invalid or expired reset token", 400);
    }

    user.password = await bcrypt.hash(parsed.data.password, 12);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return successResponse(null, 200, undefined, "Password reset successful");
  } catch (error) {
    const { message, status } = handleApiError(error);
    return errorResponse(message, status);
  }
}
