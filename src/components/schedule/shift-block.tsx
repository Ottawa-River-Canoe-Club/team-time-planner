import { useDraggable } from "@dnd-kit/core";
import { AlertTriangle, StickyNote } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  formatTime,
  programById,
  staffById,
  type Shift,
  type Staff,
} from "@/lib/schedule-types";

export function ShiftBlock({
  shift,
  staff,
  conflict,
  onOpen,
}: {
  shift: Shift;
  staff: Staff[];
  conflict: boolean;
  onOpen: (shift: Shift) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `shift:${shift.id}`,
    data: { type: "shift", shiftId: shift.id },
  });
  const program = programById(shift.program);
  const person = staffById(staff, shift.staffId);

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      role="button"
      tabIndex={0}
      onClick={() => onOpen(shift)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          onOpen(shift);
        }
      }}
      className={cn(
        "w-full cursor-pointer rounded-md border px-2 py-1.5 text-left transition-shadow hover:shadow-sm",
        program.block,
        !person && "border-dashed",
        conflict && "ring-2 ring-destructive/60",
        isDragging && "opacity-40",
      )}
    >
      <div className="flex items-center gap-1">
        <span className="truncate text-xs font-semibold">
          {person ? person.name : "Unassigned"}
        </span>
        {conflict && <AlertTriangle className="size-3 shrink-0 text-destructive" aria-hidden />}
        {shift.note && <StickyNote className="size-3 shrink-0 opacity-70" aria-hidden />}
      </div>
      <div className="truncate text-[11px] opacity-80">
        {formatTime(shift.start)}–{formatTime(shift.end)} · {program.name}
      </div>
      {person && <div className="truncate text-[11px] opacity-70">{person.role}</div>}
    </div>
  );
}
