import { CourseCard } from "./CourseCard";
import type { CourseSummary } from "../types";

/**
 * Columns follow the width the grid is given, not the viewport: the catalogue
 * sets it beside a filter column while an expert's page gives it the full
 * width, and a container query keeps every card at a readable ~15rem or more
 * in both — 1, 2, 3 or 4 across.
 */
export function CourseGrid({ courses }: { courses: CourseSummary[] }) {
  return (
    <div className="@container">
      <ul className="grid grid-cols-1 gap-5 @xl:grid-cols-2 @3xl:grid-cols-3 @5xl:grid-cols-4">
        {courses.map((c) => (
          <li key={c.id} className="min-w-0">
            <CourseCard course={c} />
          </li>
        ))}
      </ul>
    </div>
  );
}
