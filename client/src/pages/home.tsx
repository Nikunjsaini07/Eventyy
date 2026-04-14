import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, CreditCard, MapPin, Sparkles, Users } from "lucide-react";

import api from "@/lib/api";
import { formatDate } from "@/lib/utils";
import type { Event } from "@/types";

const aboutSections = [
  {
    eyebrow: "The Experience",
    title: "A campus festival home, not just an event list.",
    description:
      "We're shaping this platform around the energy of Shobhit University Gangoh. It should feel like one destination where the whole festival comes alive, while registrations and student flows stay simple underneath."
  },
  {
    eyebrow: "The Campus",
    title: "Shobhit University Gangoh",
    description:
      "From cultural showcases to technical competitions, every event belongs to the larger university experience. The goal is a cleaner public-facing site with the same warmth and scale as a proper fest website."
  }
];

export default function HomePage() {
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

  const featuredEvents = useMemo(() => events.slice(0, 6), [events]);

  const stats = useMemo(
    () => [
      { label: "Published Events", value: String(events.length) },
      { label: "Team Friendly", value: String(events.filter((event) => event.participationType === "TEAM").length) },
      { label: "Paid Entries", value: String(events.filter((event) => event.requiresPayment).length) }
    ],
    [events]
  );

  const schedulePreview = useMemo(() => {
    return [...events]
      .filter((event) => event.startsAt)
      .sort((left, right) => new Date(left.startsAt!).getTime() - new Date(right.startsAt!).getTime())
      .slice(0, 4);
  }, [events]);

  return (
    <div className="bg-[#020202] text-white">
      {/* ─── HERO SECTION ─── */}
      <section className="relative overflow-hidden border-b border-white/10 min-h-[90vh] flex items-center">
        {/* Background image */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-[#020202]" />

        <div className="relative mx-auto flex w-full max-w-7xl flex-col items-center justify-center gap-12 px-4 py-24 text-center sm:px-6 lg:px-8">
          <div className="flex flex-col items-center max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.28em] text-primary backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5" />
              Shobhit University Gangoh
            </div>

            <h1 className="mt-8 text-5xl font-black tracking-tight text-white sm:text-6xl lg:text-[5.5rem] drop-shadow-xl leading-[1.1]">
              Campus events & fest experiences
            </h1>
            <p className="mt-6 font-cursive text-4xl text-white/80 md:text-5xl drop-shadow-md">
              Where students come together
            </p>
            <p className="mt-6 max-w-2xl text-base leading-8 text-white/60 sm:text-lg">
              Browse events, follow the schedule, register for competitions, and keep track of everything happening at your university — all in one place.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row justify-center w-full max-w-xl">
              <Link
                to="/events"
                className="flex-1 inline-flex items-center justify-center rounded-lg bg-primary px-8 py-4 text-sm font-bold uppercase tracking-[0.1em] text-white transition-all hover:bg-primary-dark hover:shadow-[0_0_30px_rgba(255,86,101,0.3)]"
              >
                Explore Events
              </Link>
              <Link
                to="/schedule"
                className="flex-1 inline-flex items-center justify-center rounded-lg border border-white/20 bg-white/5 px-8 py-4 text-sm font-bold uppercase tracking-[0.1em] text-white backdrop-blur-sm transition-all hover:bg-white/10"
              >
                View Schedule
              </Link>
            </div>

            <div className="mt-16 grid grid-cols-3 gap-8 text-white w-full max-w-3xl">
              {stats.map((stat) => (
                <div key={stat.label} className="flex flex-col items-center rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                  <p className="text-3xl font-black">{stat.value}</p>
                  <p className="mt-2 text-xs font-mono uppercase tracking-[0.15em] text-white/50">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── ABOUT SECTION ─── */}
      <section className="border-b border-white/10 py-16">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          {aboutSections.map((section) => (
            <div key={section.title} className="rounded-[2rem] border border-white/10 bg-[#070707] p-8 shadow-sm">
              <p className="text-xs font-mono uppercase tracking-[0.22em] text-primary">{section.eyebrow}</p>
              <h2 className="mt-4 text-3xl font-black tracking-tight text-white">{section.title}</h2>
              <p className="mt-4 text-sm leading-7 text-white/60">{section.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── FEATURED EVENTS ─── */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-mono uppercase tracking-[0.22em] text-primary">Upcoming events</p>
              <h2 className="mt-3 text-4xl font-black tracking-tight text-white">What students can join right now</h2>
            </div>
            <Link to="/events" className="text-sm font-semibold text-primary hover:text-primary-light transition-colors">
              View all events →
            </Link>
          </div>

          {loading ? (
            <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-72 animate-pulse rounded-[2rem] border border-white/10 bg-white/[0.03]" />
              ))}
            </div>
          ) : featuredEvents.length === 0 ? (
            <div className="mt-10 rounded-[2rem] border border-dashed border-white/10 bg-white/[0.03] px-6 py-16 text-center">
              <CalendarDays className="mx-auto h-10 w-10 text-white/30" />
              <h3 className="mt-4 text-lg font-semibold text-white">No published events yet</h3>
              <p className="mt-2 text-sm text-white/50">As soon as the first events go live, they'll appear here.</p>
            </div>
          ) : (
            <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {featuredEvents.map((event) => (
                <Link
                  key={event.id}
                  to={`/events/${event.id}`}
                  className="group overflow-hidden rounded-[2rem] border border-white/10 bg-[#070707] shadow-sm transition-all hover:-translate-y-1 hover:border-primary/40"
                >
                  <div className="h-44 bg-[linear-gradient(135deg,#ff5665,#10183c)]" />
                  <div className="p-6">
                    <div className="flex flex-wrap gap-2">
                      <Badge>{event.participationType}</Badge>
                      <Badge tone={event.requiresPayment ? "warning" : "success"}>
                        {event.requiresPayment ? "Paid" : "Free"}
                      </Badge>
                    </div>
                    <h3 className="mt-4 text-2xl font-bold text-white transition-colors group-hover:text-primary">
                      {event.title}
                    </h3>
                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-white/50">
                      {event.description || "Details for this event will appear here once the admin adds them."}
                    </p>
                    <div className="mt-5 space-y-2 text-sm text-white/40">
                      <p>{event.startsAt ? formatDate(event.startsAt) : "Date coming soon"}</p>
                      <p>{event.venue || "Venue to be announced"}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ─── SCHEDULE PREVIEW ─── */}
      <section className="border-t border-white/10 bg-[#050505] py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-mono uppercase tracking-[0.22em] text-primary">Schedule preview</p>
              <h2 className="mt-3 text-4xl font-black tracking-tight text-white">A simpler timeline view</h2>
            </div>
            <Link to="/schedule" className="text-sm font-semibold text-primary hover:text-primary-light transition-colors">
              Open full schedule →
            </Link>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-2">
            {schedulePreview.length === 0 ? (
              <div className="rounded-[2rem] border border-dashed border-white/10 bg-white/[0.03] px-6 py-12 text-sm text-white/50">
                Event dates will show here once published events include a schedule.
              </div>
            ) : (
              schedulePreview.map((event, index) => (
                <div key={event.id} className="rounded-[2rem] border border-white/10 bg-[#070707] p-6 shadow-sm">
                  <div className="flex items-start gap-5">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <span className="text-lg font-black">{String(index + 1).padStart(2, "0")}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-mono uppercase tracking-[0.18em] text-white/40">
                        {event.startsAt ? formatDate(event.startsAt) : "Date coming soon"}
                      </p>
                      <h3 className="mt-2 text-xl font-bold text-white">{event.title}</h3>
                      <p className="mt-2 text-sm text-white/50">{event.venue || "Venue to be announced"}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function MiniHighlight({
  icon: Icon,
  label,
  text
}: {
  icon: typeof CalendarDays;
  label: string;
  text: string;
}) {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-sm font-semibold text-white">{label}</p>
        <p className="mt-1 text-sm leading-6 text-white/50">{text}</p>
      </div>
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
