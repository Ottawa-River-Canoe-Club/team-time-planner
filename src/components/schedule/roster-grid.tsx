import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useSchedule } from "@/context/schedule-context";
import { RoleSlotCell } from "./role-slot";
import {
  metaKey,
  ratioLabel,
  type Program,
  type RoleSlot,
  type WeekKey,
} from "@/lib/schedule-types";

const MAX_COLUMNS = 4;

function ProgramRow({ program, week, slots }: { program: Program; week: WeekKey; slots: RoleSlot[] }) {
  const {
    staff,
    programWeeks,
    doubleBookedIds,
    addSlot,
    updateSlot,
    removeSlot,
    assignSlot,
    setParticipants,
    setNotes,
  } = useSchedule();

  const meta = programWeeks[metaKey(week, program.id)] ?? { participants: 0, notes: "" };
  const assigned = slots.filter((s) => s.staffId).length;
  const ratio = ratioLabel(meta.participants, assigned);
  const heavy = assigned > 0 && meta.participants / assigned > 8;

  return (
    <div className="contents">
      <div className="border-b border-r border-border p-2.5">
        <div className="flex items-center gap-2">
          <span
            className="size-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: program.color }}
            aria-hidden
          />
          <span className="truncate text-sm font-semibold text-foreground">{program.name}</span>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <label
            htmlFor={`participants-${program.id}`}
            className="text-[11px] font-medium text-muted-foreground"
          >
            {program.short}:
          </label>
          <Input
            id={`participants-${program.id}`}
            type="number"
            min={0}
            value={meta.participants}
            onChange={(e) => setParticipants(week, program.id, Number(e.target.value) || 0)}
            className="h-7 w-16 px-2 text-xs tabular-nums"
            aria-label={`${program.name} expected participants`}
          />
        </div>
        <p
          className={cn(
            "mt-1.5 text-[11px] text-muted-foreground",
            heavy && "font-medium text-destructive",
          )}
        >
          {assigned} staff · {ratio}
        </p>
      </div>

      {Array.from({ length: MAX_COLUMNS }, (_, i) => {
        const slot = slots[i];
        if (slot) {
          return (
            <RoleSlotCell
              key={slot.id}
              slot={slot}
              staff={staff}
              color={program.color}
              conflict={doubleBookedIds.has(slot.id)}
              onClear={() => assignSlot(slot.id, null)}
              onRename={(label) => updateSlot(slot.id, { label })}
              onRemove={() => removeSlot(slot.id)}
            />
          );
        }
        return (
          <div
            key={`empty-${program.id}-${i}`}
            className="flex items-center justify-center border-b border-r border-border p-2"
          >
            {i === slots.length && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-[11px] text-muted-foreground"
                onClick={() => addSlot(week, program.id, "Role")}
              >
                <Plus className="size-3" /> Add role slot
              </Button>
            )}
          </div>
        );
      })}

      <div className="border-b border-border p-2">
        <Textarea
          value={meta.notes}
          onChange={(e) => setNotes(week, program.id, e.target.value)}
          placeholder="Weekly notes…"
          aria-label={`${program.name} weekly notes`}
          className="min-h-16 resize-none border-0 bg-transparent p-1 text-xs shadow-none focus-visible:ring-0"
        />
      </div>
    </div>
  );
}

export function RosterGrid({ week }: { week: WeekKey }) {
  const { programs, slots } = useSchedule();
  const weekSlots = slots.filter((s) => s.week === week);

  return (
    <div className="min-w-[64rem] overflow-hidden rounded-lg border border-border bg-card">
      <div className="grid grid-cols-[14rem_repeat(4,minmax(0,1fr))_18rem]">
        <div className="border-b border-r border-border bg-muted/50 p-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Program
        </div>
        {Array.from({ length: MAX_COLUMNS }, (_, i) => (
          <div
            key={i}
            className="border-b border-r border-border bg-muted/50 p-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
          >
            Role slot {i + 1}
          </div>
        ))}
        <div className="border-b border-border bg-muted/50 p-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Weekly notes
        </div>

        {programs.map((p) => (
          <ProgramRow
            key={p.id}
            program={p}
            week={week}
            slots={weekSlots.filter((s) => s.programId === p.id)}
          />
        ))}
      </div>

      {programs.length === 0 && (
        <p className="p-6 text-center text-sm text-muted-foreground">
          No programs yet — add one from Manage programs.
        </p>
      )}
    </div>
  );
}
