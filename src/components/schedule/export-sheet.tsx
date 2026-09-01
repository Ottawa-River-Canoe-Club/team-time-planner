import { useSchedule } from "@/context/schedule-context";
import {
  DAY_LABELS,
  dayIndexes,
  blockStyle,
  metaKey,
  parseWeek,
  ratioLabel,
  staffById,
  weekLabel,
  type WeekKey,
} from "@/lib/schedule-types";

/**
 * Static, print-friendly rendering of one schedule type for one week.
 * Used only as the capture source for PDF export (no drag-and-drop).
 */
export function ExportSheet({
  week,
  typeId,
  typeName,
}: {
  week: WeekKey;
  typeId: string;
  typeName: string;
}) {
  const { programs, assignments, programWeeks, staff, scheduleTypes } = useSchedule();
  const dayCount = scheduleTypes.find((t) => t.id === typeId)?.dayCount ?? 5;
  const rows = programs.filter((p) => p.typeId === typeId);
  const weekAssignments = assignments.filter((a) => a.week === week);

  return (
    <div
      className="bg-card p-6 text-foreground"
      style={{ width: dayCount === 7 ? 1400 : 1100 }}
    >
      <div className="mb-3">
        <h2 className="text-lg font-semibold">{typeName}</h2>
        <p className="text-xs text-muted-foreground">{weekLabel(parseWeek(week), dayCount)}</p>
      </div>
      <div className="overflow-hidden rounded-lg border border-border">
        <div
          className="grid"
          style={{ gridTemplateColumns: `12rem repeat(${dayCount}, minmax(0, 1fr)) 14rem` }}
        >
          {["Program", ...DAY_LABELS.slice(0, dayCount), "Weekly notes"].map((label) => (
            <div
              key={label}
              className="border-b border-r border-border bg-muted/50 p-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground last:border-r-0"
            >
              {label}
            </div>
          ))}

          {rows.map((program) => {
            const rowAssignments = weekAssignments.filter((a) => a.programId === program.id);
            const meta = programWeeks[metaKey(week, program.id)] ?? { participants: 0, notes: "" };
            const uniqueStaff = new Set(rowAssignments.map((a) => a.staffId)).size;
            return (
              <div key={program.id} className="contents">
                <div className="border-b border-r border-border p-2">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{ backgroundColor: program.color }}
                    />
                    <span className="text-xs font-semibold">{program.name}</span>
                  </div>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {program.short}: {meta.participants} · {uniqueStaff} staff ·{" "}
                    {ratioLabel(meta.participants, uniqueStaff)}
                  </p>
                </div>

                {dayIndexes(dayCount).map((day) => (
                  <div
                    key={day}
                    className="flex min-h-16 flex-col gap-1 border-b border-r border-border p-1.5"
                  >
                    {rowAssignments
                      .filter((a) => a.day === day)
                      .map((a) => {
                        const person = staffById(staff, a.staffId);
                        if (!person) return null;
                        return (
                          <div
                            key={a.id}
                            style={blockStyle(program.color)}
                            className="rounded border px-1.5 py-1"
                          >
                            <span className="block text-[10px] font-semibold leading-tight">
                              {person.name}
                            </span>
                            <span className="block text-[9px] leading-tight opacity-80">
                              {person.role}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                ))}

                <div className="whitespace-pre-wrap border-b border-border p-2 text-[10px] text-muted-foreground">
                  {meta.notes}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {rows.length === 0 && (
        <p className="p-4 text-center text-xs text-muted-foreground">No rows in this schedule.</p>
      )}
    </div>
  );
}
