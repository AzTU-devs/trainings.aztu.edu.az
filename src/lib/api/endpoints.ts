export const endpoints = {
  auth: {
    register: "/api/auth/register",
    registerTutor: "/api/auth/register/tutor",
    login: "/api/auth/login",
    refresh: "/api/auth/refresh",
    logout: "/api/auth/logout",
    me: "/api/auth/me",
    appleStart: "/api/auth/oauth/apple/start",
    appleCallback: "/api/auth/oauth/apple/callback",
  },
  public: {
    courses: "/api/public/courses",
    coursesSearch: "/api/public/courses/search",
    courseBySlug: (slug: string) => `/api/public/courses/${slug}`,
    courseReviews: (courseId: string) =>
      `/api/public/courses/${courseId}/reviews`,
    categories: "/api/public/categories",
    categoryChildren: (id: string) => `/api/public/categories/${id}/children`,
  },
  portal: {
    enrollFree: (courseId: string) =>
      `/api/portal/enrollments/courses/${courseId}/free`,
    myEnrollments: "/api/portal/enrollments/mine",
    lessonProgress: (courseId: string, lessonId: string) =>
      `/api/portal/enrollments/courses/${courseId}/lessons/${lessonId}/progress`,
    orders: "/api/portal/orders",
    myOrders: "/api/portal/orders/mine",
    notifications: "/api/portal/notifications",
    notificationsUnread: "/api/portal/notifications/unread-count",
    notificationRead: (id: string) => `/api/portal/notifications/${id}/read`,
    notificationsReadAll: "/api/portal/notifications/read-all",
    reviewCreate: (courseId: string) =>
      `/api/portal/courses/${courseId}/reviews`,
    roomBookings: "/api/portal/room-bookings",
    tutorApply: "/api/portal/tutor/apply",
    tutorMe: "/api/portal/tutor/me",
  },
} as const;
