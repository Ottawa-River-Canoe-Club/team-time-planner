import { addDays, format, startOfWeek } from "date-fns";

export type ProgramId = "canoe-kids" | "regattas" | "boat-rentals" | "adult-masters";

export type Program = {
  id: ProgramId;
  name: string;
  /** Tailwind classes driven by semantic program tokens */
  block: string;
  chip: string;
  dot: string;
};

export const PROGRAMS: Program[] = [
  {
    id: "canoe-kids",
    name: "Canoe Kids Camp",
    block: "bg-program-kids/12 border-program-kids/45 text-program-kids-ink",
    chip: "bg-program-kids/15 text-program-kids-ink",
    dot: "bg-program-kids",
  },
  {
    id: "regattas",
    name: "Regattas",
    block: "bg-program-regatta/12 border-program-regatta/45 text-program-regatta-ink",
    chip: "bg-program-regatta/15 text-program-regatta-ink",
    dot: "bg-program-regatta",
  },
  {
    id: "boat-rentals",
    name: "Boat Rentals",
    block: "bg-program-rentals/12 border-program-rentals/45 text-program-rentals-ink",
    chip: "bg-program-rentals/15 text-program-rentals-ink",
    dot: "bg-program-rentals",
  },
  {
    id: "adult-masters",
    name: "Adult Masters",
    block: "bg-program-masters/12 border-program-masters/45 text-program-masters-ink",
    chip: "bg-program-masters/15 text-program-masters-ink",
    dot: "bg-program-masters",
  },
];

export const programById = (id: ProgramId): Program =>
  PROGRAMS.find((p) => p.id === id) ?? (PROGRAMS[0] as Program);

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

export type BlockId = "early" | "morning" | "afternoon" | "evening";

export type TimeBlock = {
  id: BlockId;
  label: string;
  hint: string;
  start: string;
  end: string;
};

export const TIME_BLOCKS: TimeBlock[] = [
  { id: "early", label: "Early", hint: "6:00 – 9:00", start: "06:00", end: "09:00" },
  { id: "morning", label: "Morning", hint: "9:00 – 12:00", start: "09:00", end: "12:00" },
  { id: "afternoon", label: "Afternoon", hint: "12:00 – 17:00", start: "12:00", end: "17:00" },
  { id: "evening", label: "Evening", hint: "17:00 – 21:00", start: "17:00", end: "21:00" },
];

export const blockById = (id: BlockId): TimeBlock =>
  TIME_BLOCKS.find((b) => b.id === id) ?? (TIME_BLOCKS[0] as TimeBlock);

export type Shift = {
  id: string;
  date: string; // yyyy-MM-dd
  block: BlockId;
  start: string; // HH:mm
  end: string; // HH:mm
  program: ProgramId;
  staffId: string | null;
  note?: string | undefined;
};

export const STAFF: Staff[] = [
  { id: "s1", name: "Ariane Boucher", role: "Head Coach" },
  { id: "s2", name: "Devon Clarke", role: "Head Coach" },
  { id: "s3", name: "Priya Raman", role: "Canoe Kids Instructor" },
  { id: "s4", name: "Marc Lévesque", role: "Canoe Kids Instructor" },
  { id: "s5", name: "Jess Okonkwo", role: "Canoe Kids Instructor" },
  { id: "s6", name: "Tom Halvorsen", role: "Boat House Attendant" },
  { id: "s7", name: "Kaia Nguyen", role: "Boat House Attendant" },
  { id: "s8", name: "Ruby Fontaine", role: "Regatta Official" },
  { id: "s9", name: "Sam Whitfield", role: "Regatta Official" },
  { id: "s10", name: "Noor Haddad", role: "Lifeguard" },
];

export const staffById = (staff: Staff[], id: string | null) =>
  id ? (staff.find((s) => s.id === id) ?? null) : null;

export const weekStart = (date: Date) => startOfWeek(date, { weekStartsOn: 1 });

export const weekDays = (start: Date) => Array.from({ length: 7 }, (_, i) => addDays(start, i));

export const dateKey = (d: Date) => format(d, "yyyy-MM-dd");

export function toMinutes(time: string) {
  const [h = 0, m = 0] = time.split(":").map(Number);
  return h * 60 + m;
}

export function formatTime(time: string) {
  const [h = 0, m = 0] = time.split(":").map(Number);
  const suffix = h >= 12 ? "pm" : "am";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${hour}${suffix}` : `${hour}:${String(m).padStart(2, "0")}${suffix}`;
}

export function overlaps(a: Shift, b: Shift) {
  if (a.date !== b.date) return false;
  return toMinutes(a.start) < toMinutes(b.end) && toMinutes(b.start) < toMinutes(a.end);
}

/** Seed a realistic week of shifts anchored to the current Monday. */
export function seedShifts(anchor: Date = new Date()): Shift[] {
  const start = weekStart(anchor);
  const d = (i: number) => dateKey(addDays(start, i));
  const rows: Array<[number, BlockId, ProgramId, string | null, string?]> = [
    [0, "morning", "canoe-kids", "s3", "Bring safety boat keys"],
    [0, "morning", "canoe-kids", "s4"],
    [0, "afternoon", "boat-rentals", "s6"],
    [0, "evening", "adult-masters", "s1"],
    [1, "early", "adult-masters", "s2", "Open the gate at 5:45"],
    [1, "morning", "canoe-kids", "s5"],
    [1, "afternoon", "boat-rentals", "s7"],
    [1, "afternoon", "canoe-kids", null],
    [2, "morning", "canoe-kids", "s3"],
    [2, "afternoon", "boat-rentals", "s6"],
    [2, "evening", "adult-masters", "s1"],
    [3, "early", "adult-masters", "s2"],
    [3, "morning", "canoe-kids", "s4"],
    [3, "afternoon", "boat-rentals", null],
    [4, "morning", "canoe-kids", "s5"],
    [4, "afternoon", "boat-rentals", "s7"],
    [4, "evening", "regattas", "s8", "Set course buoys for Saturday"],
    [5, "early", "regattas", "s8"],
    [5, "morning", "regattas", "s9"],
    [5, "morning", "regattas", "s10", "Safety boat on the water all morning"],
    [5, "afternoon", "boat-rentals", "s6"],
    [6, "morning", "boat-rentals", "s7"],
    [6, "afternoon", "adult-masters", "s1"],
    [6, "afternoon", "boat-rentals", null],
  ];

  return rows.map(([day, block, program, staffId, note], i) => {
    const b = blockById(block);
    return {
      id: `seed-${i}`,
      date: d(day),
      block,
      start: b.start,
      end: b.end,
      program,
      staffId,
      note,
    };
  });
}
