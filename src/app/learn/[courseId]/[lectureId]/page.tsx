"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useEffect, useState } from "react";
import {
  CheckCircle,
  ChevronLeft,
  Bookmark,
  BookmarkCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils/cn";

export default function LearnPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const courseId = params.courseId as string;
  const lectureId = params.lectureId as string;
  const videoRef = useRef<HTMLVideoElement>(null);
  const [maxWatched, setMaxWatched] = useState(0);

  const { data: course } = useQuery({
    queryKey: ["course", courseId],
    queryFn: async () => {
      const res = await fetch(`/api/courses/${courseId}`);
      const json = await res.json();
      return json.data;
    },
  });

  const { data: progress } = useQuery({
    queryKey: ["progress", courseId],
    queryFn: async () => {
      const res = await fetch(`/api/progress?courseId=${courseId}`);
      const json = await res.json();
      return json.data;
    },
  });

  const updateProgress = useMutation({
    mutationFn: async (payload: {
      lectureId: string;
      position?: number;
      completed?: boolean;
    }) => {
      const res = await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, ...payload }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["progress", courseId] });
    },
  });

  const bookmarkMutation = useMutation({
    mutationFn: async (action: "add" | "remove") => {
      const res = await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "bookmark",
          courseId,
          lectureId,
          action,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["progress", courseId] });
    },
  });

  const allLectures =
    course?.sections?.flatMap(
      (s: { _id: string; title: string; lectures: { _id: string; title: string; videoUrl: string; description?: string; resources?: { title: string; type: string; url: string }[] }[] }) =>
        s.lectures.map((l) => ({ ...l, sectionTitle: s.title, sectionId: s._id }))
    ) ?? [];

  const currentLecture = allLectures.find(
    (l: { _id: string }) => l._id === lectureId
  );
  const currentIndex = allLectures.findIndex(
    (l: { _id: string }) => l._id === lectureId
  );

  const isCompleted = progress?.completedLectures?.some(
    (id: string) => id.toString() === lectureId
  );
  const isBookmarked = progress?.bookmarks?.some(
    (id: string) => id.toString() === lectureId
  );

  useEffect(() => {
    if (videoRef.current && progress?.lastWatchedLecture?.toString() === lectureId) {
      videoRef.current.currentTime = progress.lastWatchedPosition || 0;
      setMaxWatched(progress.lastWatchedPosition || 0);
    } else {
      setMaxWatched(0);
    }
  }, [lectureId, progress]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (videoRef.current && !videoRef.current.paused) {
        const pos = videoRef.current.currentTime;
        if (pos > maxWatched) setMaxWatched(pos);
        updateProgress.mutate({ lectureId, position: pos });
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [lectureId, maxWatched]);

  function handleTimeUpdate() {
    if (!videoRef.current) return;
    const current = videoRef.current.currentTime;
    if (current > maxWatched + 2) {
      videoRef.current.currentTime = maxWatched;
    }
  }

  function handleVideoEnded() {
    updateProgress.mutate({ lectureId, completed: true });
  }

  function navigateToLecture(id: string) {
    router.push(`/learn/${courseId}/${id}`);
  }

  if (!course) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-black aspect-video max-h-[60vh]">
          {currentLecture ? (
            <video
              ref={videoRef}
              src={currentLecture.videoUrl}
              controls
              className="w-full h-full"
              onTimeUpdate={handleTimeUpdate}
              onEnded={handleVideoEnded}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-white">
              Lecture not found
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <Button
            variant="ghost"
            size="sm"
            className="mb-4"
            onClick={() => router.push(`/courses/${courseId}`)}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to course
          </Button>

          {currentLecture && (
            <>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{currentLecture.sectionTitle}</p>
                  <h1 className="text-2xl font-bold">{currentLecture.title}</h1>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      bookmarkMutation.mutate(isBookmarked ? "remove" : "add")
                    }
                  >
                    {isBookmarked ? (
                      <BookmarkCheck className="h-4 w-4" />
                    ) : (
                      <Bookmark className="h-4 w-4" />
                    )}
                  </Button>
                  {!isCompleted && (
                    <Button
                      size="sm"
                      onClick={() =>
                        updateProgress.mutate({ lectureId, completed: true })
                      }
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Mark Complete
                    </Button>
                  )}
                </div>
              </div>

              {currentLecture.description && (
                <p className="mt-4 text-muted-foreground">{currentLecture.description}</p>
              )}

              {currentLecture.resources?.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold mb-2">Resources</h3>
                  <ul className="space-y-2">
                    {currentLecture.resources.map(
                      (r: { title: string; url: string; type: string }, i: number) => (
                        <li key={i}>
                          <a
                            href={r.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline text-sm"
                          >
                            {r.title} ({r.type})
                          </a>
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}

              <div className="flex gap-2 mt-6">
                {currentIndex > 0 && (
                  <Button
                    variant="outline"
                    onClick={() =>
                      navigateToLecture(allLectures[currentIndex - 1]._id)
                    }
                  >
                    Previous
                  </Button>
                )}
                {currentIndex < allLectures.length - 1 && (
                  <Button
                    onClick={() =>
                      navigateToLecture(allLectures[currentIndex + 1]._id)
                    }
                  >
                    Next Lecture
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <aside className="w-80 border-l overflow-y-auto hidden lg:block">
        <div className="p-4 border-b">
          <h2 className="font-semibold truncate">{course.title}</h2>
          {progress && (
            <div className="mt-2">
              <div className="flex justify-between text-xs mb-1">
                <span>Progress</span>
                <span>{progress.completionPercentage}%</span>
              </div>
              <Progress value={progress.completionPercentage} />
            </div>
          )}
        </div>
        {course.sections?.map(
          (section: { _id: string; title: string; lectures: { _id: string; title: string; duration: number }[] }) => (
            <div key={section._id}>
              <p className="px-4 py-2 text-sm font-medium bg-muted">{section.title}</p>
              {section.lectures?.map((lecture) => {
                const completed = progress?.completedLectures?.some(
                  (id: string) => id.toString() === lecture._id
                );
                return (
                  <button
                    key={lecture._id}
                    onClick={() => navigateToLecture(lecture._id)}
                    className={cn(
                      "w-full text-left px-4 py-2 text-sm hover:bg-accent flex items-center gap-2",
                      lecture._id === lectureId && "bg-accent",
                      completed && "text-primary"
                    )}
                  >
                    {completed && <CheckCircle className="h-3 w-3 shrink-0" />}
                    <span className="truncate">{lecture.title}</span>
                  </button>
                );
              })}
            </div>
          )
        )}
      </aside>
    </div>
  );
}
