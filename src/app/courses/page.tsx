import { Suspense } from "react";
import { CourseListing } from "@/components/courses/course-listing";
import { CourseFilters } from "@/components/courses/course-filters";
import { Skeleton } from "@/components/ui/skeleton";

export default function CoursesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Explore Courses</h1>
      <Suspense fallback={<Skeleton className="h-32 w-full" />}>
        <CourseFilters />
      </Suspense>
      <div className="mt-8">
        <Suspense fallback={<CoursesSkeleton />}>
          <CourseListing />
        </Suspense>
      </div>
    </div>
  );
}

function CoursesSkeleton() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-72 w-full" />
      ))}
    </div>
  );
}
