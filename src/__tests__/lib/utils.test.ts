import { generateSlug } from "@/lib/utils/slug";
import {
  getPaginationParams,
  buildPaginationMeta,
} from "@/lib/utils/pagination";
import { registerSchema, loginSchema } from "@/lib/validations/auth";
import { courseSchema, reviewSchema } from "@/lib/validations/course";
import { hasRole } from "@/lib/auth/rbac";

describe("generateSlug", () => {
  it("converts title to lowercase slug", () => {
    expect(generateSlug("Hello World")).toBe("hello-world");
  });

  it("removes special characters", () => {
    expect(generateSlug("React & Node.js 101!")).toBe("react-nodejs-101");
  });

  it("trims whitespace", () => {
    expect(generateSlug("  Test Course  ")).toBe("test-course");
  });
});

describe("pagination utilities", () => {
  it("parses pagination params with defaults", () => {
    const params = new URLSearchParams("");
    const result = getPaginationParams(params);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(12);
    expect(result.skip).toBe(0);
  });

  it("parses custom page and limit", () => {
    const params = new URLSearchParams("page=3&limit=20");
    const result = getPaginationParams(params);
    expect(result.page).toBe(3);
    expect(result.limit).toBe(20);
    expect(result.skip).toBe(40);
  });

  it("caps limit at 100", () => {
    const params = new URLSearchParams("limit=500");
    const result = getPaginationParams(params);
    expect(result.limit).toBe(100);
  });

  it("builds pagination meta", () => {
    const meta = buildPaginationMeta(50, 2, 12);
    expect(meta.total).toBe(50);
    expect(meta.totalPages).toBe(5);
    expect(meta.page).toBe(2);
  });
});

describe("auth validation", () => {
  it("validates registration input", () => {
    const result = registerSchema.safeParse({
      name: "John Doe",
      email: "john@example.com",
      password: "Password1",
      role: "student",
    });
    expect(result.success).toBe(true);
  });

  it("rejects weak password", () => {
    const result = registerSchema.safeParse({
      name: "John",
      email: "john@example.com",
      password: "weak",
      role: "student",
    });
    expect(result.success).toBe(false);
  });

  it("validates login input", () => {
    const result = loginSchema.safeParse({
      email: "john@example.com",
      password: "any",
    });
    expect(result.success).toBe(true);
  });
});

describe("course validation", () => {
  it("validates course creation", () => {
    const result = courseSchema.safeParse({
      title: "My Course",
      description: "A comprehensive course description here",
      category: "Development",
      price: 29.99,
      level: "beginner",
    });
    expect(result.success).toBe(true);
  });

  it("rejects negative price", () => {
    const result = courseSchema.safeParse({
      title: "My Course",
      description: "A comprehensive course description here",
      category: "Development",
      price: -10,
      level: "beginner",
    });
    expect(result.success).toBe(false);
  });

  it("validates review", () => {
    const result = reviewSchema.safeParse({
      courseId: "507f1f77bcf86cd799439011",
      rating: 5,
      comment: "Great course, highly recommended!",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid rating", () => {
    const result = reviewSchema.safeParse({
      courseId: "507f1f77bcf86cd799439011",
      rating: 6,
      comment: "Great course!",
    });
    expect(result.success).toBe(false);
  });
});

describe("RBAC", () => {
  it("checks user role", () => {
    const session = {
      user: { id: "1", role: "admin", name: "Admin", email: "a@b.com" },
      expires: "",
    };
    expect(hasRole(session, ["admin"])).toBe(true);
    expect(hasRole(session, ["student"])).toBe(false);
  });

  it("returns false for null session", () => {
    expect(hasRole(null, ["admin"])).toBe(false);
  });
});
