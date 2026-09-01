# Weekly Roster Redesign

Replace the hourly day/time matrix with a spreadsheet-style weekly roster: one week at a time, programs as rows, role slots as the drop targets.

## Main view

- Date navigator at the top: previous / next / this week, labelled like "Week 2: July 6 – July 10" (week number counted from the start of the summer season, Monday-based weeks).
- Grid rows = programs (Junior Racing, Canoe Kids, Youth Camps, Intro to Comp as the new defaults, still editable in Manage Programs).
- Each program row has:
  - Program name with its colour dot, plus a small editable participant-count number input (e.g. "Jrs: 9").
  - A staff/participant ratio readout that updates as slots fill (e.g. "9 : 2 → 4.5 per staff"), highlighted when it exceeds a sensible threshold.
  - Role slot cells across the row: Lead Coach, Assistant, Floater by default, each a drop zone for one staff member.
  - A weekly notes cell (free text, e.g. "Sarah half days T/Th/F").
- Slots show either the assigned staff name/role or a dashed "Unassigned" placeholder in the program colour.
- Assigned slots can be cleared (small x) or reassigned by dropping someone else on them; the "drop here to unassign" target stays in the sidebar.
- Role slots per program per week are editable: an "Add role slot" control in each row and a way to rename/remove a slot, so a program can have e.g. two Assistants one week.

## Sidebar

Unchanged in behaviour: search, role filter, draggable staff cards. The per-staff counter now shows how many roster slots that person holds this week, and a warning appears if the same person is dropped into two slots in the same week.

## Staff portal

Rewritten to match the weekly model: a chronological list of the weeks the selected staff member is rostered, showing week label, program, role, and that week's notes — no times.

## Removed

All time-of-day concepts: Early/Morning/Afternoon/Evening blocks, start/end time fields, the "New Shift Requirement" time inputs, and the hourly shift dialog. Manage Programs (names + colours) stays.

## Technical notes

- `src/lib/schedule-types.ts`: drop `TIME_BLOCKS`/`BlockId`/time helpers; new `Assignment` model keyed by `{ id, weekStart, programId, roleSlotId, staffId | null }`, plus `RoleSlot { id, weekStart, programId, label, order }` and per-week program meta `{ weekStart, programId, participants, notes }`. New seed data for the current and next week.
- `src/context/schedule-context.tsx` / `schedule-provider.tsx`: swap shift CRUD for assignment/slot/meta CRUD; conflict detection becomes "same staff in two slots in the same week".
- Components: rewrite `week-grid.tsx` into `roster-grid.tsx` (program rows), replace `shift-block.tsx` with `role-slot.tsx`, retire `new-shift-dialog.tsx` and `shift-dialog.tsx`, keep `staff-card.tsx`, `programs-dialog.tsx`, `site-header.tsx`, and adapt `schedule-board.tsx` DnD wiring.
- Route head metadata on `/` and `/my-schedule` updated to the roster wording.
