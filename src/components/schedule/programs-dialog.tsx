import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { PROGRAM_SWATCHES, slugify } from "@/lib/schedule-types";

function Swatches({
  value,
  onChange,
}: {
  value: string;
  onChange: (color: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {PROGRAM_SWATCHES.map((c) => (
        <button
          key={c}
          type="button"
          aria-label={`Use colour ${c}`}
          onClick={() => onChange(c)}
          style={{ backgroundColor: c }}
          className={cn(
            "size-5 rounded-full border border-border",
            value === c && "ring-2 ring-ring ring-offset-1 ring-offset-background",
          )}
        />
      ))}
    </div>
  );
}

export function ProgramsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const {
    programs,
    assignments,
    activeTypeId,
    scheduleTypes,
    addScheduleType,
    updateScheduleType,
    removeScheduleType,
    addProgram,
    updateProgram,
    removeProgram,
  } = useSchedule();
  const [typeName, setTypeName] = useState("");
  const [typeDays, setTypeDays] = useState<"5" | "7">("7");
  const [name, setName] = useState("");
  const [typeId, setTypeId] = useState(activeTypeId);
  const [color, setColor] = useState(PROGRAM_SWATCHES[4]!);

  const create = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Give the program a name.");
      return;
    }
    const id = slugify(trimmed);
    if (programs.some((p) => p.id === id)) {
      toast.error("A program with that name already exists.");
      return;
    }
    addProgram({ id, typeId, name: trimmed, short: trimmed.slice(0, 3).toUpperCase(), color });
    setName("");
    toast.success(`${trimmed} added`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage schedules &amp; programs</DialogTitle>
          <DialogDescription>
            Add or remove schedule types, then rename programs, pick their colour, or remove ones
            you no longer run.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-border p-3">
          <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Schedule types
          </Label>
          <div className="mt-2 space-y-2">
            {scheduleTypes.map((t) => (
              <div key={t.id} className="flex items-center gap-2">
                <Input
                  value={t.name}
                  aria-label={`${t.name} name`}
                  onChange={(e) => updateScheduleType(t.id, { name: e.target.value })}
                  className="h-8"
                />
                <Select
                  value={String(t.dayCount)}
                  onValueChange={(v) => updateScheduleType(t.id, { dayCount: Number(v) as 5 | 7 })}
                >
                  <SelectTrigger className="h-8 w-32 shrink-0" aria-label={`${t.name} days`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">Mon–Fri</SelectItem>
                    <SelectItem value="7">Mon–Sun</SelectItem>
                  </SelectContent>
                </Select>
                <span className="w-14 shrink-0 text-right text-[11px] text-muted-foreground">
                  {programs.filter((p) => p.typeId === t.id).length} rows
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Delete ${t.name}`}
                  className="shrink-0 text-destructive hover:text-destructive"
                  onClick={() => {
                    removeScheduleType(t.id);
                    toast.success(`${t.name} deleted`);
                  }}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
            {scheduleTypes.length === 0 && (
              <p className="rounded-md border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
                No schedule types yet.
              </p>
            )}
            <div className="flex items-center gap-2 pt-1">
              <Input
                value={typeName}
                placeholder="e.g. Regatta Weekend"
                aria-label="New schedule type"
                onChange={(e) => setTypeName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== "Enter") return;
                  if (!typeName.trim()) return;
                  addScheduleType(typeName, Number(typeDays) as 5 | 7);
                  setTypeName("");
                }}
                className="h-8"
              />
              <Select value={typeDays} onValueChange={(v) => setTypeDays(v as "5" | "7")}>
                <SelectTrigger className="h-8 w-32 shrink-0" aria-label="New schedule type days">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">Mon–Fri</SelectItem>
                  <SelectItem value="7">Mon–Sun</SelectItem>
                </SelectContent>
              </Select>
              <Button
                size="sm"
                onClick={() => {
                  if (!typeName.trim()) {
                    toast.error("Give the schedule type a name.");
                    return;
                  }
                  addScheduleType(typeName, Number(typeDays) as 5 | 7);
                  toast.success(`${typeName.trim()} added`);
                  setTypeName("");
                }}
              >
                <Plus className="size-4" /> Add
              </Button>
            </div>
          </div>
        </div>

        <div className="max-h-[50vh] space-y-3 overflow-y-auto pr-1">
          {scheduleTypes.map((t) => (
            <div key={t.id} className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {t.name}
              </p>
          {programs.filter((p) => p.typeId === t.id).map((p) => {
            const used = assignments.filter((a) => a.programId === p.id).length;
            return (
              <div key={p.id} className="rounded-lg border border-border p-3">
                <div className="flex items-center gap-2">
                  <span
                    className="size-3 shrink-0 rounded-full"
                    style={{ backgroundColor: p.color }}
                    aria-hidden
                  />
                  <Input
                    value={p.name}
                    aria-label={`${p.name} name`}
                    onChange={(e) => updateProgram(p.id, { name: e.target.value })}
                    className="h-8"
                  />
                  <Input
                    value={p.short}
                    aria-label={`${p.name} short label`}
                    onChange={(e) => updateProgram(p.id, { short: e.target.value })}
                    className="h-8 w-20"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Delete ${p.name}`}
                    className="shrink-0 text-destructive hover:text-destructive"
                    onClick={() => {
                      removeProgram(p.id);
                      toast.success(`${p.name} deleted${used ? ` · ${used} assignment(s) removed` : ""}`);
                    }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <Swatches value={p.color} onChange={(c) => updateProgram(p.id, { color: c })} />
                  <span className="text-[11px] text-muted-foreground">{used} assignments</span>
                </div>
              </div>
            );
          })}
              {programs.filter((p) => p.typeId === t.id).length === 0 && (
                <p className="rounded-md border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                  Nothing in {t.name} yet.
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-dashed border-border p-3">
          <Label htmlFor="new-program">Add a program</Label>
          <div className="mt-1.5 flex items-center gap-2">
            <Input
              id="new-program"
              value={name}
              placeholder="e.g. Learn to Sail"
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && create()}
              className="h-8"
            />
            <Select value={typeId} onValueChange={setTypeId}>
              <SelectTrigger className="h-8 w-40" aria-label="Schedule type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {scheduleTypes.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" onClick={create}>
              <Plus className="size-4" /> Add
            </Button>
          </div>
          <div className="mt-2">
            <Swatches value={color} onChange={setColor} />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
