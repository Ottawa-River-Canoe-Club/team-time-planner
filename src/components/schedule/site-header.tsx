import { Link } from "@tanstack/react-router";
import { Waves } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { to: "/", label: "Admin schedule" },
  { to: "/my-schedule", label: "My schedule" },
] as const;

export function SiteHeader() {
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-[110rem] flex-wrap items-center gap-4 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Waves className="size-4" aria-hidden />
          </span>
          <div className="leading-tight">
            <div className="text-sm font-semibold text-foreground">Riverside Paddling Club</div>
            <div className="text-xs text-muted-foreground">Weekly staff scheduling</div>
          </div>
        </div>

        <nav className="ml-auto flex items-center gap-1 rounded-md border border-border p-1">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              activeOptions={{ exact: true }}
              activeProps={{ className: cn("bg-secondary text-secondary-foreground") }}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
