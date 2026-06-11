import { NextResponse } from "next/server";
import {
  listSessionDebugSnapshot,
  putSession,
} from "@/lib/cache/session-cache";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const seed = searchParams.get("seed");

  if (seed === "true") {
    putSession("debug-session-1", "admin-user-1", "admin");
  }

  return NextResponse.json({
    success: true,
    data: {
      route: "/api/admin/debug/sessions",
      sessions: listSessionDebugSnapshot(),
    },
  });
}
