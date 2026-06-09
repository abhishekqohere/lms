import { NextResponse } from "next/server";
import type { ApiResponse } from "@/types";

export function successResponse<T>(
  data: T,
  status = 200,
  meta?: ApiResponse["meta"],
  message?: string
) {
  const body: ApiResponse<T> = { success: true, data };
  if (meta) body.meta = meta;
  if (message) body.message = message;
  return NextResponse.json(body, { status });
}

export function errorResponse(error: string, status = 400) {
  const body: ApiResponse = { success: false, error };
  return NextResponse.json(body, { status });
}
