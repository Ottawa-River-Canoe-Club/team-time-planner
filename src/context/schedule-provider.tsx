import { useMemo, useState, type ReactNode } from "react";
import { ScheduleContext, type ScheduleContextValue } from "./schedule-context";
import {
  DEFAULT_PROGRAMS,
  STAFF,
  blockById,
  overlaps,
  seedShifts,
  type Program,
  type Shift,
  type Staff,
} from "@/lib/schedule-types";

let counter = 0;
const nextId = () => `shift-${Date.now()}-${counter++}`;

export function ScheduleProvider({ children }: { children: ReactNode }) {
  const [staff] = useState<Staff[]>(STAFF);
  const [programs, setPrograms] = useState<Program[]>(DEFAULT_PROGRAMS);
  const [shifts, setShifts] = useState<Shift[]>(() => seedShifts());
  const [currentStaffId, setCurrentStaffId] = useState<string>(STAFF[2]?.id ?? "");

  const value = useMemo<ScheduleContextValue>(() => {
    const conflictIds = new Set<string>();
    for (let i = 0; i < shifts.length; i++) {
      for (let j = i + 1; j < shifts.length; j++) {
        const a = shifts[i];
        const b = shifts[j];
        if (a && b && a.staffId && a.staffId === b.staffId && overlaps(a, b)) {
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
        const timeBlock = blockById(block);
        const created: Shift[] = Array.from({ length: Math.max(1, quantity) }, () => ({
          id: nextId(),
          date,
          block,
          start: start ?? timeBlock.start,
          end: end ?? timeBlock.end,
          program,
          staffId,
          requiredRole: requiredRole ?? null,
        }));
        setShifts((previous) => [...previous, ...created]);
      },
      updateShift: (id, patch) =>
        setShifts((previous) =>
          previous.map((shift) => (shift.id === id ? { ...shift, ...patch } : shift)),
        ),
      moveShift: (id, date, block) =>
        setShifts((previous) =>
          previous.map((shift) => {
            if (shift.id !== id) return shift;
            if (shift.block === block) return { ...shift, date };
            const timeBlock = blockById(block);
            return { ...shift, date, block, start: timeBlock.start, end: timeBlock.end };
          }),
        ),
      removeShift: (id) =>
        setShifts((previous) => previous.filter((shift) => shift.id !== id)),
      addProgram: (program) => setPrograms((previous) => [...previous, program]),
      updateProgram: (id, patch) =>
        setPrograms((previous) =>
          previous.map((program) => (program.id === id ? { ...program, ...patch } : program)),
        ),
      removeProgram: (id) => {
        setPrograms((previous) => previous.filter((program) => program.id !== id));
        setShifts((previous) => previous.filter((shift) => shift.program !== id));
      },
    };
  }, [staff, programs, shifts, currentStaffId]);

  return <ScheduleContext.Provider value={value}>{children}</ScheduleContext.Provider>;
}