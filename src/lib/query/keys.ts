export const qk = {
  auth: {
    me: () => ["auth", "me"] as const,
  },
  courses: {
    all: () => ["courses"] as const,
    list: (params: Record<string, unknown>) =>
      ["courses", "list", params] as const,
    search: (q: string) => ["courses", "search", q] as const,
    detail: (slug: string) => ["courses", "detail", slug] as const,
    reviews: (courseId: string) =>
      ["courses", courseId, "reviews"] as const,
  },
  categories: {
    all: () => ["categories"] as const,
    children: (id: string) => ["categories", id, "children"] as const,
  },
  tutors: {
    detail: (id: string) => ["tutors", id] as const,
  },
  enrollments: {
    mine: () => ["enrollments", "mine"] as const,
  },
  orders: {
    mine: () => ["orders", "mine"] as const,
  },
  notifications: {
    list: () => ["notifications", "list"] as const,
    unread: () => ["notifications", "unread"] as const,
  },
} as const;
