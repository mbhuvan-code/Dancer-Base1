/**
 * In the Groove Studios adapter — 474 Valencia St, San Francisco CA
 *
 * TODO: replace with live fetch from In the Groove's booking page
 * (https://inthegroovestudios.org/class-schedule)
 * by scraping their schedule widget or using their booking platform's API.
 */
import type { StudioAdapter, NormalizedClass } from "../pipeline";

const BOOKING_URL = "https://inthegroovestudios.org/class-schedule";

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
  ["Marcus Bell",   "Int/Adv",    "Hiphop",    "Saturday",  "2026-06-27", "1:00 PM",  "2:30 PM",  28, 18, 35],
  ["Keiko Torres",  "All Levels", "Heels",     "Saturday",  "2026-06-27", "2:30 PM",  "4:00 PM",  28, 26, 30],
  ["Devon Park",    "Beg/Int",    "Waacking",  "Saturday",  "2026-06-27", "4:00 PM",  "5:30 PM",  25, 22, 30],
  // Tue Jun 30
  ["Amara Osei",    "All Levels", "Afrobeats", "Tuesday",   "2026-06-30", "6:00 PM",  "7:30 PM",  25, 29, 35],
  ["Marcus Bell",   "Int/Adv",    "Hiphop",    "Tuesday",   "2026-06-30", "7:30 PM",  "9:00 PM",  28, 15, 35],
  // Thu Jul 2
  ["Keiko Torres",  "All Levels", "Heels",     "Thursday",  "2026-07-02", "6:00 PM",  "7:30 PM",  28, 21, 30],
  ["Devon Park",    "Beg/Int",    "Waacking",  "Thursday",  "2026-07-02", "7:30 PM",  "9:00 PM",  25, 17, 30],
  // Tue Jul 7
  ["Devon Park",    "Beg/Int",    "Waacking",  "Tuesday",   "2026-07-07", "6:00 PM",  "7:30 PM",  25, 19, 30],
  ["Amara Osei",    "All Levels", "Afrobeats", "Tuesday",   "2026-07-07", "7:30 PM",  "9:00 PM",  25, 28, 35],
  // Thu Jul 9
  ["Marcus Bell",   "Int/Adv",    "Hiphop",    "Thursday",  "2026-07-09", "6:00 PM",  "7:30 PM",  28,  9, 35],
  ["Keiko Torres",  "All Levels", "Heels",     "Thursday",  "2026-07-09", "7:30 PM",  "9:00 PM",  28, 23, 30],
  // Sat Jul 11
  ["Amara Osei",    "All Levels", "Afrobeats", "Saturday",  "2026-07-11", "11:00 AM", "12:30 PM", 25, 30, 35],
  ["Devon Park",    "Beg/Int",    "Waacking",  "Saturday",  "2026-07-11", "1:00 PM",  "2:30 PM",  25, 14, 30],
  ["Marcus Bell",   "Int/Adv",    "Hiphop",    "Saturday",  "2026-07-11", "3:00 PM",  "4:30 PM",  28,  7, 35],
];

const INSTRUCTOR_BIOS: Record<string, string> = {
  "Marcus Bell":  "SF hiphop staple — explosive Int/Adv classes blending street style and precision.",
  "Keiko Torres": "Heels instructor known for empowering, technique-forward classes at all levels.",
  "Devon Park":   "Waacking specialist rooted in the SF ballroom and underground scene.",
  "Amara Osei":   "Afrobeats educator bringing West African rhythms and diaspora styles to the Bay.",
};

export const inTheGrooveAdapter: StudioAdapter = {
  name: "In the Groove Studios",
  studios: [
    { key: "itg", displayName: "In the Groove Studios", address: "474 Valencia St", city: "San Francisco", state: "CA" },
  ],

  async fetchClasses(): Promise<NormalizedClass[]> {
    // TODO: replace with live fetch from In the Groove's booking page
    // const html = await fetch("https://inthegroovestudios.org/class-schedule").then(r => r.text());
    // return parseInTheGrooveSchedule(html);

    return CLASSES_RAW.map(
      ([instructorName, level, style, dayOfWeek, date, startTime, endTime, price, spotsRemaining, totalSpots = 35]) => ({
        studioKey: "itg",
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
