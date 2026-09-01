import { createFileRoute } from "@tanstack/react-router";
import { isBefore } from "date-fns";
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
import {
  chipStyle,
  metaKey,
  parseWeek,
  programById,
  weekKey,
  weekLabel,
} from "@/lib/schedule-types";

export const Route = createFileRoute("/my-schedule")({
  head: () => ({
    meta: [
      { title: "My Weeks — Riverside Paddling Club Staff Portal" },
      {
        name: "description",
        content:
          "Staff portal: see which summer camp weeks you are rostered for, the program, your role and the weekly operational notes.",
      },
      { property: "og:title", content: "My Weeks — Riverside Paddling Club Staff Portal" },
      {
        property: "og:description",
        content: "Check the camp weeks you are rostered for, your role and weekly notes.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MySchedulePage,
});

function MySchedulePage() {
  const { staff, programs, slots, programWeeks, currentStaffId, setCurrentStaffId } = useSchedule();
  const me = staff.find((s) => s.id === currentStaffId);
  const thisWeek = weekKey(new Date());

  const mine = slots
    .filter((s) => s.staffId === currentStaffId)
    .filter((s) => !isBefore(parseWeek(s.week), parseWeek(thisWeek)))
    .sort((a, b) => (a.week === b.week ? a.label.localeCompare(b.label) : a.week < b.week ? -1 : 1));

  const byWeek = mine.reduce<Record<string, typeof mine>>((acc, slot) => {
    (acc[slot.week] ??= []).push(slot);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">My weeks</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {me ? `${me.name} · ${me.role}` : "Select a staff member"} · {mine.length} upcoming
              assignment{mine.length === 1 ? "" : "s"}
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
          {Object.entries(byWeek).map(([week, weekSlots]) => (
            <section key={week}>
              <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <CalendarDays className="size-4 text-muted-foreground" aria-hidden />
                {weekLabel(parseWeek(week))}
              </h2>
              <ul className="mt-2 space-y-2">
                {weekSlots.map((slot) => {
                  const program = programById(programs, slot.programId);
                  const meta = programWeeks[metaKey(week, slot.programId)];
                  return (
                    <li
                      key={slot.id}
                      className="rounded-lg border border-border bg-card p-3 shadow-sm"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          style={chipStyle(program.color)}
                          className="rounded px-2 py-0.5 text-xs font-medium"
                        >
                          {program.name}
                        </span>
                        <span className="text-sm font-semibold text-foreground">{slot.label}</span>
                        {meta && meta.participants > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {meta.participants} participants
                          </span>
                        )}
                      </div>
                      {meta?.notes && (
                        <p className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
                          <StickyNote className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                          {meta.notes}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}

          {mine.length === 0 && (
            <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              You have no upcoming weeks rostered yet.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
