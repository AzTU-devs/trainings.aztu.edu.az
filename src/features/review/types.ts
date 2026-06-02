export type CourseReview = {
  id: string;
  courseId: string;
  userId: string;
  authorName: string;
  rating: number;
  title?: string | null;
  body?: string | null;
  visible: boolean;
  createdAt: string;
};

export type ReviewCreateInput = {
  rating: number;
  title?: string;
  body?: string;
};
