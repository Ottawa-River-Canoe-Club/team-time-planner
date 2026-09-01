import { addDays, addWeeks, differenceInCalendarWeeks, format, startOfWeek } from "date-fns";

export type ProgramId = string;
export type ScheduleTypeId = string;

export type ScheduleType = {
  id: ScheduleTypeId;
  name: string;
};

export const DEFAULT_SCHEDULE_TYPES: ScheduleType[] = [
  { id: "camp", name: "Camp Schedule" },
  { id: "dock", name: "Dock Duty" },
];

export type Program = {
  id: ProgramId;
  /** Which schedule type (operational area) this row belongs to */
  typeId: ScheduleTypeId;
  name: string;
  /** Short label used in the ratio readout, e.g. "Jrs" */
  short: string;
  /** Any CSS color; used to derive row, chip and dot styles */
  color: string;
};

export const DEFAULT_PROGRAMS: Program[] = [
  { id: "junior-racing", typeId: "camp", name: "Junior Racing", short: "Jrs", color: "oklch(0.58 0.13 245)" },
  { id: "canoe-kids", typeId: "camp", name: "Canoe Kids", short: "CK", color: "oklch(0.62 0.13 155)" },
  { id: "youth-camps", typeId: "camp", name: "Youth Camps", short: "YC", color: "oklch(0.72 0.15 65)" },
  { id: "intro-to-comp", typeId: "camp", name: "Intro to Comp", short: "ITC", color: "oklch(0.58 0.15 300)" },
  { id: "opening-shift", typeId: "dock", name: "Opening Shift", short: "Open", color: "oklch(0.66 0.13 195)" },
  { id: "mid-day-shift", typeId: "dock", name: "Mid-Day Shift", short: "Mid", color: "oklch(0.72 0.15 65)" },
  { id: "closing-shift", typeId: "dock", name: "Closing Shift", short: "Close", color: "oklch(0.6 0.14 340)" },
  { id: "weekend-operations", typeId: "dock", name: "Weekend Operations", short: "Wknd", color: "oklch(0.62 0.18 20)" },
];

export const PROGRAM_SWATCHES = [
  "oklch(0.58 0.13 245)",
  "oklch(0.72 0.15 65)",
  "oklch(0.62 0.13 155)",
  "oklch(0.58 0.15 300)",
  "oklch(0.62 0.18 20)",
  "oklch(0.66 0.13 195)",
  "oklch(0.6 0.14 340)",
  "oklch(0.55 0.02 260)",
];

const FALLBACK_PROGRAM: Program = {
  id: "unknown",
  typeId: "camp",
  name: "Unassigned program",
  short: "—",
  color: "oklch(0.55 0.02 260)",
};

export const programById = (programs: Program[], id: ProgramId): Program =>
  programs.find((p) => p.id === id) ?? programs[0] ?? FALLBACK_PROGRAM;

export const blockStyle = (color: string, faded = false) => ({
  backgroundColor: `color-mix(in oklab, ${color} ${faded ? 6 : 14}%, transparent)`,
  borderColor: `color-mix(in oklab, ${color} ${faded ? 60 : 45}%, transparent)`,
  color: `color-mix(in oklab, ${color} 78%, var(--foreground))`,
});

export const chipStyle = (color: string) => ({
  backgroundColor: `color-mix(in oklab, ${color} 16%, transparent)`,
  color: `color-mix(in oklab, ${color} 78%, var(--foreground))`,
});

export const slugify = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") ||
  `program-${Math.random().toString(36).slice(2, 7)}`;

export type StaffRole =
  | "Head Coach"
  | "Canoe Kids Instructor"
  | "Boat House Attendant"
  | "Regatta Official"
  | "Lifeguard";

export const STAFF_ROLES: StaffRole[] = [
  "Head Coach",
  "Canoe Kids Instructor",
  "Boat House Attendant",
  "Regatta Official",
  "Lifeguard",
];

export type Staff = {
  id: string;
  name: string;
  role: StaffRole;
};

export const STAFF: Staff[] = [
  { id: "s1", name: "Ariane Boucher", role: "Head Coach" },
  { id: "s2", name: "Devon Clarke", role: "Head Coach" },
  { id: "s3", name: "Priya Raman", role: "Canoe Kids Instructor" },
  { id: "s4", name: "Marc Lévesque", role: "Canoe Kids Instructor" },
  { id: "s5", name: "Natalie Fournier", role: "Canoe Kids Instructor" },
  { id: "s6", name: "Tom Halvorsen", role: "Boat House Attendant" },
  { id: "s7", name: "Kaia Nguyen", role: "Boat House Attendant" },
  { id: "s8", name: "Ruby Fontaine", role: "Regatta Official" },
  { id: "s9", name: "Sam Whitfield", role: "Regatta Official" },
  { id: "s10", name: "Noor Haddad", role: "Lifeguard" },
];

export const staffById = (staff: Staff[], id: string | null) =>
  id ? (staff.find((s) => s.id === id) ?? null) : null;

/* ---------------------------------- weeks --------------------------------- */

/** yyyy-MM-dd of the Monday that starts a roster week. */
export type WeekKey = string;

export const weekStart = (date: Date) => startOfWeek(date, { weekStartsOn: 1 });
export const weekKey = (date: Date): WeekKey => format(weekStart(date), "yyyy-MM-dd");
export const parseWeek = (key: WeekKey) => {
  const [y = 2026, m = 1, d = 1] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
};

/** Summer season starts on the first Monday of July. */
export const seasonStart = (year: number) => weekStart(new Date(year, 6, 7));

export function weekNumber(monday: Date) {
  const start = seasonStart(monday.getFullYear());
  return differenceInCalendarWeeks(monday, start, { weekStartsOn: 1 }) + 1;
}

/** e.g. "Week 2: July 6 – July 10" (Monday to Friday of the camp week). */
export function weekLabel(monday: Date) {
  const range = `${format(monday, "MMMM d")} – ${format(addDays(monday, 4), "MMMM d")}`;
  const n = weekNumber(monday);
  return n >= 1 && n <= 12 ? `Week ${n}: ${range}` : `Off-season: ${range}`;
}

export const weekdays = (monday: Date) => Array.from({ length: 5 }, (_, i) => addDays(monday, i));

/* -------------------------------- roster ---------------------------------- */

export const DAY_LABELS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] as const;
export const DAY_INDEXES = [0, 1, 2, 3, 4] as const;
export type DayIndex = (typeof DAY_INDEXES)[number];

export type Assignment = {
  id: string;
  week: WeekKey;
  day: DayIndex;
  programId: ProgramId;
  staffId: string;
};

export const cellId = (week: WeekKey, programId: ProgramId, day: number) =>
  `${week}|${programId}|${day}`;

export type ProgramWeek = {
  participants: number;
  notes: string;
};

export const metaKey = (week: WeekKey, programId: ProgramId) => `${week}|${programId}`;

export function ratioLabel(participants: number, assigned: number) {
  if (assigned === 0) return participants > 0 ? "no staff assigned" : "—";
  return `${(participants / assigned).toFixed(1)} per staff`;
}

/** Seed the current and next week so the board is never empty. */
export function seedRoster(anchor: Date = new Date()) {
  const thisWeek = weekKey(anchor);
  const nextWeek = weekKey(addWeeks(anchor, 1));
  const assignments: Assignment[] = [];
  let n = 0;
  const add = (week: WeekKey, programId: ProgramId, day: DayIndex, staffId: string) =>
    assignments.push({ id: `seed-${n++}`, week, programId, day, staffId });

  const rows: Array<[ProgramId, string[]]> = [
    ["junior-racing", ["s1", "s9"]],
    ["canoe-kids", ["s3", "s5", "s10"]],
    ["youth-camps", ["s4", "s7"]],
    ["intro-to-comp", ["s2"]],
    ["opening-shift", ["s6"]],
    ["mid-day-shift", ["s7"]],
    ["closing-shift", ["s10"]],
  ];

  for (const [programId, people] of rows) {
    for (const day of [0, 1, 2, 3, 4] as DayIndex[]) {
      for (const staffId of people) {
        if (day === 4 && people.length > 2) continue;
        add(thisWeek, programId, day, staffId);
      }
    }
  }

  const programWeeks: Record<string, ProgramWeek> = {
    [metaKey(thisWeek, "junior-racing")]: {
      participants: 9,
      notes: "Sarah half days T/Th/F",
    },
    [metaKey(thisWeek, "canoe-kids")]: { participants: 14, notes: "Evan friday fill in" },
    [metaKey(thisWeek, "youth-camps")]: { participants: 18, notes: "" },
    [metaKey(thisWeek, "intro-to-comp")]: { participants: 6, notes: "Bring safety boat keys" },
    [metaKey(nextWeek, "junior-racing")]: { participants: 11, notes: "" },
    [metaKey(nextWeek, "canoe-kids")]: { participants: 16, notes: "" },
    [metaKey(nextWeek, "youth-camps")]: { participants: 15, notes: "" },
    [metaKey(nextWeek, "intro-to-comp")]: { participants: 8, notes: "" },
    [metaKey(thisWeek, "opening-shift")]: { participants: 0, notes: "Unlock boat house 7:30" },
    [metaKey(thisWeek, "mid-day-shift")]: { participants: 0, notes: "" },
    [metaKey(thisWeek, "closing-shift")]: { participants: 0, notes: "Life jackets counted nightly" },
    [metaKey(thisWeek, "weekend-operations")]: { participants: 0, notes: "Rentals only" },
  };

  return { assignments, programWeeks };
}

