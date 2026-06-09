jest.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      json: async () => body,
      status: init?.status ?? 200,
    }),
  },
}));

import { getValidationError } from "@/lib/utils/validation";
import { cn } from "@/lib/utils/cn";
import { successResponse, errorResponse } from "@/lib/api/response";
import { AppError, handleApiError } from "@/lib/api/errors";
import { hasRole, requireAuth, requireRole } from "@/lib/auth/rbac";
import { z } from "zod";

describe("getValidationError", () => {
  it("returns first issue message", () => {
    const result = z.string().min(5).safeParse("hi");
    if (!result.success) {
      expect(getValidationError(result.error)).toBeTruthy();
    }
  });

  it("returns fallback for empty issues", () => {
    const error = new z.ZodError([]);
    expect(getValidationError(error)).toBe("Validation error");
  });
});

describe("cn utility", () => {
  it("merges class names", () => {
    expect(cn("px-2", "py-1")).toBe("px-2 py-1");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible");
  });
});

describe("API response helpers", () => {
  it("creates success response", async () => {
    const res = successResponse({ id: 1 }, 201, undefined, "Created");
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toEqual({ id: 1 });
    expect(body.message).toBe("Created");
    expect(res.status).toBe(201);
  });

  it("creates success response with meta", async () => {
    const meta = { page: 1, limit: 10, total: 50, totalPages: 5 };
    const res = successResponse([], 200, meta);
    const body = await res.json();
    expect(body.meta).toEqual(meta);
  });

  it("creates error response", async () => {
    const res = errorResponse("Not found", 404);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe("Not found");
    expect(res.status).toBe(404);
  });
});

describe("API error handling", () => {
  it("handles AppError", () => {
    const result = handleApiError(new AppError("Bad request", 400));
    expect(result.message).toBe("Bad request");
    expect(result.status).toBe(400);
  });

  it("handles unknown errors", () => {
    const result = handleApiError(new Error("Unexpected"));
    expect(result.message).toBe("Internal server error");
    expect(result.status).toBe(500);
  });
});

describe("RBAC extended", () => {
  const session = {
    user: { id: "1", role: "instructor", name: "Jane", email: "j@e.com" },
    expires: "",
  };

  it("requireAuth passes with valid session", () => {
    expect(() => requireAuth(session)).not.toThrow();
  });

  it("requireAuth throws without session", () => {
    expect(() => requireAuth(null)).toThrow("Unauthorized");
  });

  it("requireRole passes for allowed role", () => {
    expect(() => requireRole(session, ["instructor", "admin"])).not.toThrow();
  });

  it("requireRole throws for disallowed role", () => {
    expect(() => requireRole(session, ["admin"])).toThrow("Forbidden");
  });
});

describe("course validation edge cases", () => {
  it("validates section schema fields", () => {
    const { sectionSchema } = require("@/lib/validations/course");
    const result = sectionSchema.safeParse({ courseId: "abc", title: "Intro" });
    expect(result.success).toBe(true);
  });

  it("validates lecture schema fields", () => {
    const { lectureSchema } = require("@/lib/validations/course");
    const result = lectureSchema.safeParse({
      sectionId: "abc",
      courseId: "def",
      title: "Lesson 1",
      videoUrl: "https://example.com/video.mp4",
    });
    expect(result.success).toBe(true);
  });

  it("validates progress update schema", () => {
    const { progressUpdateSchema } = require("@/lib/validations/course");
    const result = progressUpdateSchema.safeParse({
      courseId: "abc",
      lectureId: "def",
      completed: true,
    });
    expect(result.success).toBe(true);
  });

  it("validates bookmark schema", () => {
    const { bookmarkSchema } = require("@/lib/validations/course");
    const result = bookmarkSchema.safeParse({
      courseId: "abc",
      lectureId: "def",
      action: "add",
    });
    expect(result.success).toBe(true);
  });
});

describe("auth validation edge cases", () => {
  it("validates forgot password email", () => {
    const { forgotPasswordSchema } = require("@/lib/validations/auth");
    expect(forgotPasswordSchema.safeParse({ email: "test@example.com" }).success).toBe(true);
  });

  it("validates reset password", () => {
    const { resetPasswordSchema } = require("@/lib/validations/auth");
    const result = resetPasswordSchema.safeParse({
      token: "abc123",
      password: "Password1",
    });
    expect(result.success).toBe(true);
  });

  it("validates profile update", () => {
    const { updateProfileSchema } = require("@/lib/validations/auth");
    const result = updateProfileSchema.safeParse({ name: "Updated Name" });
    expect(result.success).toBe(true);
  });
});
