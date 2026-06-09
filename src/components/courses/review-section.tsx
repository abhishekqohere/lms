"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { reviewSchema, type ReviewInput } from "@/lib/validations/course";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star } from "lucide-react";

interface ReviewSectionProps {
  courseId: string;
  isEnrolled: boolean;
}

export function ReviewSection({ courseId, isEnrolled }: ReviewSectionProps) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data: reviews, isLoading } = useQuery({
    queryKey: ["reviews", courseId],
    queryFn: async () => {
      const res = await fetch(`/api/reviews?courseId=${courseId}`);
      const json = await res.json();
      return json.data ?? [];
    },
  });

  const { register, handleSubmit, setValue, watch, formState: { errors }, reset } = useForm<ReviewInput>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { courseId, rating: 5 },
  });

  const rating = watch("rating");

  const submitMutation = useMutation({
    mutationFn: async (data: ReviewInput) => {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews", courseId] });
      queryClient.invalidateQueries({ queryKey: ["course", courseId] });
      reset({ courseId, rating: 5, comment: "" });
      setShowForm(false);
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Reviews</h2>
        {isEnrolled && !showForm && (
          <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
            Write a Review
          </Button>
        )}
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit((d) => submitMutation.mutate(d))} className="space-y-4">
              <div>
                <Label>Rating</Label>
                <div className="flex gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setValue("rating", star)}
                    >
                      <Star
                        className={`h-6 w-6 ${
                          star <= rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-muted-foreground"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="comment">Your Review</Label>
                <Textarea id="comment" {...register("comment")} className="mt-1" />
                {errors.comment && (
                  <p className="text-sm text-destructive">{errors.comment.message}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={submitMutation.isPending}>
                  Submit Review
                </Button>
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <p className="text-muted-foreground">Loading reviews...</p>
      ) : reviews?.length === 0 ? (
        <p className="text-muted-foreground">No reviews yet. Be the first!</p>
      ) : (
        <div className="space-y-4">
          {reviews?.map((review: {
            _id: string;
            rating: number;
            comment: string;
            userId: { name: string };
            createdAt: string;
          }) => (
            <Card key={review._id}>
              <CardHeader className="py-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">
                    {review.userId?.name ?? "Anonymous"}
                  </CardTitle>
                  <div className="flex">
                    {Array.from({ length: review.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="py-0 pb-3">
                <p className="text-sm text-muted-foreground">{review.comment}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
