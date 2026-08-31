import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/schedule/site-header";
import { ScheduleBoard } from "@/components/schedule/schedule-board";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Weekly Staff Schedule — Riverside Paddling Club" },
      {
        name: "description",
        content:
          "Drag-and-drop weekly staff scheduling for a community sports and paddling club: assign coaches, instructors and attendants across programs at a glance.",
      },
      { property: "og:title", content: "Weekly Staff Schedule — Riverside Paddling Club" },
      {
        property: "og:description",
        content:
          "Replace the Excel matrix: drag staff onto a Monday–Sunday grid, colour-coded by program.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <ScheduleBoard />
    </div>
  );
}
