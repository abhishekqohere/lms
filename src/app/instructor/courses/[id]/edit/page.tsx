"use client";

import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { courseSchema, type CourseInput } from "@/lib/validations/course";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { Plus } from "lucide-react";

export default function EditCoursePage() {
  const params = useParams();
  const courseId = params.id as string;
  const queryClient = useQueryClient();
  const [sectionTitle, setSectionTitle] = useState("");
  const [lectureForm, setLectureForm] = useState({
    sectionId: "",
    title: "",
    videoUrl: "",
  });

  const { data: course, isLoading } = useQuery({
    queryKey: ["course", courseId],
    queryFn: async () => {
      const res = await fetch(`/api/courses/${courseId}`);
      const json = await res.json();
      return json.data;
    },
  });

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CourseInput>({
    resolver: zodResolver(courseSchema),
    values: course
      ? {
          title: course.title,
          description: course.description,
          thumbnail: course.thumbnail || "",
          category: course.category,
          price: course.price,
          level: course.level,
        }
      : undefined,
  });

  const updateCourse = useMutation({
    mutationFn: async (data: CourseInput & { isPublished?: boolean }) => {
      const res = await fetch(`/api/courses/${courseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["course", courseId] }),
  });

  const addSection = useMutation({
    mutationFn: async (title: string) => {
      const res = await fetch("/api/sections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, title }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course", courseId] });
      setSectionTitle("");
    },
  });

  const addLecture = useMutation({
    mutationFn: async (data: { sectionId: string; title: string; videoUrl: string }) => {
      const res = await fetch("/api/lectures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, courseId }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course", courseId] });
      setLectureForm({ sectionId: "", title: "", videoUrl: "" });
    },
  });

  if (isLoading) return <div className="p-8">Loading...</div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Edit Course</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit((d) => updateCourse.mutate(d))} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" {...register("title")} />
              {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" rows={4} {...register("description")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="thumbnail">Thumbnail URL</Label>
              <Input id="thumbnail" {...register("thumbnail")} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input id="category" {...register("category")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="level">Level</Label>
                <select id="level" {...register("level")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price</Label>
                <Input id="price" type="number" {...register("price", { valueAsNumber: true })} />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={isSubmitting}>Save Changes</Button>
              <Button
                type="button"
                variant={course?.isPublished ? "outline" : "default"}
                onClick={() =>
                  updateCourse.mutate({
                    title: course.title,
                    description: course.description,
                    category: course.category,
                    price: course.price,
                    level: course.level,
                    isPublished: !course.isPublished,
                  })
                }
              >
                {course?.isPublished ? "Unpublish" : "Publish"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sections & Lectures</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-2">
            <Input
              placeholder="New section title"
              value={sectionTitle}
              onChange={(e) => setSectionTitle(e.target.value)}
            />
            <Button
              onClick={() => sectionTitle && addSection.mutate(sectionTitle)}
              disabled={!sectionTitle}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {course?.sections?.map((section: { _id: string; title: string; lectures: { _id: string; title: string; videoUrl: string }[] }) => (
            <div key={section._id} className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3">{section.title}</h3>
              {section.lectures?.map((lecture) => (
                <div key={lecture._id} className="flex items-center justify-between py-2 text-sm border-t">
                  <span>{lecture.title}</span>
                </div>
              ))}
              <div className="mt-3 flex gap-2">
                <Input
                  placeholder="Lecture title"
                  value={lectureForm.sectionId === section._id ? lectureForm.title : ""}
                  onChange={(e) =>
                    setLectureForm({ sectionId: section._id, title: e.target.value, videoUrl: lectureForm.videoUrl })
                  }
                />
                <Input
                  placeholder="Video URL"
                  value={lectureForm.sectionId === section._id ? lectureForm.videoUrl : ""}
                  onChange={(e) =>
                    setLectureForm({ sectionId: section._id, title: lectureForm.title, videoUrl: e.target.value })
                  }
                />
                <Button
                  size="sm"
                  onClick={() => {
                    if (lectureForm.sectionId === section._id && lectureForm.title && lectureForm.videoUrl) {
                      addLecture.mutate(lectureForm);
                    } else {
                      setLectureForm({ ...lectureForm, sectionId: section._id });
                    }
                  }}
                >
                  Add
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
