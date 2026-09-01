import { useMemo, useState, type ReactNode } from "react";
import { ScheduleContext, type ScheduleContextValue } from "./schedule-context";
import {
  DEFAULT_PROGRAMS,
  DEFAULT_SCHEDULE_TYPES,
  STAFF,
  metaKey,
  seedRoster,
  slugify,
  type Assignment,
  type Program,
  type ProgramWeek,
  type ScheduleType,
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
  const [scheduleTypes, setScheduleTypes] = useState<ScheduleType[]>(DEFAULT_SCHEDULE_TYPES);
  const [activeTypeId, setActiveTypeId] = useState<string>(
    DEFAULT_SCHEDULE_TYPES[0]?.id ?? "camp",
  );

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
      scheduleTypes,
      addScheduleType: (name, dayCount = 7) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        let id = slugify(trimmed);
        while (scheduleTypes.some((t) => t.id === id)) id = `${id}-1`;
        setScheduleTypes((previous) => [...previous, { id, name: trimmed, dayCount }]);
        setActiveTypeId(id);
      },
      updateScheduleType: (id, patch) =>
        setScheduleTypes((previous) => previous.map((t) => (t.id === id ? { ...t, ...patch } : t))),
      removeScheduleType: (id) => {
        const removedPrograms = programs.filter((p) => p.typeId === id).map((p) => p.id);
        setScheduleTypes((previous) => {
          const next = previous.filter((t) => t.id !== id);
          setActiveTypeId((current) => (current === id ? (next[0]?.id ?? "") : current));
          return next;
        });
        setPrograms((previous) => previous.filter((p) => p.typeId !== id));
        setAssignments((previous) => previous.filter((a) => !removedPrograms.includes(a.programId)));
      },
      activeTypeId,
      setActiveTypeId,
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
  }, [staff, programs, scheduleTypes, assignments, programWeeks, currentStaffId, activeTypeId]);

  return <ScheduleContext.Provider value={value}>{children}</ScheduleContext.Provider>;
}
