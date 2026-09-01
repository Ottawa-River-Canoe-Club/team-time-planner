import { useDroppable } from "@dnd-kit/core";
import { AlertTriangle, UserPlus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  blockStyle,
  cellId,
  staffById,
  type Assignment,
  type DayIndex,
  type ProgramId,
  type Staff,
  type WeekKey,
} from "@/lib/schedule-types";

export function DayCell({
  week,
  programId,
  day,
  assignments,
  staff,
  color,
  doubleBookedIds,
  onRemove,
}: {
  week: WeekKey;
  programId: ProgramId;
  day: DayIndex;
  assignments: Assignment[];
  staff: Staff[];
  color: string;
  doubleBookedIds: Set<string>;
  onRemove: (id: string) => void;
}) {
  const id = cellId(week, programId, day);
  const { setNodeRef, isOver } = useDroppable({
    id: `cell:${id}`,
    data: { type: "cell", week, programId, day },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "group/cell flex min-h-20 flex-col gap-1 border-b border-r border-border p-1.5 transition-colors",
        isOver && "bg-accent ring-2 ring-inset ring-ring",
      )}
    >
      {assignments.map((a) => {
        const person = staffById(staff, a.staffId);
        if (!person) return null;
        const conflict = doubleBookedIds.has(a.id);
        return (
          <div
            key={a.id}
            style={blockStyle(color)}
            className={cn(
              "flex items-center gap-1 rounded-md border px-1.5 py-1",
              conflict && "border-destructive",
            )}
          >
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-semibold leading-tight">
                {person.name}
              </span>
              <span className="block truncate text-[10px] leading-tight opacity-80">
                {person.role}
              </span>
            </span>
            {conflict && (
              <AlertTriangle
                className="size-3.5 shrink-0 text-destructive"
                aria-label="Double booked"
              />
            )}
            <button
              type="button"
              onClick={() => onRemove(a.id)}
              aria-label={`Remove ${person.name}`}
              className="shrink-0 rounded p-0.5 opacity-0 transition-opacity hover:text-destructive focus-visible:opacity-100 group-hover/cell:opacity-100"
            >
              <X className="size-3.5" />
            </button>
          </div>
        );
      })}

      {assignments.length === 0 && (
        <div
          style={blockStyle(color, true)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-dashed px-2 py-2 text-[11px] font-medium"
        >
          <UserPlus className="size-3.5 shrink-0" aria-hidden />
          Drop staff
        </div>
      )}
    </div>
  );
}
