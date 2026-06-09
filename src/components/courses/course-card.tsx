"use client";

import Link from "next/link";
import Image from "next/image";
import { Star, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface CourseCardProps {
  course: {
    _id: string;
    title: string;
    slug: string;
    description: string;
    thumbnail?: string;
    category: string;
    price: number;
    level: string;
    rating: number;
    enrollmentCount: number;
    instructor?: { name: string; avatar?: string };
  };
}

export function CourseCard({ course }: CourseCardProps) {
  return (
    <Link href={`/courses/${course._id}`}>
      <Card className="h-full overflow-hidden transition-shadow hover:shadow-lg">
        <div className="relative aspect-video bg-muted">
          {course.thumbnail ? (
            <Image
              src={course.thumbnail}
              alt={course.title}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              No thumbnail
            </div>
          )}
          <Badge className="absolute top-2 right-2 capitalize">{course.level}</Badge>
        </div>
        <CardHeader className="pb-2">
          <Badge variant="secondary" className="w-fit mb-2">{course.category}</Badge>
          <CardTitle className="text-lg line-clamp-2">{course.title}</CardTitle>
        </CardHeader>
        <CardContent className="pb-2">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {course.description}
          </p>
          {course.instructor && (
            <p className="text-xs text-muted-foreground mt-2">
              by {course.instructor.name}
            </p>
          )}
        </CardContent>
        <CardFooter className="flex justify-between items-center">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              {course.rating.toFixed(1)}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {course.enrollmentCount}
            </span>
          </div>
          <span className="font-bold text-primary">
            {course.price === 0 ? "Free" : `$${course.price}`}
          </span>
        </CardFooter>
      </Card>
    </Link>
  );
}
