import { useDraggable } from "@dnd-kit/core";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Staff } from "@/lib/schedule-types";

export function StaffCard({ staff, shiftCount }: { staff: Staff; shiftCount: number }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `staff:${staff.id}`,
    data: { type: "staff", staffId: staff.id },
  });

  return (
    <button
      ref={setNodeRef}
      type="button"
      suppressHydrationWarning
      {...listeners}
      {...attributes}
      className={cn(
        "flex w-full cursor-grab items-center gap-2 rounded-md border border-border bg-card px-2.5 py-2 text-left transition-colors hover:border-ring hover:bg-accent active:cursor-grabbing",
        isDragging && "opacity-40",
      )}
    >
      <GripVertical className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-foreground">{staff.name}</span>
        <span className="block truncate text-xs text-muted-foreground">{staff.role}</span>
      </span>
      <span className="shrink-0 rounded border border-border px-1.5 py-0.5 text-[11px] tabular-nums text-muted-foreground">
        {shiftCount}
      </span>
    </button>
  );
}
