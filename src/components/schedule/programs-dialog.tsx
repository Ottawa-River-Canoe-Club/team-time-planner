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
  const { programs, shifts, addProgram, updateProgram, removeProgram } = useSchedule();
  const [name, setName] = useState("");
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
    addProgram({ id, name: trimmed, color });
    setName("");
    toast.success(`${trimmed} added`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage programs</DialogTitle>
          <DialogDescription>
            Rename programs, pick their colour, or remove ones you no longer run.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {programs.map((p) => {
            const used = shifts.filter((s) => s.program === p.id).length;
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
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Delete ${p.name}`}
                    className="shrink-0 text-destructive hover:text-destructive"
                    onClick={() => {
                      removeProgram(p.id);
                      toast.success(`${p.name} deleted${used ? ` · ${used} shift(s) removed` : ""}`);
                    }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <Swatches value={p.color} onChange={(c) => updateProgram(p.id, { color: c })} />
                  <span className="text-[11px] text-muted-foreground">{used} shifts</span>
                </div>
              </div>
            );
          })}
          {programs.length === 0 && (
            <p className="rounded-md border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
              No programs yet — add one below.
            </p>
          )}
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
