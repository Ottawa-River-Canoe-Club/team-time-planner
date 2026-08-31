import { createContext, useContext, useMemo, useState, type Context, type ReactNode } from "react";
import {
  DEFAULT_PROGRAMS,
  STAFF,
  seedShifts,
  overlaps,
  type Program,
  type Shift,
  type Staff,
  type StaffRole,
  type BlockId,
  type ProgramId,
  blockById,
} from "@/lib/schedule-types";

type ScheduleContextValue = {
  staff: Staff[];
  programs: Program[];
  shifts: Shift[];
  currentStaffId: string;
  setCurrentStaffId: (id: string) => void;
  addShift: (input: {
    date: string;
    block: BlockId;
    program: ProgramId;
    staffId: string | null;
    start?: string;
    end?: string;
    requiredRole?: StaffRole | null;
    quantity?: number;
  }) => void;
  updateShift: (id: string, patch: Partial<Omit<Shift, "id">>) => void;
  moveShift: (id: string, date: string, block: BlockId) => void;
  removeShift: (id: string) => void;
  addProgram: (program: Program) => void;
  updateProgram: (id: ProgramId, patch: Partial<Omit<Program, "id">>) => void;
  removeProgram: (id: ProgramId) => void;
  conflictIds: Set<string>;
};

/**
 * Cached on globalThis so hot-module reloads reuse the same context object.
 * Without this, an HMR update can leave provider and consumer holding two
 * different context instances → "useSchedule must be used inside ScheduleProvider".
 */
const globalRef = globalThis as typeof globalThis & {
  __scheduleContext?: React.Context<ScheduleContextValue | null>;
};
const ScheduleContext =
  globalRef.__scheduleContext ??
  (globalRef.__scheduleContext = createContext<ScheduleContextValue | null>(null));

let counter = 0;
const nextId = () => `shift-${Date.now()}-${counter++}`;

export function ScheduleProvider({ children }: { children: ReactNode }) {
  const [staff] = useState<Staff[]>(STAFF);
  const [programs, setPrograms] = useState<Program[]>(DEFAULT_PROGRAMS);
  const [shifts, setShifts] = useState<Shift[]>(() => seedShifts());
  const [currentStaffId, setCurrentStaffId] = useState<string>(STAFF[2]!.id);

  const value = useMemo<ScheduleContextValue>(() => {
    const conflictIds = new Set<string>();
    for (let i = 0; i < shifts.length; i++) {
      for (let j = i + 1; j < shifts.length; j++) {
        const a = shifts[i]!;
        const b = shifts[j]!;
        if (a.staffId && a.staffId === b.staffId && overlaps(a, b)) {
          conflictIds.add(a.id);
          conflictIds.add(b.id);
        }
      }
    }

    return {
      staff,
      programs,
      shifts,
      currentStaffId,
      setCurrentStaffId,
      conflictIds,
      addShift: ({ date, block, program, staffId, start, end, requiredRole, quantity = 1 }) => {
        const b = blockById(block);
        const created: Shift[] = Array.from({ length: Math.max(1, quantity) }, () => ({
          id: nextId(),
          date,
          block,
          start: start ?? b.start,
          end: end ?? b.end,
          program,
          staffId,
          requiredRole: requiredRole ?? null,
        }));
        setShifts((prev) => [...prev, ...created]);
      },
      updateShift: (id, patch) =>
        setShifts((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s))),
      moveShift: (id, date, block) =>
        setShifts((prev) =>
          prev.map((s) => {
            if (s.id !== id) return s;
            if (s.block === block) return { ...s, date };
            const b = blockById(block);
            return { ...s, date, block, start: b.start, end: b.end };
          }),
        ),
      removeShift: (id) => setShifts((prev) => prev.filter((s) => s.id !== id)),
      addProgram: (program) => setPrograms((prev) => [...prev, program]),
      updateProgram: (id, patch) =>
        setPrograms((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p))),
      removeProgram: (id) => {
        setPrograms((prev) => prev.filter((p) => p.id !== id));
        setShifts((prev) => prev.filter((s) => s.program !== id));
      },
    };
  }, [staff, programs, shifts, currentStaffId]);

  return <ScheduleContext.Provider value={value}>{children}</ScheduleContext.Provider>;
}

export function useSchedule() {
  const ctx = useContext(ScheduleContext);
  if (!ctx) throw new Error("useSchedule must be used inside ScheduleProvider");
  return ctx;
}
