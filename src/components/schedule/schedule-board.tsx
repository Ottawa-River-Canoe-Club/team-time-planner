import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { addWeeks, format } from "date-fns";
import { ChevronLeft, ChevronRight, Search, Trash2 } from "lucide-react";
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
  PROGRAMS,
  STAFF_ROLES,
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

export function ScheduleBoard() {
  const { staff, shifts, conflictIds, addShift, moveShift, updateShift } = useSchedule();
  const [anchor, setAnchor] = useState(() => weekStart(new Date()));
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [program, setProgram] = useState<ProgramId>("canoe-kids");
  const [editing, setEditing] = useState<Shift | null>(null);
  const [dragLabel, setDragLabel] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor));
  const days = useMemo(() => weekDays(anchor), [anchor]);
  const dayKeys = useMemo(() => days.map(dateKey), [days]);
  const weekShifts = useMemo(
    () => shifts.filter((s) => dayKeys.includes(s.date)),
    [shifts, dayKeys],
  );

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

    if (from.type === "staff") {
      addShift({ date: target.date, block: target.block, program, staffId: from.staffId });
      toast.success(`${staff.find((s) => s.id === from.staffId)?.name} scheduled`);
    } else {
      moveShift(from.shiftId, target.date, target.block);
    }
  };

  return (
    <DndContext
      sensors={sensors}
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
                Drag a card onto a day to schedule it.
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

            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs text-muted-foreground">New shifts:</span>
              <Select value={program} onValueChange={(v) => setProgram(v as ProgramId)}>
                <SelectTrigger className="w-48" aria-label="Program for new shifts">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROGRAMS.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {PROGRAMS.map((p) => (
              <span
                key={p.id}
                className={cn("flex items-center gap-1.5 rounded px-2 py-1 text-xs", p.chip)}
              >
                <span className={cn("size-2 rounded-full", p.dot)} aria-hidden />
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
            />
          </div>
        </section>
      </div>

      <DragOverlay dropAnimation={null}>
        {dragLabel && (
          <div
            className={cn(
              "rounded-md border px-2.5 py-1.5 text-xs font-medium shadow-lg",
              programById(program).block,
            )}
          >
            {dragLabel}
          </div>
        )}
      </DragOverlay>

      <ShiftDialog shift={editing} onOpenChange={(open) => !open && setEditing(null)} />
    </DndContext>
  );
}
