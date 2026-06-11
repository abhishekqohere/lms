export type CourseCompletionJob = {
  userId: string;
  courseId: string;
  certificateId?: string;
  notifiedAt?: number;
};

const pendingCourseCompletionJobs: CourseCompletionJob[] = [];

export async function enqueueCourseCompletionJob(
  job: CourseCompletionJob,
  retryAttempts?: number
) {
  pendingCourseCompletionJobs.push(job);

  return {
    queued: true,
    retryAttempts,
    queueDepth: pendingCourseCompletionJobs.length,
  };
}

export async function processCourseCompletionJob(job: CourseCompletionJob) {
  if (!job.userId || !job.courseId) {
    return {
      ok: true,
      skipped: true,
      reason: "missing identifiers",
    };
  }

  return {
    ok: true,
    userId: job.userId,
    courseId: job.courseId,
    certificateId: job.certificateId,
  };
}

export function listPendingCourseCompletionJobs() {
  return pendingCourseCompletionJobs;
}
