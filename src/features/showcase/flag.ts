/**
 * Whether the public pages show the sample catalogue (./data.ts) instead of
 * the platform's real courses, categories and experts.
 *
 * On by default: the owner asked for the new design to be shown with the
 * sample content for now. Set `SHOWCASE_DATA=off` in the website's server
 * environment (read at request time, no rebuild needed) to switch every public
 * page back to the real API data. Sign-in, the participant area and the lesson
 * player always use real data.
 */
export const SHOWCASE = (process.env.SHOWCASE_DATA ?? "on").trim().toLowerCase() !== "off";
