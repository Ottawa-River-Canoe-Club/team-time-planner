import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useSchedule } from "@/context/schedule-context";
import { DayCell } from "./day-cell";
import {
  DAY_INDEXES,
  DAY_LABELS,
  metaKey,
  ratioLabel,
  type Assignment,
  type Program,
  type WeekKey,
} from "@/lib/schedule-types";

function ProgramRow({
  program,
  week,
  rowAssignments,
}: {
  program: Program;
  week: WeekKey;
  rowAssignments: Assignment[];
}) {
  const {
    staff,
    programWeeks,
    doubleBookedIds,
    removeAssignment,
    setParticipants,
    setNotes,
  } = useSchedule();

  const meta = programWeeks[metaKey(week, program.id)] ?? { participants: 0, notes: "" };
  const uniqueStaff = new Set(rowAssignments.map((a) => a.staffId)).size;
  const ratio = ratioLabel(meta.participants, uniqueStaff);
  const heavy = uniqueStaff > 0 && meta.participants / uniqueStaff > 8;

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
          {uniqueStaff} staff · {ratio}
        </p>
      </div>

      {DAY_INDEXES.map((day) => (
        <DayCell
          key={day}
          week={week}
          programId={program.id}
          day={day}
          assignments={rowAssignments.filter((a) => a.day === day)}
          staff={staff}
          color={program.color}
          doubleBookedIds={doubleBookedIds}
          onRemove={removeAssignment}
        />
      ))}

      <div className="border-b border-border p-2">
        <Textarea
          value={meta.notes}
          onChange={(e) => setNotes(week, program.id, e.target.value)}
          placeholder="Weekly notes…"
          aria-label={`${program.name} weekly notes`}
          className="min-h-20 resize-none border-0 bg-transparent p-1 text-xs shadow-none focus-visible:ring-0"
        />
      </div>
    </div>
  );
}

export function RosterGrid({ week }: { week: WeekKey }) {
  const { programs, assignments } = useSchedule();
  const weekAssignments = assignments.filter((a) => a.week === week);

  return (
    <div className="min-w-[68rem] overflow-hidden rounded-lg border border-border bg-card">
      <div className="grid grid-cols-[14rem_repeat(5,minmax(0,1fr))_16rem]">
        <div className="border-b border-r border-border bg-muted/50 p-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Program
        </div>
        {DAY_LABELS.map((label) => (
          <div
            key={label}
            className="border-b border-r border-border bg-muted/50 p-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
          >
            {label}
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
            rowAssignments={weekAssignments.filter((a) => a.programId === p.id)}
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
