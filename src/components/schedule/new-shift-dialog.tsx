import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
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
import { useSchedule } from "@/context/schedule-context";
import {
  STAFF_ROLES,
  blockById,
  toMinutes,
  type BlockId,
  type ProgramId,
  type StaffRole,
} from "@/lib/schedule-types";

const ANY_ROLE = "__any__";

export type NewShiftTarget = { date: string; block: BlockId };

export function NewShiftDialog({
  target,
  onOpenChange,
}: {
  target: NewShiftTarget | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { programs, addShift } = useSchedule();
  const [program, setProgram] = useState<ProgramId>(programs[0]?.id ?? "");
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("12:00");
  const [role, setRole] = useState<string>(ANY_ROLE);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (!target) return;
    const b = blockById(target.block);
    setStart(b.start);
    setEnd(b.end);
    setProgram(programs[0]?.id ?? "");
    setRole(ANY_ROLE);
    setQuantity(1);
  }, [target, programs]);

  const create = () => {
    if (!target) return;
    if (!program) {
      toast.error("Create a program first.");
      return;
    }
    if (toMinutes(end) <= toMinutes(start)) {
      toast.error("End time must be after the start time.");
      return;
    }
    const qty = Math.min(12, Math.max(1, Math.round(quantity) || 1));
    addShift({
      date: target.date,
      block: target.block,
      program,
      staffId: null,
      start,
      end,
      requiredRole: role === ANY_ROLE ? null : (role as StaffRole),
      quantity: qty,
    });
    toast.success(`${qty} open shift${qty > 1 ? "s" : ""} created`);
    onOpenChange(false);
  };

  return (
    <Dialog open={!!target} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New shift requirement</DialogTitle>
          <DialogDescription>
            {target
              ? `${format(parseISO(target.date), "EEEE, MMMM d")} · ${blockById(target.block).label}`
              : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label>Program</Label>
            <Select value={program} onValueChange={setProgram}>
              <SelectTrigger>
                <SelectValue placeholder="Select a program" />
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

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="new-start">Start</Label>
              <Input
                id="new-start"
                type="time"
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="new-end">End</Label>
              <Input id="new-end" type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Required role (optional)</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ANY_ROLE}>Any role</SelectItem>
                  {STAFF_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="new-qty">Quantity needed</Label>
              <Input
                id="new-qty"
                type="number"
                min={1}
                max={12}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={create}>Create open shifts</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
