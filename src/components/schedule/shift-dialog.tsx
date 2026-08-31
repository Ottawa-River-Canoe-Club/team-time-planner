import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSchedule } from "@/context/schedule-context";
import { PROGRAMS, toMinutes, type ProgramId, type Shift } from "@/lib/schedule-types";
import { format, parseISO } from "date-fns";

const UNASSIGNED = "__unassigned__";

export function ShiftDialog({
  shift,
  onOpenChange,
}: {
  shift: Shift | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { staff, updateShift, removeShift } = useSchedule();
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("12:00");
  const [program, setProgram] = useState<ProgramId>("canoe-kids");
  const [staffId, setStaffId] = useState<string>(UNASSIGNED);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!shift) return;
    setStart(shift.start);
    setEnd(shift.end);
    setProgram(shift.program);
    setStaffId(shift.staffId ?? UNASSIGNED);
    setNote(shift.note ?? "");
  }, [shift]);

  const save = () => {
    if (!shift) return;
    if (toMinutes(end) <= toMinutes(start)) {
      toast.error("End time must be after the start time.");
      return;
    }
    updateShift(shift.id, {
      start,
      end,
      program,
      staffId: staffId === UNASSIGNED ? null : staffId,
      note: note.trim() || undefined,
    });
    toast.success("Shift updated");
    onOpenChange(false);
  };

  return (
    <Dialog open={!!shift} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit shift</DialogTitle>
          <DialogDescription>
            {shift ? format(parseISO(shift.date), "EEEE, MMMM d") : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="shift-start">Start</Label>
              <Input
                id="shift-start"
                type="time"
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="shift-end">End</Label>
              <Input
                id="shift-end"
                type="time"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label>Program</Label>
            <Select value={program} onValueChange={(v) => setProgram(v as ProgramId)}>
              <SelectTrigger>
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

          <div className="grid gap-1.5">
            <Label>Assigned staff</Label>
            <Select value={staffId} onValueChange={setStaffId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
                {staff.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} — {s.role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="shift-note">Note</Label>
            <Textarea
              id="shift-note"
              value={note}
              placeholder="e.g. Bring safety boat keys"
              onChange={(e) => setNote(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter className="sm:justify-between">
          <Button
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={() => {
              if (!shift) return;
              removeShift(shift.id);
              toast.success("Shift deleted");
              onOpenChange(false);
            }}
          >
            <Trash2 className="size-4" /> Delete
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={save}>Save changes</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
