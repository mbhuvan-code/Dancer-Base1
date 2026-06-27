/**
 * Full Out Dance Studio adapter — 2325 3rd St, San Francisco CA
 *
 * TODO: replace with live fetch from Full Out's booking page
 * (https://www.fulloutstudios.com/schedule)
 * by scraping their schedule widget or using their booking platform's API.
 */
import type { StudioAdapter, NormalizedClass } from "../pipeline";

const BOOKING_URL = "https://www.fulloutstudios.com/schedule";

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
  // Sat Jun 27
  ["Kai Nakamura",   "All Levels", "Choreo",       "Saturday",  "2026-06-27", "11:00 AM", "12:30 PM", 25, 32, 40],
  ["Bianca Morales", "Int/Adv",    "Heels",         "Saturday",  "2026-06-27", "1:00 PM",  "2:30 PM",  28, 21, 35],
  // Mon Jun 29
  ["Lucas Park",     "Beginning",  "Hiphop",        "Monday",    "2026-06-29", "6:00 PM",  "7:00 PM",  20, 34, 40],
  ["Jasmine Liu",    "Beg/Int",    "Contemporary",  "Monday",    "2026-06-29", "7:00 PM",  "8:30 PM",  25, 26, 35],
  // Wed Jul 1
  ["Kai Nakamura",   "All Levels", "Choreo",        "Wednesday", "2026-07-01", "6:00 PM",  "7:30 PM",  25, 28, 40],
  ["Bianca Morales", "Int/Adv",    "Heels",         "Wednesday", "2026-07-01", "7:30 PM",  "9:00 PM",  28, 17, 35],
  // Sun Jul 5
  ["Lucas Park",     "Beginning",  "Hiphop",        "Sunday",    "2026-07-05", "10:00 AM", "11:00 AM", 20, 38, 40],
  ["Jasmine Liu",    "Beg/Int",    "Contemporary",  "Sunday",    "2026-07-05", "11:00 AM", "12:30 PM", 25, 24, 35],
  ["Kai Nakamura",   "All Levels", "Choreo",        "Sunday",    "2026-07-05", "1:00 PM",  "2:30 PM",  25, 19, 40],
  // Mon Jul 6
  ["Lucas Park",     "Beginning",  "Hiphop",        "Monday",    "2026-07-06", "6:00 PM",  "7:00 PM",  20, 36, 40],
  ["Bianca Morales", "Int/Adv",    "Heels",         "Monday",    "2026-07-06", "7:00 PM",  "8:30 PM",  28, 13, 35],
  // Wed Jul 8
  ["Jasmine Liu",    "Beg/Int",    "Contemporary",  "Wednesday", "2026-07-08", "6:30 PM",  "8:00 PM",  25, 22, 35],
  ["Kai Nakamura",   "All Levels", "Choreo",        "Wednesday", "2026-07-08", "8:00 PM",  "9:30 PM",  25, 16, 40],
  // Sat Jul 11
  ["Bianca Morales", "Int/Adv",    "Heels",         "Saturday",  "2026-07-11", "12:00 PM", "1:30 PM",  28,  9, 35],
  ["Lucas Park",     "Beginning",  "Hiphop",        "Saturday",  "2026-07-11", "2:00 PM",  "3:00 PM",  20, 37, 40],
  ["Jasmine Liu",    "Beg/Int",    "Contemporary",  "Saturday",  "2026-07-11", "3:00 PM",  "4:30 PM",  25, 20, 35],
];

const INSTRUCTOR_BIOS: Record<string, string> = {
  "Kai Nakamura":   "High-energy choreo instructor blending hiphop and commercial for all levels.",
  "Bianca Morales": "Heels specialist with TV and music video credits — fierce, technical, transformative.",
  "Lucas Park":     "Beginner-friendly hiphop teacher with a fun, no-pressure class environment.",
  "Jasmine Liu":    "Contemporary dancer trained at Alvin Ailey, bringing fluidity and artistry to the Bay.",
};

export const fullOutAdapter: StudioAdapter = {
  name: "Full Out Dance Studio",
  studios: [
    { key: "full-out", displayName: "Full Out Dance Studio", address: "2325 3rd St", city: "San Francisco", state: "CA" },
  ],

  async fetchClasses(): Promise<NormalizedClass[]> {
    // TODO: replace with live fetch from Full Out's booking page
    // const html = await fetch("https://www.fulloutstudios.com/schedule").then(r => r.text());
    // return parseFullOutSchedule(html);

    return CLASSES_RAW.map(
      ([instructorName, level, style, dayOfWeek, date, startTime, endTime, price, spotsRemaining, totalSpots = 40]) => ({
        studioKey: "full-out",
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
