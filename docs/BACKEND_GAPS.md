# Backend gaps

Endpoints and behaviors the frontend needs but the Spring Boot backend does not yet expose.
Each item lists the route we'd hit, what we send, what we expect back, and where on the
frontend it'd unlock work.

> Status legend — **MISSING**: route does not exist yet · **PARTIAL**: route exists but
> needs more fields or filters · **CLIENT-SIDE FALLBACK**: frontend currently fakes or
> degrades the feature.

---

## 1 · Catalog filtering (CLIENT-SIDE FALLBACK)

`CoursePublicController.browse()` accepts only `type` and `Pageable`. The frontend has
a full filter UI for price, rating, duration and category; today we apply those
client-side to the rendered page (visible/total counter makes the limit obvious).

**Wanted**

```
GET /api/public/courses
   ?type=ONLINE|OFFLINE
   ?category={slug or id}
   ?priceMin={number}&priceMax={number}
   ?ratingMin={number}      # 0..5
   ?durationBucket=lt2|2to6|6to17|gt17
   ?level=BEGINNER|INTERMEDIATE|ADVANCED|ALL
   ?language={iso code}
   ?free={true|false}
   ?page&size&sort
```

Returns the same `PageResponse<CourseSummaryDto>` it returns today.

**Why**: the `CourseSummaryDto` does **not** include a duration field, so we can't filter
by duration even client-side. Either add `totalDurationSec` to the summary, or implement
the duration filter server-side and only return what matched.

**Frontend impact**: `src/features/course/filters.ts` `applyClientFilters` is the
fallback. Once server params land, move each filter into the `searchParams` of
`courseServerApi.list()` (`src/features/course/api.server.ts`) and delete the
client-side branch.

---

## 2 · Course summary needs a duration field (PARTIAL)

`CourseSummaryDto` currently has no `totalDurationSec` / `totalVideoSec`. The full
`CourseDto.onlineDetails.totalVideoSeconds` exists, but we can't pre-fetch that on
the listing page.

**Wanted**: extend `CourseSummaryDto`

```java
public record CourseSummaryDto(
        ...,
        Integer totalDurationSec   // online: sum of lesson durations; offline: total contact hours * 3600
) {}
```

**Frontend impact**: `CourseCard` will show duration, and the duration filter (#1)
can apply correctly.

---

## 3 · Lesson progress GET (MISSING)

Backend has `PUT /api/portal/enrollments/courses/{courseId}/lessons/{lessonId}/progress`
but no GET. So when the learning page loads, we have no way to fetch saved progress
for all lessons in a course.

**Wanted**

```
GET /api/portal/enrollments/courses/{courseId}/progress
→ LessonProgressDto[]
```

**Frontend impact**:
- [src/features/learning/components/LearningClient.tsx](../src/features/learning/components/LearningClient.tsx)
  currently starts with `initialProgress = {}` (sidebar shows everything as not started).
- Add `enrollmentServerApi.lessonProgress(courseId)` in
  [src/features/enrollment/api.server.ts](../src/features/enrollment/api.server.ts)
  and pass the result through `LearnLessonPage` props.

---

## 4 · Public media / signed video URLs (MISSING)

`LessonDto.videoUrl` is a plain string the backend stores. There's no
`MediaController` or signed-URL flow. The `media` package has `MediaFileDto` and
repositories but no HTTP surface.

**Wanted**

```
GET /api/public/media/lessons/{lessonId}/manifest
→ { url: "https://cdn/.../master.m3u8?Expires=...&Signature=...", expiresAt: "..." }
```

Should require the user to be enrolled in the course (or the lesson must be `preview = true`).

**Frontend impact**:
- [VideoPlayer](../src/features/learning/components/VideoPlayer.tsx) already handles
  `.m3u8` URLs via `hls.js`; today it just consumes whatever string is in `LessonDto.videoUrl`.
- When the manifest endpoint ships, replace the static URL in `LearningClient` with a
  per-lesson fetch (`useQuery`) that re-runs when close to expiry.

---

## 5 · Public tutor profile (MISSING)

Only `/api/portal/tutor/me` (self) and admin endpoints exist. The course detail page
links to `/tutors/{tutorId}` but there's no public read endpoint.

**Wanted**

```
GET /api/public/tutors/{tutorId}
→ TutorProfileDto

GET /api/public/tutors/{tutorId}/courses
→ Page<CourseSummaryDto>
```

`TutorProfileDto` already exists and is suitable — just expose it (and only when
`approvalStatus = APPROVED`).

**Frontend impact**: [app/[lang]/(marketing)/tutors/[id]/page.tsx](../app/[lang]/(marketing)/tutors/[id]/page.tsx)
is a placeholder right now. Once the route exists, switch it to the real fetch and
render `TutorProfileCard` + a `CourseGrid` of the tutor's published courses.

---

## 6 · Password reset flow (MISSING)

There's no forgot-password / reset endpoint, so [forgot-password](../app/[lang]/(auth)/forgot-password/page.tsx)
is a placeholder.

**Wanted**

```
POST /api/auth/password/forgot           { email }
   → 204 (always 204 — don't reveal account existence)

POST /api/auth/password/reset            { token, newPassword }
   → 204
```

The reset email links to `/{locale}/reset-password?token=...` (route exists in the
plan, not in the codebase yet).

---

## 7 · Email verification (MISSING)

`UserDto.emailVerified` exists but no endpoint to verify it. After registration the
backend should send a verification email. We need:

```
POST /api/auth/email/verify              { token }
POST /api/auth/email/resend              { }   (auth required)
```

The deep link lands at `/{locale}/verify-email?token=...`.

---

## 8 · Notification WebSocket payload shape (UNDOCUMENTED)

STOMP is wired (`/ws`, subscribe to `/user/queue/notifications`) and the frontend
listens in
[useNotificationSocket](../src/features/notification/useNotificationSocket.ts).
The payload we expect is the full `NotificationDto` (so the toast can show title +
body and so React Query can use it to update caches without an extra fetch).

**Confirm**: when `NotificationDispatcher` calls `convertAndSendToUser(...)`, the
serialized body matches `NotificationDto` exactly (same field names / casing).

---

## 9 · Course summary needs `thumbnailUrl` / `thumbnailMediaId` (PARTIAL)

`CourseSummaryDto` exposes neither `thumbnailMediaId` nor a resolved URL. The card
falls back to a deterministic gradient. To show real thumbnails:

```java
public record CourseSummaryDto(
        ...,
        String thumbnailUrl   // already-resolved public URL or null
) {}
```

Or expose `thumbnailMediaId` plus the public media endpoint from #4.

---

## 10 · Reviews — was the user enrolled? (NICE-TO-HAVE)

Today the review form on course detail shows for any authenticated user. Backend
already gates `POST /api/portal/courses/{id}/reviews` with `review:create`, but the
client can't pre-check.

**Wanted**: include `canReview: boolean` on `CourseDto` for the current user (only true
when enrolled and not yet reviewed) — or a small endpoint:

```
GET /api/portal/courses/{courseId}/reviews/eligibility
→ { canReview, alreadyReviewed }
```

---

## 11 · Notification mark-read returns count (NICE-TO-HAVE)

`POST /api/portal/notifications/{id}/read` and `POST /read-all` return 204. We
re-fetch the unread count after every mark. Including the new count in the response
saves a round trip:

```
POST /api/portal/notifications/{id}/read
→ { unreadCount: number }
```

---

## 12 · Sitemap feed (MISSING — needed for SEO)

For `app/sitemap.ts` we want a fast feed of published course slugs:

```
GET /api/public/sitemap/courses
→ [{ slug, updatedAt }]
```

---

## Priority order (suggested)

1. **#4 media manifest** + **#9 thumbnail URL** — biggest visual win, unlocks real video.
2. **#3 progress GET** — required for "Continue learning" to make sense after a relogin.
3. **#1 + #2 catalog filters** — unblocks the full filter UI.
4. **#5 public tutor profile** — fills the last placeholder marketing page.
5. **#6 + #7 password reset / email verification** — security hygiene.
6. **#10–#12** — incremental polish.
