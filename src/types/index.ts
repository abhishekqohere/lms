export type UserRole = "admin" | "instructor" | "student";

export type CourseLevel = "beginner" | "intermediate" | "advanced";

export type NotificationType =
  | "enrollment"
  | "course_published"
  | "progress_milestone"
  | "review"
  | "system";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface CourseFilters {
  search?: string;
  category?: string;
  level?: CourseLevel;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: "rating" | "popularity" | "newest" | "price_asc" | "price_desc";
}
