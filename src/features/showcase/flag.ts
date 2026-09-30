/**
 * Which half of the public pages shows the sample content (./data.ts) instead
 * of the platform's real data. Both switches are read from the website's
 * server environment (at request time, no rebuild needed). Sign-in, the
 * participant area and the lesson player always use real data.
 *
 * The owner asked for the new design to be shown with the sample catalogue for
 * now, and then for the experts — and only the experts — to be real. Hence two
 * switches rather than one:
 *
 * - `SHOWCASE_DATA` (SHOWCASE), default "on": the catalogue — courses,
 *   categories and their counts, the classrooms and the sample certificate.
 *   `SHOWCASE_DATA=off` switches all of it to the API.
 * - `SHOWCASE_EXPERTS` (SHOWCASE_EXPERTS), default "off": the experts
 *   directory, the expert pages and the home page's experts are the platform's
 *   real, approved experts. `SHOWCASE_EXPERTS=on` brings back the sample
 *   experts. It only counts while the catalogue is sample content: sample
 *   experts teach sample courses, which do not exist in the real catalogue.
 *
 * With real experts beside a sample catalogue, a sample course still names its
 * sample expert. That one link keeps working: the expert page answers a
 * sample expert's id with the sample profile (see isSampleExpert in
 * ./source.server.ts), while the directory lists only real experts.
 *
 * "off" in any case switches a flag off and any other value switches it on;
 * unset or blank keeps the default, as for every other variable (src/lib/env.ts).
 */
function flag(raw: string | undefined, fallback: boolean): boolean {
  const value = raw?.trim().toLowerCase();
  return value ? value !== "off" : fallback;
}

export const SHOWCASE = flag(process.env.SHOWCASE_DATA, true);

export const SHOWCASE_EXPERTS = SHOWCASE && flag(process.env.SHOWCASE_EXPERTS, false);
