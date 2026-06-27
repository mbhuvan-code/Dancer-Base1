/**
 * City Dance adapter — covers four rooms:
 *   60 Brady Studio A, 60 Brady Studio B,
 *   The Annex Downstairs, The Annex Upstairs
 *   (60 Brady St and 1420 Harrison St, San Francisco CA)
 *
 * TODO: replace with live fetch from City Dance's Mindbody portal
 * (https://clients.mindbodyonline.com/classic/ws?studioid=6784)
 * by parsing the schedule page or hitting the Mindbody public API.
 */
import type { StudioAdapter, NormalizedClass } from "../pipeline";

const BOOKING_URL = "https://clients.mindbodyonline.com/classic/ws?studioid=6784";

type RawClass = [
  instructorName: string,
  studioKey: "60brady-a" | "60brady-b" | "annex-down" | "annex-up",
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
  // Fri Jun 26
  ["Patty Lam",         "60brady-a",  "Beginning",   "Hiphop",                             "Friday",  "2026-06-26", "5:45 PM",  "7:00 PM",  25, 28],
  ["Sharon Wang",       "60brady-b",  "Intermediate", "Jazz Funk",                          "Friday",  "2026-06-26", "6:00 PM",  "7:15 PM",  25, 22],
  ["NastyRay",          "annex-down", "Beg/Int",      "Breaking",                           "Friday",  "2026-06-26", "5:45 PM",  "7:00 PM",  25, 18, 30],
  ["Dillon Nguyen",     "60brady-a",  "Intermediate", "Choreo",                             "Friday",  "2026-06-26", "7:00 PM",  "8:15 PM",  27, 31],
  ["Jaron Wong",        "60brady-b",  "Int/Adv",      "Choreo",                             "Friday",  "2026-06-26", "7:15 PM",  "8:30 PM",  27, 25],
  // Sun Jun 28
  ["Ariana Pulley",     "60brady-a",  "Int/Adv",      "Choreo",                             "Sunday",  "2026-06-28", "4:15 PM",  "5:30 PM",  25, 20],
  ["Andy Nguyen",       "60brady-b",  "All Levels",   "KPOP",                               "Sunday",  "2026-06-28", "4:15 PM",  "5:30 PM",  25, 35],
  ["Jardy Santiago",    "60brady-a",  "All Levels",   "House Dance Footwork",               "Sunday",  "2026-06-28", "5:30 PM",  "7:00 PM",  27, 30],
  ["Edye Kelly",        "annex-up",   "Int/Adv",      "Choreo",                             "Sunday",  "2026-06-28", "5:30 PM",  "7:00 PM",  27, 17],
  ["Zack Jot",          "60brady-b",  "Int/Adv",      "Choreo",                             "Sunday",  "2026-06-28", "7:00 PM",  "8:30 PM",  26, 22],
  // Mon Jun 29
  ["Leon Li",           "60brady-b",  "Beginning",    "Choreo",                             "Monday",  "2026-06-29", "7:15 PM",  "8:30 PM",  25, 28],
  ["Sarah Medley",      "annex-down", "Beg/Int",      "KPOP",                               "Monday",  "2026-06-29", "7:00 PM",  "8:15 PM",  25, 24],
  ["Loretta Najera",    "annex-up",   "Beg.",         "Jazz Technique & Choreography",      "Monday",  "2026-06-29", "6:00 PM",  "7:15 PM",  25, 15, 30],
  // Fri Jul 3
  ["Joon Hexter",       "60brady-b",  "Intermediate", "Choreo",                             "Friday",  "2026-07-03", "5:30 PM",  "6:45 PM",  25, 33],
  ["Patty Lam",         "60brady-a",  "Beginning",    "Hiphop",                             "Friday",  "2026-07-03", "5:45 PM",  "7:00 PM",  25, 36],
  ["Dillon Nguyen",     "60brady-a",  "Intermediate", "Choreo",                             "Friday",  "2026-07-03", "7:00 PM",  "8:15 PM",  27, 29],
  // Sun Jul 5
  ["Andy Nguyen",       "60brady-b",  "All Levels",   "KPOP",                               "Sunday",  "2026-07-05", "4:15 PM",  "5:30 PM",  25, 38],
  ["Ariana Pulley",     "60brady-a",  "Int/Adv",      "Choreo",                             "Sunday",  "2026-07-05", "5:30 PM",  "7:00 PM",  27, 23],
  ["Jardy Santiago",    "60brady-a",  "All Levels",   "House Dance Footwork",               "Sunday",  "2026-07-05", "7:00 PM",  "8:30 PM",  27, 31],
  // Mon Jul 6
  ["Sharon Wang",       "60brady-b",  "Intermediate", "Jazz Funk",                          "Monday",  "2026-07-06", "6:00 PM",  "7:15 PM",  25, 20],
  ["NastyRay",          "annex-down", "Beg/Int",      "Breaking",                           "Monday",  "2026-07-06", "5:45 PM",  "7:00 PM",  25, 12, 30],
  ["Jaron Wong",        "60brady-a",  "Int/Adv",      "Choreo",                             "Monday",  "2026-07-06", "8:30 PM",  "10:00 PM", 27, 27],
  // Fri Jul 10
  ["Colin + Moscelyne", "60brady-a",  "Beginning",    "Contemporary/Commercial Partnering", "Friday",  "2026-07-10", "5:45 PM",  "7:00 PM",  28, 20, 30],
  ["Zack Jot",          "60brady-b",  "Int/Adv",      "Choreo",                             "Friday",  "2026-07-10", "6:00 PM",  "7:30 PM",  26, 19],
  ["Edye Kelly",        "annex-up",   "Int/Adv",      "Choreo",                             "Friday",  "2026-07-10", "7:00 PM",  "8:30 PM",  27, 14],
  // Sun Jul 12
  ["Andy Nguyen",       "60brady-b",  "All Levels",   "KPOP",                               "Sunday",  "2026-07-12", "4:15 PM",  "5:30 PM",  25, 34],
  ["Ariana Pulley",     "60brady-a",  "Int/Adv",      "Choreo",                             "Sunday",  "2026-07-12", "4:15 PM",  "5:30 PM",  25, 16],
  ["Jardy Santiago",    "60brady-a",  "All Levels",   "House Dance Footwork",               "Sunday",  "2026-07-12", "5:30 PM",  "7:00 PM",  27, 28],
  ["Joon Hexter",       "60brady-b",  "Intermediate", "Choreo",                             "Sunday",  "2026-07-12", "7:00 PM",  "8:15 PM",  25, 21],
];

const INSTRUCTOR_BIOS: Record<string, string> = {
  "Ariana Pulley":     "Award-winning choreo instructor known for intricate footwork and storytelling.",
  "Andy Nguyen":       "KPOP specialist bringing high-energy boy-group and girl-group styles to SF.",
  "Edye Kelly":        "Commercial choreographer with credits in music videos and live tours.",
  "Zack Jot":          "Int/Adv choreo with a focus on clean lines and musicality.",
  "Jardy Santiago":    "House dance legend — one of the Bay's top footwork educators.",
  "NastyRay":          "Breaking instructor and battle competitor, teaching foundation and power moves.",
  "Patty Lam":         "Hiphop fundamentals with a warm teaching style, perfect for beginners.",
  "Sharon Wang":       "Jazz Funk with a commercial edge — sharp, stylish, and always on the beat.",
  "Loretta Najera":    "Classical jazz technique blended with contemporary choreography.",
  "Dillon Nguyen":     "Intermediate choreo pulling from hiphop, commercial, and new jack swing.",
  "Sarah Medley":      "KPOP beg/int classes focused on clean formations and performance quality.",
  "Leon Li":           "Beginning choreo in an encouraging environment — great first class.",
  "Jaron Wong":        "Late-night Int/Adv sessions pushing versatility and artistry.",
  "Joon Hexter":       "Intermediate choreo with a distinctive rhythmic style.",
  "Colin + Moscelyne": "Contemporary partnering duo — strength, trust, and fluid connection.",
};

export const cityDanceAdapter: StudioAdapter = {
  name: "City Dance",
  studios: [
    { key: "60brady-a",  displayName: "City Dance — 60 Brady Studio A",       address: "60 Brady St",     city: "San Francisco", state: "CA" },
    { key: "60brady-b",  displayName: "City Dance — 60 Brady Studio B",       address: "60 Brady St",     city: "San Francisco", state: "CA" },
    { key: "annex-down", displayName: "City Dance — The Annex Downstairs",    address: "1420 Harrison St", city: "San Francisco", state: "CA" },
    { key: "annex-up",   displayName: "City Dance — The Annex Upstairs",      address: "1420 Harrison St", city: "San Francisco", state: "CA" },
  ],

  async fetchClasses(): Promise<NormalizedClass[]> {
    // TODO: replace with live fetch from City Dance's Mindbody portal
    // const html = await fetch("https://clients.mindbodyonline.com/classic/ws?studioid=6784").then(r => r.text());
    // return parseCityDanceSchedule(html);

    return CLASSES_RAW.map(
      ([instructorName, studioKey, level, style, dayOfWeek, date, startTime, endTime, price, spotsRemaining, totalSpots = 40]) => ({
        studioKey,
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
