# Weekly Staff Scheduling MVP — Paddling Club

Replace the weekly Excel matrix with a drag-and-drop scheduling grid, backed by in-memory mock data (no database yet).

## What gets built

### 1. Admin weekly matrix (home page, `/`)
- Monday–Sunday columns, time-of-day rows (early morning / morning / afternoon / evening blocks).
- Week navigation (prev / next / today) with the date range in the header.
- Shift blocks are color-coded by program: Canoe Kids Camp (blue), Regattas (amber), Boat Rentals (green), Adult Masters (violet).
- Each block shows staff name, role, and time range. Unassigned slots show as dashed "drop here" targets.
- Legend + per-day coverage count so gaps are obvious at a glance.

### 2. Staff panel with drag-and-drop
- Left sidebar listing all staff with name, primary role, and a role badge; searchable/filterable by role.
- Drag a staff card onto any day/time cell to create an assigned shift with sensible default times for that block.
- Drag an existing shift between cells to move it; drop onto the sidebar to unassign.
- Visual drop highlight and a warning when a staff member is double-booked at overlapping times.

### 3. Shift modal
- Click a shift block to edit: start time, end time, program category, assigned staff (dropdown), and a free-text note ("Bring safety boat keys").
- Delete shift action; save updates the grid immediately.

### 4. Staff portal (read-only)
- Tab/toggle in the header switching between "Admin" and "My schedule".
- A staff selector simulating who is logged in, then a chronological list of only that person's upcoming shifts grouped by day, with program color, times, and notes.
- Empty state when a staff member has no upcoming shifts.

## Design language
Utilitarian and highly readable: neutral slate surfaces, strong grid lines, compact type, program color used only on shift blocks and legend chips. All colors go through semantic design tokens in `src/styles.css` so nothing is hardcoded.

## Technical notes
- Routes: `/` (admin matrix) and `/my-schedule` (staff portal), each with its own `head()` metadata.
- State lives in a `ScheduleProvider` React context (`src/context/schedule-context.tsx`) seeded with ~10 staff and a week of realistic shifts; types in `src/lib/schedule-types.ts`.
- Drag-and-drop uses `@dnd-kit/core` (pointer + keyboard sensors, works on touch).
- shadcn/ui for dialog, select, button, input, badge, tabs; Tailwind for layout.
- Data is in-memory only — refreshing resets to the seed. Wiring it to Lovable Cloud for real persistence and staff logins is the natural next step.
