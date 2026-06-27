/**
 * On One Dance Studio adapter — 3218 Adeline St, Oakland CA
 *
 * TODO: replace with live fetch from On One's booking page
 * (https://ononestudios.com/sign-up/)
 * by scraping their schedule widget or using their booking platform's API.
 */
import type { StudioAdapter, NormalizedClass } from "../pipeline";

const BOOKING_URL = "https://ononestudios.com/sign-up/";

type RawClass = [
  instructorName: string,
  level: string,
  style: string,
  dayOfWeek: string,
  date: string,
  startTime: string,
  endTime: string,
  price: number,
  spotsRemaining: number,
  totalSpots?: number,
];

const CLASSES_RAW: RawClass[] = [
  // Sun Jun 28
  ["Mia Chen",       "Intermediate", "KPOP",      "Sunday",    "2026-06-28", "2:00 PM",  "3:30 PM",  25, 26, 30],
  ["Andre Williams", "Int/Adv",      "Hiphop",    "Sunday",    "2026-06-28", "4:00 PM",  "5:30 PM",  28, 13, 30],
  ["Sofia Reyes",    "All Levels",   "Jazz Funk", "Sunday",    "2026-06-28", "5:30 PM",  "7:00 PM",  25, 30, 35],
  // Tue Jun 30
  ["Tyler Brooks",   "Intermediate", "Breaking",  "Tuesday",   "2026-06-30", "6:30 PM",  "8:00 PM",  25, 18, 25],
  ["Andre Williams", "Int/Adv",      "Hiphop",    "Tuesday",   "2026-06-30", "8:00 PM",  "9:30 PM",  28, 16, 30],
  // Thu Jul 2
  ["Mia Chen",       "Intermediate", "KPOP",      "Thursday",  "2026-07-02", "6:00 PM",  "7:30 PM",  25, 24, 30],
  ["Sofia Reyes",    "All Levels",   "Jazz Funk", "Thursday",  "2026-07-02", "7:30 PM",  "9:00 PM",  25, 27, 35],
  // Sun Jul 5
  ["Tyler Brooks",   "Intermediate", "Breaking",  "Sunday",    "2026-07-05", "1:00 PM",  "2:30 PM",  25, 20, 25],
  ["Mia Chen",       "Intermediate", "KPOP",      "Sunday",    "2026-07-05", "3:00 PM",  "4:30 PM",  25, 33, 30],
  ["Andre Williams", "Int/Adv",      "Hiphop",    "Sunday",    "2026-07-05", "5:00 PM",  "6:30 PM",  28, 10, 30],
  // Tue Jul 7
  ["Sofia Reyes",    "All Levels",   "Jazz Funk", "Tuesday",   "2026-07-07", "6:00 PM",  "7:30 PM",  25, 31, 35],
  ["Tyler Brooks",   "Intermediate", "Breaking",  "Tuesday",   "2026-07-07", "7:30 PM",  "9:00 PM",  25, 15, 25],
  // Thu Jul 9
  ["Andre Williams", "Int/Adv",      "Hiphop",    "Thursday",  "2026-07-09", "6:00 PM",  "7:30 PM",  28,  8, 30],
  ["Mia Chen",       "Intermediate", "KPOP",      "Thursday",  "2026-07-09", "7:30 PM",  "9:00 PM",  25, 22, 30],
  // Sun Jul 12
  ["Tyler Brooks",   "Intermediate", "Breaking",  "Sunday",    "2026-07-12", "1:00 PM",  "2:30 PM",  25, 17, 25],
  ["Sofia Reyes",    "All Levels",   "Jazz Funk", "Sunday",    "2026-07-12", "3:00 PM",  "4:30 PM",  25, 29, 35],
  ["Andre Williams", "Int/Adv",      "Hiphop",    "Sunday",    "2026-07-12", "5:00 PM",  "6:30 PM",  28, 11, 30],
];

const INSTRUCTOR_BIOS: Record<string, string> = {
  "Mia Chen":       "Oakland-based KPOP instructor with a background in competitive dance and idol training.",
  "Andre Williams": "Veteran hiphop dancer bringing raw East Bay energy and technical mastery.",
  "Sofia Reyes":    "Jazz Funk artist with a commercial and theatrical edge, trained in LA and NYC.",
  "Tyler Brooks":   "Breaking pioneer in the Oakland scene, competing on the West Coast circuit.",
};

export const onOneAdapter: StudioAdapter = {
  name: "On One Dance Studio",
  studios: [
    { key: "on-one", displayName: "On One Dance Studio", address: "3218 Adeline St", city: "Oakland", state: "CA" },
  ],

  async fetchClasses(): Promise<NormalizedClass[]> {
    // TODO: replace with live fetch from On One's booking page
    // const html = await fetch("https://ononestudios.com/sign-up/").then(r => r.text());
    // return parseOnOneSchedule(html);

    return CLASSES_RAW.map(
      ([instructorName, level, style, dayOfWeek, date, startTime, endTime, price, spotsRemaining, totalSpots = 30]) => ({
        studioKey: "on-one",
        instructorName,
        instructorStyles: [style],
        instructorBio: INSTRUCTOR_BIOS[instructorName],
        date,
        dayOfWeek,
        startTime,
        endTime,
        price,
        style,
        level,
        totalSpots,
        spotsRemaining,
        bookingUrl: BOOKING_URL,
      })
    );
  },
};
