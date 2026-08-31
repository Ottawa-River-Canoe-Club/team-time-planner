import { createFileRoute } from "@tanstack/react-router";
import { format, parseISO, isBefore, startOfDay } from "date-fns";
import { CalendarDays, StickyNote } from "lucide-react";
import { SiteHeader } from "@/components/schedule/site-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSchedule } from "@/context/schedule-context";
import { formatTime, programById, toMinutes } from "@/lib/schedule-types";

export const Route = createFileRoute("/my-schedule")({
  head: () => ({
    meta: [
      { title: "My Shifts — Riverside Paddling Club Staff Portal" },
      {
        name: "description",
        content:
          "Staff portal: view your own upcoming paddling club shifts, times, programs and shift notes in one chronological list.",
      },
      { property: "og:title", content: "My Shifts — Riverside Paddling Club Staff Portal" },
      {
        property: "og:description",
        content: "Check your upcoming paddling club shifts, times, programs and notes.",
      },
    ],
  }),
  component: MySchedulePage,
});

function MySchedulePage() {
  const { staff, programs, shifts, currentStaffId, setCurrentStaffId } = useSchedule();
  const me = staff.find((s) => s.id === currentStaffId);
  const today = startOfDay(new Date());

  const mine = shifts
    .filter((s) => s.staffId === currentStaffId)
    .filter((s) => !isBefore(parseISO(s.date), today))
    .sort((a, b) =>
      a.date === b.date ? toMinutes(a.start) - toMinutes(b.start) : a.date < b.date ? -1 : 1,
    );

  const byDate = mine.reduce<Record<string, typeof mine>>((acc, shift) => {
    (acc[shift.date] ??= []).push(shift);
    return acc;
  }, {});

  const totalHours = mine.reduce(
    (sum, s) => sum + (toMinutes(s.end) - toMinutes(s.start)) / 60,
    0,
  );

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">My shifts</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {me ? `${me.name} · ${me.role}` : "Select a staff member"} · {mine.length} upcoming ·{" "}
              {totalHours.toFixed(1)} h
            </p>
          </div>
          <div className="w-56">
            <Select value={currentStaffId} onValueChange={setCurrentStaffId}>
              <SelectTrigger aria-label="Viewing as">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {staff.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-6 space-y-5">
          {Object.entries(byDate).map(([date, dayShifts]) => (
            <section key={date}>
              <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <CalendarDays className="size-4 text-muted-foreground" aria-hidden />
                {format(parseISO(date), "EEEE, MMMM d")}
              </h2>
              <ul className="mt-2 space-y-2">
                {dayShifts.map((s) => {
                  const program = programById(programs, s.program);
                  return (
                    <li
                      key={s.id}
                      className="flex gap-3 rounded-lg border border-border bg-card p-3"
                    >
                      <span
                        className="mt-1 size-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: program.color }}
                        aria-hidden
                      />
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-foreground">
                          {formatTime(s.start)} – {formatTime(s.end)}
                        </div>
                        <div className="text-sm text-muted-foreground">{program.name}</div>
                        {s.note && (
                          <div className="mt-1 flex items-start gap-1.5 text-xs text-muted-foreground">
                            <StickyNote className="mt-0.5 size-3 shrink-0" aria-hidden />
                            <span>{s.note}</span>
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}

          {mine.length === 0 && (
            <div className="rounded-lg border border-dashed border-border p-10 text-center">
              <p className="text-sm font-medium text-foreground">No upcoming shifts</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Nothing scheduled yet — check back after the manager publishes the week.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
