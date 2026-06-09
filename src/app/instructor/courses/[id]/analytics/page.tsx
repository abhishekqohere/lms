"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, DollarSign, Star } from "lucide-react";

export default function CourseAnalyticsPage() {
  const params = useParams();
  const courseId = params.id as string;

  const { data, isLoading } = useQuery({
    queryKey: ["analytics", courseId],
    queryFn: async () => {
      const res = await fetch(`/api/courses/${courseId}/analytics`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
  });

  if (isLoading) return <div className="p-8">Loading analytics...</div>;

  const { course, students } = data ?? {};

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">{course?.title}</h1>
      <p className="text-muted-foreground mb-8">Course Analytics</p>

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Enrollments</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{course?.enrollmentCount ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${course?.revenue ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {course?.rating?.toFixed(1) ?? 0} ({course?.reviewCount ?? 0})
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Enrolled Students</CardTitle>
        </CardHeader>
        <CardContent>
          {students?.length === 0 ? (
            <p className="text-muted-foreground">No students enrolled yet</p>
          ) : (
            <div className="space-y-2">
              {students?.map((enrollment: {
                _id: string;
                enrolledAt: string;
                userId: { name: string; email: string };
              }) => (
                <div key={enrollment._id} className="flex justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium">{enrollment.userId?.name}</p>
                    <p className="text-sm text-muted-foreground">{enrollment.userId?.email}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(enrollment.enrolledAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
