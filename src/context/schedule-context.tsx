import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import {
  STAFF,
  seedShifts,
  overlaps,
  type Shift,
  type Staff,
  type BlockId,
  type ProgramId,
  blockById,
} from "@/lib/schedule-types";

type ScheduleContextValue = {
  staff: Staff[];
  shifts: Shift[];
  currentStaffId: string;
  setCurrentStaffId: (id: string) => void;
  addShift: (input: {
    date: string;
    block: BlockId;
    program: ProgramId;
    staffId: string | null;
  }) => void;
  updateShift: (id: string, patch: Partial<Omit<Shift, "id">>) => void;
  moveShift: (id: string, date: string, block: BlockId) => void;
  removeShift: (id: string) => void;
  conflictIds: Set<string>;
};

const ScheduleContext = createContext<ScheduleContextValue | null>(null);

let counter = 0;
const nextId = () => `shift-${Date.now()}-${counter++}`;

export function ScheduleProvider({ children }: { children: ReactNode }) {
  const [staff] = useState<Staff[]>(STAFF);
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
      shifts,
      currentStaffId,
      setCurrentStaffId,
      conflictIds,
      addShift: ({ date, block, program, staffId }) => {
        const b = blockById(block);
        setShifts((prev) => [
          ...prev,
          { id: nextId(), date, block, start: b.start, end: b.end, program, staffId },
        ]);
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
    };
  }, [staff, shifts, currentStaffId]);

  return <ScheduleContext.Provider value={value}>{children}</ScheduleContext.Provider>;
}

export function useSchedule() {
  const ctx = useContext(ScheduleContext);
  if (!ctx) throw new Error("useSchedule must be used inside ScheduleProvider");
  return ctx;
}
