# Team Time Planner

Build a weekly staff scheduling web application MVP for a community sports and paddling club. We currently build our schedules using a weekly Excel matrix and need to replace it with a clean, digital drag-and-drop interface.

**Core Data Models (Use Mock State/Context for now):**

1. **Staff:** Name, Primary Role (e.g., Head Coach, Canoe Kids Instructor, Boat House Attendant).

2. **Programs/Categories:** Canoe Kids Camp, Regattas, Boat Rentals, Adult Masters.

3. **Shifts:** Date, Start Time, End Time, Program Category, Assigned Staff.

**UI/UX Requirements:**

* **The Weekly Matrix (Admin View):** The main interface should be a weekly calendar grid (Monday-Sunday columns). 

* **Drag-and-Drop Assignment:** Include a sidebar or bottom panel listing all available staff members. The user must be able to drag a staff member's card and drop it into a specific day/slot on the weekly grid to assign them.

* **Shift Modals:** Clicking an assigned shift on the calendar should open a small modal to adjust the exact start/end times, reassign the staff member, or add a quick note (e.g., "Bring safety boat keys").

* **Staff Portal (Read-Only):** Include a simple toggle or separate tab demonstrating what a standard employee would see—a clean, chronological list or simple calendar view of *only their own* upcoming shifts.

**Design Language:**

Clean, utilitarian, and highly readable. Use a modern component library (like shadcn/ui + Tailwind). Use subtle color coding on the calendar blocks to differentiate programs (e.g., blue for Canoe Kids, green for Boat Rentals) so the manager can assess coverage at a glance.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/deb11106-da67-4f0c-98da-26e14c93fe46).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
