import { useDraggable, useDroppable } from "@dnd-kit/core";
import { AlertTriangle, StickyNote, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSchedule } from "@/context/schedule-context";
import {
  blockStyle,
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
  const { programs } = useSchedule();
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `shift:${shift.id}`,
    data: { type: "shift", shiftId: shift.id },
  });
  const program = programById(programs, shift.program);
  const person = staffById(staff, shift.staffId);

  const { setNodeRef: dropRef, isOver } = useDroppable({
    id: `slot:${shift.id}`,
    data: { type: "slot", shiftId: shift.id },
    disabled: !!person,
  });

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        if (!person) dropRef(node);
      }}
      {...listeners}
      {...attributes}
      role="button"
      suppressHydrationWarning
      tabIndex={0}
      onClick={() => onOpen(shift)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          onOpen(shift);
        }
      }}
      style={blockStyle(program.color, !person)}
      className={cn(
        "w-full cursor-pointer rounded-md border px-2 py-1.5 text-left transition-shadow hover:shadow-sm",
        !person && "border-dashed",
        conflict && "ring-2 ring-destructive/60",
        isOver && "ring-2 ring-ring",
        isDragging && "opacity-40",
      )}
    >
      <div className="flex items-center gap-1">
        {!person && <UserPlus className="size-3 shrink-0 opacity-70" aria-hidden />}
        <span className={cn("truncate text-xs font-semibold", !person && "uppercase tracking-wide")}>
          {person ? person.name : "Unassigned"}
        </span>
        {conflict && <AlertTriangle className="size-3 shrink-0 text-destructive" aria-hidden />}
        {shift.note && <StickyNote className="size-3 shrink-0 opacity-70" aria-hidden />}
      </div>
      <div className="truncate text-[11px] opacity-80">
        {formatTime(shift.start)}–{formatTime(shift.end)} · {program.name}
      </div>
      {person ? (
        <div className="truncate text-[11px] opacity-70">{person.role}</div>
      ) : (
        <div className="truncate text-[11px] opacity-70">
          {shift.requiredRole ? `Needs ${shift.requiredRole}` : "Drop a staff card here"}
        </div>
      )}
    </div>
  );
}
