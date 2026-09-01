import { useEffect, useMemo, useRef, useState } from "react";
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
import {
  ChevronLeft,
  ChevronRight,
  Eraser,
  FileDown,
  Loader2,
  Palette,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useSchedule } from "@/context/schedule-context";
import { exportNodesToPdf } from "@/lib/export-pdf";
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
import { ExportSheet } from "./export-sheet";

/** Prefer a day cell under the pointer over anything else. */
const collisionDetection: CollisionDetection = (args) => {
  const pointer = pointerWithin(args);
  const collisions = pointer.length > 0 ? pointer : rectIntersection(args);
  const cell = collisions.find((c) => String(c.id).startsWith("cell:"));
  return cell ? [cell] : collisions;
};

export function ScheduleBoard() {
  const {
    staff,
    programs,
    assignments,
    activeTypeId,
    setActiveTypeId,
    scheduleTypes,
    addAssignment,
    clearWeek,
    clearAll,
  } = useSchedule();
  const [week, setWeek] = useState<string>(() => weekKey(new Date()));
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [managing, setManaging] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [dragLabel, setDragLabel] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportScope, setExportScope] = useState<"current" | "all">("current");
  const [exportWeeks, setExportWeeks] = useState(1);
  const [pending, setPending] = useState<{ types: string[]; weeks: string[] } | null>(null);
  const exportRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor),
  );

  const monday = useMemo(() => parseWeek(week), [week]);
  const activeDayCount = scheduleTypes.find((t) => t.id === activeTypeId)?.dayCount ?? 5;
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


  const startExport = () => {
    const types =
      exportScope === "current"
        ? scheduleTypes.filter((t) => t.id === activeTypeId).map((t) => t.id)
        : scheduleTypes.map((t) => t.id);
    const count = Math.min(Math.max(Math.round(exportWeeks) || 1, 1), 26);
    const weeks = Array.from({ length: count }, (_, i) => weekKey(addWeeks(monday, i)));
    if (types.length === 0) {
      toast.error("Nothing to export.");
      return;
    }
    setExportOpen(false);
    setExporting(true);
    setPending({ types, weeks });
  };

  useEffect(() => {
    if (!pending) return;
    let cancelled = false;
    const run = async () => {
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(null))));
      if (cancelled) return;
      const nodes = pending.weeks
        .flatMap((w) => pending.types.map((t) => exportRefs.current[`${t}|${w}`]))
        .filter((n): n is HTMLDivElement => Boolean(n));
      try {
        if (nodes.length === 0) throw new Error("nothing to capture");
        const first = pending.weeks[0]!;
        const span = pending.weeks.length > 1 ? `${pending.weeks.length}wk` : "1wk";
        const suffix = exportScope === "current" ? activeTypeId : "all-schedules";
        await exportNodesToPdf(nodes, `roster-${first}-${span}-${suffix}.pdf`);
        toast.success(
          `Exported ${nodes.length} schedule${nodes.length === 1 ? "" : "s"} to PDF.`,
        );
      } catch {
        toast.error("Could not generate the PDF.");
      } finally {
        if (!cancelled) {
          setExporting(false);
          setPending(null);
        }
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [pending, activeTypeId, exportScope]);

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
            <h1 className="text-base font-semibold text-foreground">{weekLabel(monday, activeDayCount)}</h1>
            <Button variant="outline" size="sm" onClick={() => setManaging(true)}>
              <Palette className="size-4" /> Manage programs
            </Button>
            <AlertDialog open={clearing} onOpenChange={setClearing}>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" disabled={assignments.length === 0}>
                  <Eraser className="size-4" /> Clear schedule
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear the schedule?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Choose whether to clear only {weekLabel(monday)} or every week. Participant
                    counts and weekly notes are cleared too. This can't be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <Button
                    variant="outline"
                    onClick={() => {
                      clearWeek(week);
                      setClearing(false);
                      toast.success(`Cleared ${weekLabel(monday)}.`);
                    }}
                  >
                    Clear this week
                  </Button>
                  <AlertDialogAction
                    onClick={() => {
                      clearAll();
                      toast.success("Cleared the whole schedule.");
                    }}
                  >
                    Clear all weeks
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button
              variant="outline"
              size="sm"
              disabled={exporting}
              onClick={() => setExportOpen(true)}
            >
              {exporting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <FileDown className="size-4" />
              )}
              Export to PDF
            </Button>
            <span className="text-xs text-muted-foreground">
              {filled} assignment{filled === 1 ? "" : "s"} · {people} staff
            </span>

            <div className="ml-auto flex flex-wrap items-center gap-2">
              {programs.filter((p) => p.typeId === activeTypeId).map((p) => (
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

          <Tabs value={activeTypeId} onValueChange={setActiveTypeId}>
            <TabsList>
              {scheduleTypes.map((t) => (
                <TabsTrigger key={t.id} value={t.id}>
                  {t.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="overflow-x-auto pb-2">
            <RosterGrid key={activeTypeId} week={week} typeId={activeTypeId} />
          </div>
        </section>
      </div>

      <div aria-hidden className="pointer-events-none fixed left-[-20000px] top-0 opacity-100">
        {(pending?.weeks ?? [week]).map((w) =>
          (pending?.types ?? scheduleTypes.map((t) => t.id)).map((typeId) => {
            const type = scheduleTypes.find((t) => t.id === typeId);
            if (!type) return null;
            return (
              <div
                key={`${typeId}|${w}`}
                ref={(node) => {
                  exportRefs.current[`${typeId}|${w}`] = node;
                }}
              >
                <ExportSheet week={w} typeId={type.id} typeName={type.name} />
              </div>
            );
          }),
        )}
      </div>

      <DragOverlay dropAnimation={null}>
        {dragLabel && (
          <div className="rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-foreground shadow-lg">
            {dragLabel}
          </div>
        )}
      </DragOverlay>

      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Export to PDF</DialogTitle>
            <DialogDescription>
              Choose which schedules to include and how many weeks to print, starting from{" "}
              {weekLabel(monday)}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="export-scope">Schedules</Label>
              <Select
                value={exportScope}
                onValueChange={(v) => setExportScope(v as "current" | "all")}
              >
                <SelectTrigger id="export-scope">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">Current schedule only</SelectItem>
                  <SelectItem value="all">Amalgamated (all schedule types)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="export-weeks">Weeks to include</Label>
              <Input
                id="export-weeks"
                type="number"
                min={1}
                max={26}
                value={exportWeeks}
                onChange={(e) => setExportWeeks(Number(e.target.value))}
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[
                  { label: "1 week", value: 1 },
                  { label: "2 weeks", value: 2 },
                  { label: "Month (4)", value: 4 },
                  { label: "Season (8)", value: 8 },
                ].map((preset) => (
                  <Button
                    key={preset.value}
                    type="button"
                    size="sm"
                    variant={exportWeeks === preset.value ? "default" : "outline"}
                    onClick={() => setExportWeeks(preset.value)}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Covers {weekLabel(monday)} through{" "}
                {weekLabel(
                  parseWeek(weekKey(addWeeks(monday, Math.max(Math.round(exportWeeks) || 1, 1) - 1))),
                )}
                .
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setExportOpen(false)}>
              Cancel
            </Button>
            <Button onClick={startExport}>Export PDF</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ProgramsDialog open={managing} onOpenChange={setManaging} />
    </DndContext>
  );
}
