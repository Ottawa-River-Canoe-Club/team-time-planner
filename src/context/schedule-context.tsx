import { createContext, useContext } from "react";
import type {
  Assignment,
  DayIndex,
  Program,
  ProgramId,
  ProgramWeek,
  Staff,
  WeekKey,
} from "@/lib/schedule-types";

export type ScheduleContextValue = {
  staff: Staff[];
  programs: Program[];
  assignments: Assignment[];
  programWeeks: Record<string, ProgramWeek>;
  currentStaffId: string;
  setCurrentStaffId: (id: string) => void;
  /** Currently selected schedule type (operational area) */
  activeTypeId: string;
  setActiveTypeId: (id: string) => void;
  /** Assignment ids where the same person is booked twice on the same day. */
  doubleBookedIds: Set<string>;
  addAssignment: (week: WeekKey, programId: ProgramId, day: DayIndex, staffId: string) => boolean;
  removeAssignment: (id: string) => void;
  /** Clear all assignments (and notes/participants) for one week. */
  clearWeek: (week: WeekKey) => void;
  /** Clear the entire schedule across every week. */
  clearAll: () => void;
  setParticipants: (week: WeekKey, programId: ProgramId, participants: number) => void;
  setNotes: (week: WeekKey, programId: ProgramId, notes: string) => void;
  addProgram: (program: Program) => void;
  updateProgram: (id: ProgramId, patch: Partial<Omit<Program, "id">>) => void;
  removeProgram: (id: ProgramId) => void;
};

export const ScheduleContext = createContext<ScheduleContextValue | null>(null);

export function useSchedule() {
  const ctx = useContext(ScheduleContext);
  if (!ctx) throw new Error("useSchedule must be used inside ScheduleProvider");
  return ctx;
}
