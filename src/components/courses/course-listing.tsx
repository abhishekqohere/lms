"use client";

import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { CourseCard } from "@/components/courses/course-card";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen } from "lucide-react";

export function CourseListing() {
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();

  const { data, isLoading, error } = useQuery({
    queryKey: ["courses", queryString],
    queryFn: async () => {
      const res = await fetch(`/api/courses?${queryString}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json;
    },
  });

  if (isLoading) {
    return (
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-72 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-destructive">
        Failed to load courses. Please try again.
      </div>
    );
  }

  const courses = data?.data ?? [];

  if (courses.length === 0) {
    return (
      <div className="text-center py-16">
        <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No courses found</h3>
        <p className="text-muted-foreground">Try adjusting your filters</p>
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {courses.map((course: Parameters<typeof CourseCard>[0]["course"]) => (
        <CourseCard key={course._id} course={course} />
      ))}
    </div>
  );
}
