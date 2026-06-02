import { CourseCard } from "./CourseCard";
import type { CourseSummary } from "../types";

export function CourseGrid({ courses }: { courses: CourseSummary[] }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {courses.map((c) => (
        <CourseCard key={c.id} course={c} />
      ))}
    </div>
  );
}
