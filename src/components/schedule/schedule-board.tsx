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
import { addWeeks, format } from "date-fns";
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
  STAFF_ROLES,
  blockStyle,
  chipStyle,
  dateKey,
  programById,
  weekDays,
  weekStart,
  type BlockId,
  type ProgramId,
  type Shift,
} from "@/lib/schedule-types";
import { StaffCard } from "./staff-card";
import { WeekGrid } from "./week-grid";
import { ShiftDialog } from "./shift-dialog";
import { NewShiftDialog, type NewShiftTarget } from "./new-shift-dialog";
import { ProgramsDialog } from "./programs-dialog";

/** Prefer an unassigned shift slot under the pointer over its parent cell. */
const collisionDetection: CollisionDetection = (args) => {
  const pointer = pointerWithin(args);
  const collisions = pointer.length > 0 ? pointer : rectIntersection(args);
  const slot = collisions.find((c) => String(c.id).startsWith("slot:"));
  return slot ? [slot] : collisions;
};

export function ScheduleBoard() {
  const { staff, programs, shifts, conflictIds, addShift, moveShift, updateShift } = useSchedule();
  const [anchor, setAnchor] = useState(() => weekStart(new Date()));
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [program, setProgram] = useState<ProgramId>(programs[0]?.id ?? "");
  const [editing, setEditing] = useState<Shift | null>(null);
  const [creating, setCreating] = useState<NewShiftTarget | null>(null);
  const [managing, setManaging] = useState(false);
  const [dragLabel, setDragLabel] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor),
  );
  const days = useMemo(() => weekDays(anchor), [anchor]);
  const dayKeys = useMemo(() => days.map(dateKey), [days]);
  const weekShifts = useMemo(
    () => shifts.filter((s) => dayKeys.includes(s.date)),
    [shifts, dayKeys],
  );

  const activeProgram = programs.some((p) => p.id === program) ? program : (programs[0]?.id ?? "");

  const filteredStaff = staff.filter(
    (s) =>
      (roleFilter === "all" || s.role === roleFilter) &&
      s.name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  const { setNodeRef: unassignRef, isOver: unassignOver } = useDroppable({
    id: "unassign",
    data: { type: "unassign" },
  });

  const onDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current as
      | { type: "staff"; staffId: string }
      | { type: "shift"; shiftId: string }
      | undefined;
    if (data?.type === "staff") {
      setDragLabel(staff.find((s) => s.id === data.staffId)?.name ?? "Staff");
    } else if (data?.type === "shift") {
      const shift = shifts.find((s) => s.id === data.shiftId);
      const person = staff.find((s) => s.id === shift?.staffId);
      setDragLabel(person?.name ?? "Unassigned shift");
    }
  };

  const onDragEnd = (event: DragEndEvent) => {
    setDragLabel(null);
    const { active, over } = event;
    if (!over) return;
    const from = active.data.current as
      | { type: "staff"; staffId: string }
      | { type: "shift"; shiftId: string }
      | undefined;
    const target = over.data.current as
      | { type: "cell"; date: string; block: BlockId }
      | { type: "slot"; shiftId: string }
      | { type: "unassign" }
      | undefined;
    if (!from || !target) return;

    if (target.type === "unassign") {
      if (from.type === "shift") {
        updateShift(from.shiftId, { staffId: null });
        toast.success("Shift unassigned");
      }
      return;
    }

    if (target.type === "slot") {
      if (from.type !== "staff") return;
      const slot = shifts.find((s) => s.id === target.shiftId);
      const person = staff.find((s) => s.id === from.staffId);
      if (slot?.requiredRole && person && person.role !== slot.requiredRole) {
        toast.warning(`${person.name} is a ${person.role}, this slot asks for a ${slot.requiredRole}.`);
      }
      updateShift(target.shiftId, { staffId: from.staffId });
      toast.success(`${person?.name ?? "Staff"} filled an open shift`);
      return;
    }

    if (from.type === "staff") {
      if (!activeProgram) {
        toast.error("Create a program first.");
        return;
      }
      addShift({
        date: target.date,
        block: target.block,
        program: activeProgram,
        staffId: from.staffId,
      });
      toast.success(`${staff.find((s) => s.id === from.staffId)?.name} scheduled`);
    } else {
      moveShift(from.shiftId, target.date, target.block);
    }
  };

  return (
    <DndContext
      id="schedule-dnd"
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
                Drag onto an open shift to fill it, or onto a cell to create one.
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
                  shiftCount={weekShifts.filter((sh) => sh.staffId === s.id).length}
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
                "flex items-center justify-center gap-2 rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground",
                unassignOver && "border-destructive bg-destructive/10 text-destructive",
              )}
            >
              <Trash2 className="size-3.5" aria-hidden /> Drop a shift here to unassign
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
                onClick={() => setAnchor((a) => addWeeks(a, -1))}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                aria-label="Next week"
                onClick={() => setAnchor((a) => addWeeks(a, 1))}
              >
                <ChevronRight className="size-4" />
              </Button>
              <Button variant="ghost" onClick={() => setAnchor(weekStart(new Date()))}>
                Today
              </Button>
            </div>
            <h1 className="text-base font-semibold text-foreground">
              {format(days[0] ?? anchor, "MMM d")} – {format(days[6] ?? anchor, "MMM d, yyyy")}
            </h1>
            <Button variant="outline" size="sm" onClick={() => setManaging(true)}>
              <Palette className="size-4" /> Manage programs
            </Button>

            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Quick-drop program:</span>
              <Select value={activeProgram} onValueChange={setProgram}>
                <SelectTrigger className="w-48" aria-label="Program for new shifts">
                  <SelectValue placeholder="No programs" />
                </SelectTrigger>
                <SelectContent>
                  {programs.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
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

          <div className="overflow-x-auto pb-2">
            <WeekGrid
              days={days}
              shifts={weekShifts}
              staff={staff}
              conflictIds={conflictIds}
              onOpen={setEditing}
              onAdd={(date, block) => setCreating({ date, block })}
            />
          </div>
        </section>
      </div>

      <DragOverlay dropAnimation={null}>
        {dragLabel && (
          <div
            style={blockStyle(programById(programs, activeProgram).color)}
            className="rounded-md border px-2.5 py-1.5 text-xs font-medium shadow-lg"
          >
            {dragLabel}
          </div>
        )}
      </DragOverlay>

      <ShiftDialog shift={editing} onOpenChange={(open) => !open && setEditing(null)} />
      <NewShiftDialog target={creating} onOpenChange={(open) => !open && setCreating(null)} />
      <ProgramsDialog open={managing} onOpenChange={setManaging} />
    </DndContext>
  );
}
