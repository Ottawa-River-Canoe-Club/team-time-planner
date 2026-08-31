import { createContext, useContext } from "react";
import type {
  BlockId,
  Program,
  ProgramId,
  Shift,
  Staff,
  StaffRole,
} from "@/lib/schedule-types";

export type ScheduleContextValue = {
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

export const ScheduleContext = createContext<ScheduleContextValue | null>(null);

export function useSchedule() {
  const ctx = useContext(ScheduleContext);
  if (!ctx) throw new Error("useSchedule must be used inside ScheduleProvider");
  return ctx;
}
