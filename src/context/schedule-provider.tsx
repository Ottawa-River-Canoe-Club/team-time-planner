import { useMemo, useState, type ReactNode } from "react";
import { ScheduleContext, type ScheduleContextValue } from "./schedule-context";
import {
  DEFAULT_PROGRAMS,
  STAFF,
  metaKey,
  seedRoster,
  type Program,
  type ProgramWeek,
  type RoleSlot,
  type Staff,
} from "@/lib/schedule-types";

let counter = 0;
const nextId = () => `slot-${Date.now()}-${counter++}`;

export function ScheduleProvider({ children }: { children: ReactNode }) {
  const seed = useMemo(() => seedRoster(), []);
  const [staff] = useState<Staff[]>(STAFF);
  const [programs, setPrograms] = useState<Program[]>(DEFAULT_PROGRAMS);
  const [slots, setSlots] = useState<RoleSlot[]>(seed.slots);
  const [programWeeks, setProgramWeeks] = useState<Record<string, ProgramWeek>>(seed.programWeeks);
  const [currentStaffId, setCurrentStaffId] = useState<string>(STAFF[4]?.id ?? "");

  const value = useMemo<ScheduleContextValue>(() => {
    const seen = new Map<string, string[]>();
    for (const slot of slots) {
      if (!slot.staffId) continue;
      const key = `${slot.week}|${slot.staffId}`;
      seen.set(key, [...(seen.get(key) ?? []), slot.id]);
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
      slots,
      programWeeks,
      currentStaffId,
      setCurrentStaffId,
      doubleBookedIds,
      addSlot: (week, programId, label) =>
        setSlots((previous) => [
          ...previous,
          { id: nextId(), week, programId, label, staffId: null },
        ]),
      updateSlot: (id, patch) =>
        setSlots((previous) => previous.map((s) => (s.id === id ? { ...s, ...patch } : s))),
      removeSlot: (id) => setSlots((previous) => previous.filter((s) => s.id !== id)),
      assignSlot: (id, staffId) =>
        setSlots((previous) => previous.map((s) => (s.id === id ? { ...s, staffId } : s))),
      setParticipants: (week, programId, participants) =>
        patchMeta(week, programId, { participants }),
      setNotes: (week, programId, notes) => patchMeta(week, programId, { notes }),
      addProgram: (program) => setPrograms((previous) => [...previous, program]),
      updateProgram: (id, patch) =>
        setPrograms((previous) => previous.map((p) => (p.id === id ? { ...p, ...patch } : p))),
      removeProgram: (id) => {
        setPrograms((previous) => previous.filter((p) => p.id !== id));
        setSlots((previous) => previous.filter((s) => s.programId !== id));
      },
    };
  }, [staff, programs, slots, programWeeks, currentStaffId]);

  return <ScheduleContext.Provider value={value}>{children}</ScheduleContext.Provider>;
}
