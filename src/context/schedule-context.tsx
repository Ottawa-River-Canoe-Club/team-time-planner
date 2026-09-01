import { createContext, useContext } from "react";
import type {
  Program,
  ProgramId,
  ProgramWeek,
  RoleSlot,
  Staff,
  WeekKey,
} from "@/lib/schedule-types";

export type ScheduleContextValue = {
  staff: Staff[];
  programs: Program[];
  slots: RoleSlot[];
  programWeeks: Record<string, ProgramWeek>;
  currentStaffId: string;
  setCurrentStaffId: (id: string) => void;
  /** Slot ids where the same person is booked twice in one week. */
  doubleBookedIds: Set<string>;
  addSlot: (week: WeekKey, programId: ProgramId, label: string) => void;
  updateSlot: (id: string, patch: Partial<Omit<RoleSlot, "id">>) => void;
  removeSlot: (id: string) => void;
  assignSlot: (id: string, staffId: string | null) => void;
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
