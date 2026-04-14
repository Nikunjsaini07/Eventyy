import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, Clock3, MapPin } from "lucide-react";

import api from "@/lib/api";
import { formatDate, formatDateTime } from "@/lib/utils";
import type { Event } from "@/types";

type GroupedSchedule = {
  label: string;
  sortValue: number;
  events: Event[];
};

export default function SchedulePage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    api
      .get("/events")
      .then((response) => {
        if (!ignore) {
          setEvents(response.data);
        }
      })
      .catch(() => {
        if (!ignore) {
          setEvents([]);
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  const groupedSchedule = useMemo<GroupedSchedule[]>(() => {
    const groups = new Map<string, GroupedSchedule>();

    events.forEach((event) => {
      const dateKey = event.startsAt ? formatDate(event.startsAt) : "Date To Be Announced";
      const sortValue = event.startsAt ? new Date(event.startsAt).getTime() : Number.MAX_SAFE_INTEGER;
      const existing = groups.get(dateKey);

      if (existing) {
        existing.events.push(event);
      } else {
        groups.set(dateKey, {
          label: dateKey,
          sortValue,
          events: [event]
        });
      }
    });

    return [...groups.values()]
      .map((group) => ({
        ...group,
        events: [...group.events].sort((left, right) => {
          const leftValue = left.startsAt ? new Date(left.startsAt).getTime() : Number.MAX_SAFE_INTEGER;
          const rightValue = right.startsAt ? new Date(right.startsAt).getTime() : Number.MAX_SAFE_INTEGER;
          return leftValue - rightValue;
        })
      }))
      .sort((left, right) => left.sortValue - right.sortValue);
  }, [events]);

  return (
    <div className="bg-background text-text">
      <section className="border-b border-border bg-surface/70">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <p className="text-xs font-mono uppercase tracking-[0.22em] text-primary">Festival schedule</p>
          <h1 className="mt-3 text-5xl font-black tracking-tight text-text">Browse the event timeline</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-text-muted">
            A cleaner schedule-first view inspired by university fest websites. Events are grouped by date so
            students can quickly see what’s coming up next.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="space-y-6">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-44 animate-pulse rounded-[2rem] border border-border bg-surface" />
              ))}
            </div>
          ) : groupedSchedule.length === 0 ? (
            <div className="rounded-[2rem] border border-dashed border-border bg-surface px-6 py-16 text-center">
              <CalendarDays className="mx-auto h-10 w-10 text-text-dim" />
              <h2 className="mt-4 text-lg font-semibold text-text">No scheduled events yet</h2>
              <p className="mt-2 text-sm text-text-muted">
                Once published events include dates, the schedule will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {groupedSchedule.map((group) => (
                <section key={group.label}>
                  <div className="sticky top-20 z-10 flex items-center gap-3 border-b border-border bg-background/90 py-3 backdrop-blur">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <CalendarDays className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-mono uppercase tracking-[0.18em] text-text-dim">Schedule day</p>
                      <h2 className="text-2xl font-black text-text">{group.label}</h2>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-5 lg:grid-cols-2">
                    {group.events.map((event) => (
                      <Link
                        key={event.id}
                        to={`/events/${event.id}`}
                        className="rounded-[2rem] border border-white/10 bg-[#070707] p-6 shadow-sm transition-colors hover:border-primary/30"
                      >
                        <div className="flex flex-wrap gap-2">
                          <Badge>{event.participationType}</Badge>
                          <Badge tone={event.requiresPayment ? "warning" : "success"}>
                            {event.requiresPayment ? "Paid" : "Free"}
                          </Badge>
                        </div>

                        <h3 className="mt-4 text-2xl font-bold text-text">{event.title}</h3>
                        <p className="mt-3 text-sm leading-6 text-text-muted">
                          {event.description || "Event details will be updated by the admin."}
                        </p>

                        <div className="mt-5 space-y-3 text-sm text-text-muted">
                          <div className="flex items-center gap-2">
                            <Clock3 className="h-4 w-4 text-primary" />
                            <span>
                              {event.startsAt ? formatDateTime(event.startsAt) : "Time to be announced"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-primary" />
                            <span>{event.venue || "Venue to be announced"}</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function Badge({
  children,
  tone = "default"
}: {
  children: string;
  tone?: "default" | "success" | "warning";
}) {
  const classes =
    tone === "success"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
      : tone === "warning"
        ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
        : "border-white/10 bg-white/[0.04] text-white/60";

  return <span className={`rounded-full border px-3 py-1 text-[11px] font-medium ${classes}`}>{children}</span>;
}
