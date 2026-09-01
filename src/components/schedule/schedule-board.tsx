import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { addWeeks } from "date-fns";
import { ChevronLeft, ChevronRight, Palette, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useSchedule } from "@/context/schedule-context";
import {
  DAY_LABELS,
  STAFF_ROLES,
  chipStyle,
  parseWeek,
  programById,
  weekKey,
  weekLabel,
  weekStart,
  type DayIndex,
} from "@/lib/schedule-types";
import { StaffCard } from "./staff-card";
import { RosterGrid } from "./roster-grid";
import { ProgramsDialog } from "./programs-dialog";

/** Prefer a day cell under the pointer over anything else. */
const collisionDetection: CollisionDetection = (args) => {
  const pointer = pointerWithin(args);
  const collisions = pointer.length > 0 ? pointer : rectIntersection(args);
  const cell = collisions.find((c) => String(c.id).startsWith("cell:"));
  return cell ? [cell] : collisions;
};

export function ScheduleBoard() {
  const { staff, programs, assignments, addAssignment } = useSchedule();
  const [week, setWeek] = useState<string>(() => weekKey(new Date()));
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [managing, setManaging] = useState(false);
  const [dragLabel, setDragLabel] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor),
  );

  const monday = useMemo(() => parseWeek(week), [week]);
  const weekAssignments = useMemo(
    () => assignments.filter((a) => a.week === week),
    [assignments, week],
  );
  const filled = weekAssignments.length;
  const people = new Set(weekAssignments.map((a) => a.staffId)).size;

  const filteredStaff = staff.filter(
    (s) =>
      (roleFilter === "all" || s.role === roleFilter) &&
      s.name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  const { setNodeRef: unassignRef, isOver: unassignOver } = useDroppable({
    id: "unassign",
    data: { type: "unassign" },
  });

  const shiftWeek = (delta: number) => setWeek(weekKey(addWeeks(monday, delta)));

  const onDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current as
      | { type: "staff"; staffId: string }
      | undefined;
    if (data?.type === "staff") {
      setDragLabel(staff.find((s) => s.id === data.staffId)?.name ?? "Staff");
    }
  };

  const onDragEnd = (event: DragEndEvent) => {
    setDragLabel(null);
    const { active, over } = event;
    if (!over) return;
    const from = active.data.current as { type: "staff"; staffId: string } | undefined;
    const target = over.data.current as
      | { type: "cell"; week: string; programId: string; day: DayIndex }
      | { type: "unassign" }
      | undefined;
    if (!from || from.type !== "staff" || !target || target.type !== "cell") return;

    const person = staff.find((s) => s.id === from.staffId);
    const added = addAssignment(target.week, target.programId, target.day, from.staffId);
    const program = programById(programs, target.programId);
    const dayName = DAY_LABELS[target.day];
    if (!added) {
      toast.info(`${person?.name ?? "Staff"} is already on ${program.name} ${dayName}.`);
      return;
    }
    const clash = assignments.some(
      (a) => a.week === target.week && a.day === target.day && a.staffId === from.staffId,
    );
    if (clash) {
      toast.warning(`${person?.name ?? "Staff"} is now in two programs on ${dayName}.`);
    } else {
      toast.success(`${person?.name ?? "Staff"} → ${program.name} · ${dayName}`);
    }
  };


  return (
    <DndContext
      id="roster-dnd"
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={() => setDragLabel(null)}
    >
      <div className="mx-auto flex max-w-[110rem] flex-col gap-4 px-4 py-6 lg:flex-row">
        <aside className="lg:w-64 lg:shrink-0">
          <div className="sticky top-4 space-y-3">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Staff</h2>
              <p className="text-xs text-muted-foreground">
                Drag someone into a program's day cell for this week.
              </p>
            </div>

            <div className="relative">
              <Search
                className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search staff"
                className="pl-8"
                aria-label="Search staff"
              />
            </div>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger aria-label="Filter by role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                {STAFF_ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="space-y-1.5">
              {filteredStaff.map((s) => (
                <StaffCard
                  key={s.id}
                  staff={s}
                  shiftCount={weekAssignments.filter((a) => a.staffId === s.id).length}
                />
              ))}
              {filteredStaff.length === 0 && (
                <p className="rounded-md border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                  No staff match that filter.
                </p>
              )}
            </div>

            <div
              ref={unassignRef}
              className={cn(
                "flex items-center justify-center gap-2 rounded-md border border-dashed border-border p-3 text-center text-xs text-muted-foreground",
                unassignOver && "border-destructive bg-destructive/10 text-destructive",
              )}
            >
              <Trash2 className="size-3.5 shrink-0" aria-hidden /> Remove someone with the × on their card
            </div>
          </div>
        </aside>

        <section className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                aria-label="Previous week"
                onClick={() => shiftWeek(-1)}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                aria-label="Next week"
                onClick={() => shiftWeek(1)}
              >
                <ChevronRight className="size-4" />
              </Button>
              <Button variant="ghost" onClick={() => setWeek(weekKey(weekStart(new Date())))}>
                This week
              </Button>
            </div>
            <h1 className="text-base font-semibold text-foreground">{weekLabel(monday)}</h1>
            <Button variant="outline" size="sm" onClick={() => setManaging(true)}>
              <Palette className="size-4" /> Manage programs
            </Button>
            <span className="text-xs text-muted-foreground">
              {filled} assignment{filled === 1 ? "" : "s"} · {people} staff
            </span>

            <div className="ml-auto flex flex-wrap items-center gap-2">
              {programs.map((p) => (
                <span
                  key={p.id}
                  style={chipStyle(p.color)}
                  className="flex items-center gap-1.5 rounded px-2 py-1 text-xs"
                >
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: p.color }}
                    aria-hidden
                  />
                  {p.name}
                </span>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto pb-2">
            <RosterGrid week={week} />
          </div>
        </section>
      </div>

      <DragOverlay dropAnimation={null}>
        {dragLabel && (
          <div className="rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-foreground shadow-lg">
            {dragLabel}
          </div>
        )}
      </DragOverlay>

      <ProgramsDialog open={managing} onOpenChange={setManaging} />
    </DndContext>
  );
}
