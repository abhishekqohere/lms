"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Plus, BarChart3, DollarSign, Users, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function InstructorDashboard() {
  const { data: courses, isLoading } = useQuery({
    queryKey: ["instructor-courses"],
    queryFn: async () => {
      const res = await fetch("/api/courses?instructorOnly=true");
      const json = await res.json();
      return json.data ?? [];
    },
  });

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await fetch("/api/profile");
      const json = await res.json();
      return json.data;
    },
  });

  const stats = profile?.instructorStats;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Instructor Dashboard</h1>
        <Link href="/instructor/courses/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create Course
          </Button>
        </Link>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Courses", value: stats?.courseCount ?? 0, icon: BookOpen },
          { label: "Students", value: stats?.totalStudents ?? 0, icon: Users },
          { label: "Revenue", value: `$${stats?.revenue ?? 0}`, icon: DollarSign },
          { label: "Analytics", value: "View", icon: BarChart3 },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <h2 className="text-xl font-semibold mb-4">Your Courses</h2>
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : courses?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">You haven&apos;t created any courses yet</p>
            <Link href="/instructor/courses/new">
              <Button>Create Your First Course</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {courses?.map((course: {
            _id: string;
            title: string;
            isPublished: boolean;
            enrollmentCount: number;
            rating: number;
            price: number;
          }) => (
            <Card key={course._id}>
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <h3 className="font-semibold">{course.title}</h3>
                  <div className="flex gap-2 mt-1 text-sm text-muted-foreground">
                    <span>{course.enrollmentCount} students</span>
                    <span>★ {course.rating.toFixed(1)}</span>
                    <span>${course.price}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={course.isPublished ? "default" : "secondary"}>
                    {course.isPublished ? "Published" : "Draft"}
                  </Badge>
                  <Link href={`/instructor/courses/${course._id}/edit`}>
                    <Button variant="outline" size="sm">Edit</Button>
                  </Link>
                  <Link href={`/instructor/courses/${course._id}/analytics`}>
                    <Button variant="ghost" size="sm">Analytics</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
