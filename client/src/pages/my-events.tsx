import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CalendarDays, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

import { useAuth } from "@/context/auth-context";
import api from "@/lib/api";
import { cn, formatDate, formatDateTime } from "@/lib/utils";
import type { EventRegistration, UserProfile } from "@/types";

export default function MyEventsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    api
      .get("/profile/me")
      .then((response) => setProfile(response.data))
      .catch(() => toast.error("Failed to load your event activity"))
      .finally(() => setLoading(false));
  }, [navigate, user]);

  const activities = useMemo(
    () =>
      profile?.activities?.registrations ?? {
        upcoming: [],
        ongoingOrRecent: profile?.registrations ?? [],
        past: [],
      },
    [profile]
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-background text-text">
      <section className="border-b border-border bg-surface/70">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
          <p className="text-xs font-mono uppercase tracking-[0.22em] text-primary">My events</p>
          <h1 className="mt-3 text-5xl font-black tracking-tight text-text">Your registrations in one place</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-text-muted">
            Track upcoming registrations, recent participation, and older event history in one simple view.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-3">
            <ActivityColumn title="Upcoming" emptyText="No upcoming registrations" items={activities.upcoming} />
            <ActivityColumn
              title="Ongoing / Recent"
              emptyText="No active registrations right now"
              items={activities.ongoingOrRecent}
            />
            <ActivityColumn title="Past" emptyText="No past events yet" items={activities.past} />
          </div>
        </div>
      </section>
    </div>
  );
}

function ActivityColumn({
  title,
  emptyText,
  items,
}: {
  title: string;
  emptyText: string;
  items: EventRegistration[];
}) {
  return (
    <div className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <CalendarDays className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-text">{title}</h2>
          <p className="text-xs uppercase tracking-[0.18em] text-text-dim">{items.length} items</p>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="mt-6 text-sm text-text-muted">{emptyText}</p>
      ) : (
        <div className="mt-6 space-y-3">
          {items.map((registration) => (
            <Link
              key={registration.id}
              to={`/events/${registration.eventId}`}
              className="block rounded-2xl border border-border bg-background p-4 transition-colors hover:border-primary/40"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-base font-semibold text-text">
                    {registration.event?.title ?? "Event"}
                  </h3>
                  <p className="mt-1 text-xs text-text-muted">
                    {registration.event?.startsAt
                      ? formatDateTime(registration.event.startsAt)
                      : "Date to be announced"}
                  </p>
                  <p className="mt-1 text-xs text-text-muted">
                    Registered on {formatDate(registration.createdAt)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-[11px] font-medium",
                      registration.status === "CONFIRMED"
                        ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"
                        : registration.status === "PENDING"
                          ? "bg-amber-500/10 text-amber-300 border border-amber-500/30"
                          : registration.status === "CANCELLED"
                            ? "bg-rose-500/10 text-rose-300 border border-rose-500/30"
                            : "bg-white/5 text-white/60 border border-white/10"
                    )}
                  >
                    {registration.status}
                  </span>
                  {registration.team && (
                    <div className="flex flex-col gap-1.5 items-end">
                      <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-bold text-primary">
                        {registration.team.name}
                      </span>
                      <span className="text-[9px] font-mono text-text-muted">
                        Code: {registration.team.id}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
