import crypto from "crypto";
import Notification from "@/models/Notification";
import type { NotificationType } from "@/types";
import type { Types } from "mongoose";

export async function createNotification(
  userId: Types.ObjectId | string,
  type: NotificationType,
  title: string,
  message: string,
  metadata?: Record<string, unknown>
) {
  return Notification.create({
    userId,
    type,
    title,
    message,
    metadata,
  });
}

export function generateResetToken(): { token: string; hash: string; expires: Date } {
  const token = crypto.randomBytes(32).toString("hex");
  const hash = crypto.createHash("sha256").update(token).digest("hex");
  const expires = new Date(Date.now() + 3600000);
  return { token, hash, expires };
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
