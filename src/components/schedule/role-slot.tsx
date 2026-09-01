import { useDroppable } from "@dnd-kit/core";
import { AlertTriangle, UserPlus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { blockStyle, staffById, type RoleSlot, type Staff } from "@/lib/schedule-types";

export function RoleSlotCell({
  slot,
  staff,
  color,
  conflict,
  onClear,
  onRename,
  onRemove,
}: {
  slot: RoleSlot;
  staff: Staff[];
  color: string;
  conflict: boolean;
  onClear: () => void;
  onRename: (label: string) => void;
  onRemove: () => void;
}) {
  const person = staffById(staff, slot.staffId);
  const { setNodeRef, isOver } = useDroppable({
    id: `slot:${slot.id}`,
    data: { type: "slot", slotId: slot.id },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "group/slot relative flex min-h-16 flex-col justify-center gap-0.5 border-r border-border px-2 py-1.5 transition-colors",
        isOver && "bg-accent ring-2 ring-inset ring-ring",
      )}
    >
      <div className="flex items-center gap-1">
        <input
          value={slot.label}
          onChange={(e) => onRename(e.target.value)}
          aria-label="Role name"
          className="w-full min-w-0 bg-transparent text-[10px] font-medium uppercase tracking-wide text-muted-foreground outline-none focus:text-foreground"
        />
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${slot.label} slot`}
          className="shrink-0 rounded p-0.5 text-muted-foreground/60 opacity-0 transition-opacity hover:text-destructive group-hover/slot:opacity-100"
        >
          <X className="size-3" />
        </button>
      </div>

      {person ? (
        <div
          style={blockStyle(color)}
          className={cn(
            "flex items-center gap-1 rounded-md border px-2 py-1",
            conflict && "border-destructive",
          )}
        >
          <span className="min-w-0 flex-1">
            <span className="block truncate text-xs font-semibold">{person.name}</span>
            <span className="block truncate text-[10px] opacity-80">{person.role}</span>
          </span>
          {conflict && (
            <AlertTriangle className="size-3.5 shrink-0 text-destructive" aria-label="Double booked" />
          )}
          <button
            type="button"
            onClick={onClear}
            aria-label={`Clear ${person.name} from ${slot.label}`}
            className="shrink-0 rounded p-0.5 opacity-0 transition-opacity hover:text-destructive group-hover/slot:opacity-100"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ) : (
        <div
          style={blockStyle(color, true)}
          className="flex items-center gap-1.5 rounded-md border border-dashed px-2 py-1.5 text-[11px] font-medium"
        >
          <UserPlus className="size-3.5 shrink-0" aria-hidden />
          Unassigned
        </div>
      )}
    </div>
  );
}
