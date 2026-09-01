import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/schedule/site-header";
import { ScheduleBoard } from "@/components/schedule/schedule-board";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Weekly Roster — Riverside Paddling Club" },
      {
        name: "description",
        content:
          "Drag-and-drop weekly summer camp roster: assign lead coaches, assistants and floaters to each program and track participant ratios at a glance.",
      },
      { property: "og:title", content: "Weekly Roster — Riverside Paddling Club" },
      {
        property: "og:description",
        content:
          "Replace the Excel matrix: one clean weekly roster of programs, role slots and participant ratios.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
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
