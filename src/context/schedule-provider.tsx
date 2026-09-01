import { useMemo, useState, type ReactNode } from "react";
import { ScheduleContext, type ScheduleContextValue } from "./schedule-context";
import {
  DEFAULT_PROGRAMS,
  STAFF,
  metaKey,
  seedRoster,
  type Assignment,
  type Program,
  type ProgramWeek,
  type Staff,
} from "@/lib/schedule-types";

let counter = 0;
const nextId = () => `a-${Date.now()}-${counter++}`;

export function ScheduleProvider({ children }: { children: ReactNode }) {
  const seed = useMemo(() => seedRoster(), []);
  const [staff] = useState<Staff[]>(STAFF);
  const [programs, setPrograms] = useState<Program[]>(DEFAULT_PROGRAMS);
  const [assignments, setAssignments] = useState<Assignment[]>(seed.assignments);
  const [programWeeks, setProgramWeeks] = useState<Record<string, ProgramWeek>>(seed.programWeeks);
  const [currentStaffId, setCurrentStaffId] = useState<string>(STAFF[4]?.id ?? "");
  const [activeTypeId, setActiveTypeId] = useState<string>(SCHEDULE_TYPES[0]?.id ?? "camp");

  const value = useMemo<ScheduleContextValue>(() => {
    const seen = new Map<string, string[]>();
    for (const a of assignments) {
      const key = `${a.week}|${a.day}|${a.staffId}`;
      seen.set(key, [...(seen.get(key) ?? []), a.id]);
    }
    const doubleBookedIds = new Set<string>();
    for (const ids of seen.values()) {
      if (ids.length > 1) ids.forEach((id) => doubleBookedIds.add(id));
    }

    const patchMeta = (week: string, programId: string, patch: Partial<ProgramWeek>) =>
      setProgramWeeks((previous) => {
        const key = metaKey(week, programId);
        const current = previous[key] ?? { participants: 0, notes: "" };
        return { ...previous, [key]: { ...current, ...patch } };
      });

    return {
      staff,
      programs,
      assignments,
      programWeeks,
      currentStaffId,
      setCurrentStaffId,
      doubleBookedIds,
      addAssignment: (week, programId, day, staffId) => {
        const exists = assignments.some(
          (a) =>
            a.week === week && a.programId === programId && a.day === day && a.staffId === staffId,
        );
        if (exists) return false;
        setAssignments((previous) => [
          ...previous,
          { id: nextId(), week, programId, day, staffId },
        ]);
        return true;
      },
      removeAssignment: (id) => setAssignments((previous) => previous.filter((a) => a.id !== id)),
      clearWeek: (week) => {
        setAssignments((previous) => previous.filter((a) => a.week !== week));
        setProgramWeeks((previous) =>
          Object.fromEntries(Object.entries(previous).filter(([key]) => !key.startsWith(`${week}|`))),
        );
      },
      clearAll: () => {
        setAssignments([]);
        setProgramWeeks({});
      },
      setParticipants: (week, programId, participants) =>
        patchMeta(week, programId, { participants }),
      setNotes: (week, programId, notes) => patchMeta(week, programId, { notes }),
      addProgram: (program) => setPrograms((previous) => [...previous, program]),
      updateProgram: (id, patch) =>
        setPrograms((previous) => previous.map((p) => (p.id === id ? { ...p, ...patch } : p))),
      removeProgram: (id) => {
        setPrograms((previous) => previous.filter((p) => p.id !== id));
        setAssignments((previous) => previous.filter((a) => a.programId !== id));
      },
    };
  }, [staff, programs, assignments, programWeeks, currentStaffId]);

  return <ScheduleContext.Provider value={value}>{children}</ScheduleContext.Provider>;
}
