"use client";

import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { Star, Users, Clock, Play, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { ReviewSection } from "@/components/courses/review-section";

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const courseId = params.id as string;

  const { data: course, isLoading } = useQuery({
    queryKey: ["course", courseId],
    queryFn: async () => {
      const res = await fetch(`/api/courses/${courseId}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
  });

  const { data: enrollmentData } = useQuery({
    queryKey: ["enrollments"],
    queryFn: async () => {
      const res = await fetch("/api/enrollments");
      const json = await res.json();
      return json.data ?? [];
    },
    enabled: !!session,
  });

  const { data: progressData } = useQuery({
    queryKey: ["progress", courseId],
    queryFn: async () => {
      const res = await fetch(`/api/progress?courseId=${courseId}`);
      const json = await res.json();
      return json.data;
    },
    enabled: !!session,
  });

  const isEnrolled = enrollmentData?.some(
    (e: { courseId: { _id: string } | string }) =>
      (typeof e.courseId === "object" ? e.courseId._id : e.courseId) === courseId
  );

  const enrollMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-64 w-full mb-8" />
        <Skeleton className="h-8 w-1/2 mb-4" />
        <Skeleton className="h-4 w-full" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold">Course not found</h2>
      </div>
    );
  }

  const totalLectures = course.sections?.reduce(
    (acc: number, s: { lectures: unknown[] }) => acc + (s.lectures?.length ?? 0),
    0
  ) ?? 0;

  const firstLecture = course.sections?.[0]?.lectures?.[0];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
            {course.thumbnail ? (
              <Image src={course.thumbnail} alt={course.title} fill className="object-cover" unoptimized />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                No thumbnail
              </div>
            )}
          </div>

          <div>
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge>{course.category}</Badge>
              <Badge variant="secondary" className="capitalize">{course.level}</Badge>
            </div>
            <h1 className="text-3xl font-bold mb-4">{course.title}</h1>
            <p className="text-muted-foreground mb-4">{course.description}</p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                {course.rating.toFixed(1)} ({course.reviewCount} reviews)
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {course.enrollmentCount} students
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {totalLectures} lectures
              </span>
            </div>
          </div>

          {course.instructor && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Instructor</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{course.instructor.name}</p>
                {course.instructor.bio && (
                  <p className="text-sm text-muted-foreground mt-1">{course.instructor.bio}</p>
                )}
              </CardContent>
            </Card>
          )}

          <div>
            <h2 className="text-xl font-semibold mb-4">Course Content</h2>
            {course.sections?.length === 0 ? (
              <p className="text-muted-foreground">No content yet</p>
            ) : (
              course.sections?.map((section: { _id: string; title: string; lectures: { _id: string; title: string; duration: number }[] }) => (
                <Card key={section._id} className="mb-4">
                  <CardHeader className="py-3">
                    <CardTitle className="text-base">{section.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="py-0 pb-3">
                    {section.lectures?.map((lecture) => (
                      <div key={lecture._id} className="flex items-center justify-between py-2 border-t first:border-0">
                        <span className="flex items-center gap-2 text-sm">
                          <Play className="h-3 w-3" />
                          {lecture.title}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {Math.floor(lecture.duration / 60)}m
                        </span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <ReviewSection courseId={courseId} isEnrolled={!!isEnrolled} />
        </div>

        <div>
          <Card className="sticky top-20">
            <CardContent className="pt-6 space-y-4">
              <div className="text-3xl font-bold">
                {course.price === 0 ? "Free" : `$${course.price}`}
              </div>

              {isEnrolled && progressData && (
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Your progress</span>
                    <span>{progressData.completionPercentage}%</span>
                  </div>
                  <Progress value={progressData.completionPercentage} />
                </div>
              )}

              {session ? (
                isEnrolled ? (
                  <Button
                    className="w-full gap-2"
                    onClick={() => {
                      if (firstLecture) {
                        router.push(`/learn/${courseId}/${firstLecture._id}`);
                      }
                    }}
                    disabled={!firstLecture}
                  >
                    <Play className="h-4 w-4" />
                    Continue Learning
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    onClick={() => enrollMutation.mutate()}
                    disabled={enrollMutation.isPending}
                  >
                    {enrollMutation.isPending ? "Enrolling..." : "Enroll Now"}
                  </Button>
                )
              ) : (
                <Button className="w-full" onClick={() => router.push("/login")}>
                  Sign in to Enroll
                </Button>
              )}

              {enrollMutation.error && (
                <p className="text-sm text-destructive">
                  {(enrollMutation.error as Error).message}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
