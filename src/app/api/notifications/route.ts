import dbConnect from "@/lib/db/mongodb";
import Notification from "@/models/Notification";
import { auth } from "@/lib/auth/auth";
import { successResponse, errorResponse } from "@/lib/api/response";
import { handleApiError } from "@/lib/api/errors";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return errorResponse("Unauthorized", 401);

    await dbConnect();

    const notifications = await Notification.find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const unreadCount = await Notification.countDocuments({
      userId: session.user.id,
      isRead: false,
    });

    return successResponse({ notifications, unreadCount });
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
    const { notificationId, markAllRead } = body;

    await dbConnect();

    if (markAllRead) {
      await Notification.updateMany(
        { userId: session.user.id, isRead: false },
        { isRead: true }
      );
      return successResponse(null, 200, undefined, "All marked as read");
    }

    if (!notificationId) {
      return errorResponse("notificationId required", 400);
    }

    await Notification.findOneAndUpdate(
      { _id: notificationId, userId: session.user.id },
      { isRead: true }
    );

    return successResponse(null, 200, undefined, "Notification marked as read");
  } catch (error) {
    const { message, status } = handleApiError(error);
    return errorResponse(message, status);
  }
}
