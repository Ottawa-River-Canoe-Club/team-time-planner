import { useDroppable } from "@dnd-kit/core";
import { format, isSameDay, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { ShiftBlock } from "./shift-block";
import {
  TIME_BLOCKS,
  dateKey,
  type BlockId,
  type Shift,
  type Staff,
} from "@/lib/schedule-types";

function Cell({
  day,
  block,
  shifts,
  staff,
  conflictIds,
  onOpen,
}: {
  day: Date;
  block: BlockId;
  shifts: Shift[];
  staff: Staff[];
  conflictIds: Set<string>;
  onOpen: (shift: Shift) => void;
}) {
  const id = `cell:${dateKey(day)}:${block}`;
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: { type: "cell", date: dateKey(day), block },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "min-h-24 space-y-1.5 border-b border-r border-border p-1.5 transition-colors",
        isOver && "bg-accent ring-2 ring-inset ring-ring",
      )}
    >
      {shifts.map((s) => (
        <ShiftBlock
          key={s.id}
          shift={s}
          staff={staff}
          conflict={conflictIds.has(s.id)}
          onOpen={onOpen}
        />
      ))}
      {shifts.length === 0 && (
        <div
          className={cn(
            "flex h-full min-h-20 items-center justify-center rounded-md border border-dashed border-border text-[11px] text-muted-foreground/70",
            isOver && "border-ring text-foreground",
          )}
        >
          Drop staff
        </div>
      )}
    </div>
  );
}

export function WeekGrid({
  days,
  shifts,
  staff,
  conflictIds,
  onOpen,
}: {
  days: Date[];
  shifts: Shift[];
  staff: Staff[];
  conflictIds: Set<string>;
  onOpen: (shift: Shift) => void;
}) {
  const today = new Date();

  return (
    <div className="min-w-[54rem] overflow-hidden rounded-lg border border-border bg-card">
      <div className="grid grid-cols-[5.5rem_repeat(7,minmax(0,1fr))]">
        <div className="border-b border-r border-border bg-muted/50 p-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Block
        </div>
        {days.map((d) => {
          const count = shifts.filter(
            (s) => s.date === dateKey(d) && s.staffId,
          ).length;
          return (
            <div
              key={d.toISOString()}
              className={cn(
                "border-b border-r border-border bg-muted/50 p-2",
                isSameDay(d, today) && "bg-primary/8",
              )}
            >
              <div className="flex items-baseline justify-between gap-1">
                <span className="text-sm font-semibold text-foreground">{format(d, "EEE")}</span>
                <span className="text-xs text-muted-foreground">{format(d, "MMM d")}</span>
              </div>
              <div className="mt-0.5 text-[11px] text-muted-foreground">
                {count} staff assigned
              </div>
            </div>
          );
        })}

        {TIME_BLOCKS.map((b) => (
          <div key={b.id} className="contents">
            <div className="border-b border-r border-border bg-muted/30 p-2">
              <div className="text-xs font-semibold text-foreground">{b.label}</div>
              <div className="text-[11px] text-muted-foreground">{b.hint}</div>
            </div>
            {days.map((d) => (
              <Cell
                key={`${b.id}-${d.toISOString()}`}
                day={d}
                block={b.id}
                staff={staff}
                conflictIds={conflictIds}
                onOpen={onOpen}
                shifts={shifts.filter(
                  (s) => s.date === dateKey(d) && s.block === b.id,
                )}
              />
            ))}
          </div>
        ))}
      </div>
      <p className="sr-only">
        {shifts.length} shifts scheduled between {format(days[0] ?? today, "PPP")} and{" "}
        {format(days[days.length - 1] ?? today, "PPP")}
      </p>
      <span className="hidden">{parseISO(dateKey(today)).getTime()}</span>
    </div>
  );
}
