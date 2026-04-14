import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  CalendarDays,
  CreditCard,
  Filter,
  ImageIcon,
  RefreshCw,
  Search,
  Sparkles,
  Users,
  X,
} from "lucide-react";

import api from "@/lib/api";
import { cn, formatDate } from "@/lib/utils";
import type { AudienceScope, Event, EventGroupSummary, ParticipationType } from "@/types";

type EventTab = "active" | "past";

export default function EventsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [groups, setGroups] = useState<EventGroupSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const tab = (searchParams.get("tab") as EventTab | null) ?? "active";
  const participationType = searchParams.get("participationType") as ParticipationType | null;
  const audienceScope = searchParams.get("audienceScope") as AudienceScope | null;
  const requiresPayment = searchParams.get("requiresPayment");

  const fetchGroups = useCallback(
    async (showFullLoader = false) => {
      if (abortRef.current) {
        abortRef.current.abort();
      }

      abortRef.current = new AbortController();

      if (showFullLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      try {
        const response = await api.get("/events/groups", {
          signal: abortRef.current.signal,
        });
        setGroups(response.data);
      } catch (error: unknown) {
        const isAbort = error instanceof Error && error.name === "CanceledError";
        if (!isAbort) {
          setGroups([]);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    void fetchGroups(true);
  }, [fetchGroups]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void fetchGroups(false);
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [fetchGroups]);

  const filteredGroups = useMemo(() => {
    const now = new Date();
    const term = search.trim().toLowerCase();

    return groups
      .map((group) => {
        const nextEvents = (group.events ?? []).filter((event) => {
          const isPast = Boolean(event.endsAt && new Date(event.endsAt) < now);
          const tabMatches = tab === "past" ? isPast : !isPast;
          const participationMatches = participationType ? event.participationType === participationType : true;
          const audienceMatches = audienceScope ? event.audienceScope === audienceScope : true;
          const paymentMatches =
            requiresPayment === "true"
              ? event.requiresPayment
              : requiresPayment === "false"
                ? !event.requiresPayment
                : true;
          const searchMatches =
            term.length === 0 ||
            [group.title, group.subtitle, group.description, event.title, event.description, event.venue]
              .filter(Boolean)
              .some((value) => String(value).toLowerCase().includes(term));

          return tabMatches && participationMatches && audienceMatches && paymentMatches && searchMatches;
        });

        return {
          ...group,
          events: nextEvents,
        };
      })
      .filter((group) => (group.events?.length ?? 0) > 0);
  }, [audienceScope, groups, participationType, requiresPayment, search, tab]);

  const visibleEventsCount = useMemo(
    () => filteredGroups.reduce((count, group) => count + (group.events?.length ?? 0), 0),
    [filteredGroups]
  );

  const setFilter = (key: string, value?: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (!value) {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    setSearchParams(next);
  };

  const clearFilters = () => {
    const next = new URLSearchParams();
    if (tab === "past") {
      next.set("tab", "past");
    }
    setSearchParams(next);
  };

  const hasActiveFilters = Boolean(participationType || audienceScope || requiresPayment);

  return (
    <div className="min-h-screen bg-[#020202] text-white">
      <section className="relative overflow-hidden border-b border-[#ff5665]/20 bg-[#050505]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,86,101,0.18),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(255,86,101,0.12),transparent_28%),linear-gradient(180deg,rgba(12,12,12,0.98),rgba(2,2,2,1))]" />
        <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:36px_36px]" />

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#ff5665]/30 bg-[#13090b] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#ff8994]">
              <Sparkles className="h-3.5 w-3.5" />
              Event Groups
            </div>
            <h1 className="mt-6 text-4xl font-black uppercase tracking-tight text-white sm:text-5xl lg:text-6xl">
              Explore competitions by fest group
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-white/70 sm:text-base">
              Posters, grouped showcases, and full-detail pages now drive the experience. Browse
              active or past events, then open the event card that fits your interest.
            </p>
          </div>

          <div className="mt-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {(["active", "past"] as EventTab[]).map((value) => (
                <button
                  key={value}
                  onClick={() => setFilter("tab", value === "active" ? null : value)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm font-semibold uppercase tracking-[0.14em] transition-colors",
                    tab === value
                      ? "border-[#ff5665] bg-[#ff5665] text-white"
                      : "border-white/10 bg-white/[0.04] text-white/65 hover:text-white"
                  )}
                >
                  {value === "active" ? "Active events" : "Past events"}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative min-w-[260px]">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by title, group, or venue"
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.05] py-3 pl-11 pr-4 text-sm text-white outline-none transition-colors placeholder:text-white/35 focus:border-[#ff5665]"
                />
              </div>
              <button
                onClick={() => setShowFilters((current) => !current)}
                className={cn(
                  "inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold uppercase tracking-[0.14em] transition-colors",
                  showFilters
                    ? "border-[#ff5665] bg-[#ff5665]/10 text-[#ff8994]"
                    : "border-white/10 bg-white/[0.05] text-white/70 hover:text-white"
                )}
              >
                <Filter className="h-4 w-4" />
                Filters
                {hasActiveFilters && (
                  <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#ff5665] text-[10px] font-black text-white">
                    {[participationType, audienceScope, requiresPayment].filter(Boolean).length}
                  </span>
                )}
              </button>
              <button
                onClick={() => void fetchGroups(false)}
                disabled={loading || refreshing}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-white/70 transition-colors hover:text-white disabled:opacity-40"
              >
                <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
                Refresh
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="mt-5 rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
              <div className="grid gap-4 md:grid-cols-3">
                <FilterGroup
                  label="Participation"
                  options={[
                    ["SOLO", "Solo"],
                    ["TEAM", "Team"],
                  ]}
                  activeValue={participationType}
                  onSelect={(value) =>
                    setFilter("participationType", participationType === value ? null : value)
                  }
                />
                <FilterGroup
                  label="Audience"
                  options={[
                    ["OPEN", "Open"],
                    ["UNIVERSITY_ONLY", "University only"],
                  ]}
                  activeValue={audienceScope}
                  onSelect={(value) =>
                    setFilter("audienceScope", audienceScope === value ? null : value)
                  }
                />
                <FilterGroup
                  label="Payment"
                  options={[
                    ["false", "Free"],
                    ["true", "Paid"],
                  ]}
                  activeValue={requiresPayment}
                  onSelect={(value) =>
                    setFilter("requiresPayment", requiresPayment === value ? null : value)
                  }
                />
              </div>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="mt-5 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-[#ff8994] hover:text-white"
                >
                  <X className="h-4 w-4" />
                  Clear filters
                </button>
              )}
            </div>
          )}

          <div className="mt-8 flex flex-wrap items-center gap-3 text-sm text-white/60">
            <span>{visibleEventsCount} event{visibleEventsCount === 1 ? "" : "s"} visible</span>
            <span className="h-1 w-1 rounded-full bg-white/30" />
            <span>{filteredGroups.length} group{filteredGroups.length === 1 ? "" : "s"}</span>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="space-y-8">
              {[1, 2].map((item) => (
                <div key={item} className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6">
                  <div className="h-48 animate-pulse rounded-[1.5rem] bg-white/[0.06]" />
                  <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {[1, 2, 3].map((card) => (
                      <div key={card} className="h-[27rem] animate-pulse rounded-[2rem] bg-white/[0.05]" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="rounded-[2rem] border border-dashed border-white/10 bg-white/[0.03] px-6 py-20 text-center">
              <CalendarDays className="mx-auto h-12 w-12 text-white/35" />
              <h2 className="mt-5 text-2xl font-black uppercase tracking-tight text-white">
                No events matched
              </h2>
              <p className="mt-3 text-sm text-white/60">
                {hasActiveFilters || search
                  ? "Try a different search term or clear a few filters."
                  : "Published event groups will appear here once they are added."}
              </p>
              {(hasActiveFilters || search) && (
                <button
                  onClick={() => {
                    setSearch("");
                    clearFilters();
                  }}
                  className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#ff5665] px-5 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-white"
                >
                  <X className="h-4 w-4" />
                  Reset view
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-10">
              {refreshing && (
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/45">
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  Refreshing groups
                </div>
              )}

              {filteredGroups.map((group) => (
                <article
                  key={group.id}
                  className="overflow-hidden rounded-[2rem] border border-[#ff5665]/20 bg-[#070707] shadow-[0_24px_80px_rgba(255,86,101,0.08)]"
                >
                  <div
                    className="relative border-b border-white/8 px-6 py-8 sm:px-8"
                    style={
                      group.bannerImageUrl
                        ? {
                            backgroundImage: `linear-gradient(180deg,rgba(2,2,2,0.6),rgba(2,2,2,0.94)), url(${group.bannerImageUrl})`,
                            backgroundPosition: "center",
                            backgroundSize: "cover",
                          }
                        : undefined
                    }
                  >
                    {!group.bannerImageUrl && (
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,86,101,0.18),transparent_22%),linear-gradient(135deg,#080808,#131313_55%,#1a0f11)]" />
                    )}

                    <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                      <div className="max-w-3xl">
                        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#ff8994]">
                          {group.subtitle || "Featured event group"}
                        </p>
                        <h2 className="mt-4 text-3xl font-black uppercase tracking-tight text-white sm:text-4xl">
                          {group.title}
                        </h2>
                        <p className="mt-4 max-w-2xl text-sm leading-7 text-white/65">
                          {group.description || "Explore the events inside this fest group."}
                        </p>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-3">
                        <GroupStat
                          icon={CalendarDays}
                          label="Schedule"
                          value={group.startsAt ? formatDate(group.startsAt) : "Coming soon"}
                        />
                        <GroupStat
                          icon={Users}
                          label="Events"
                          value={String(group.events?.length ?? 0)}
                        />
                        <GroupStat
                          icon={CreditCard}
                          label="Access"
                          value={group.audienceScope === "UNIVERSITY_ONLY" ? "University only" : "Open"}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-6 p-6 md:grid-cols-2 xl:grid-cols-3">
                    {(group.events ?? []).map((event) => (
                      <EventPosterCard key={event.id} event={event} group={group} />
                    ))}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function EventPosterCard({ event, group }: { event: Event; group: EventGroupSummary }) {
  const posterImage = event.bannerImageUrl || event.backgroundImageUrl || group.bannerImageUrl;

  return (
    <Link
      to={`/events/${event.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-[2rem] border border-[#ff5665]/55 bg-black shadow-[0_0_0_1px_rgba(255,86,101,0.05),0_18px_50px_rgba(255,86,101,0.12)] transition-transform duration-300 hover:-translate-y-1"
    >
      <div className="relative aspect-[16/9] overflow-hidden rounded-[1.5rem] m-5 mb-0 border border-white/8 bg-[#0e1325]">
        {posterImage ? (
          <img
            src={posterImage}
            alt={event.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(255,86,101,0.16),transparent_24%),linear-gradient(135deg,#141a36,#090909_65%)] text-white/55">
            <div className="text-center">
              <ImageIcon className="mx-auto h-10 w-10" />
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.22em]">
                Poster coming soon
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col px-5 pb-5 pt-8 text-white">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#ff8994]">
          {group.title}
        </p>
        <h3 className="mt-4 text-3xl font-black uppercase leading-tight tracking-tight">
          {event.title}
        </h3>

        <ul className="mt-5 space-y-3 text-sm leading-6 text-white/82">
          <li>
            <span className="font-bold text-white">Registration Fee:</span>{" "}
            {event.requiresPayment && event.entryFee ? `Rs. ${event.entryFee}` : "Free"}
          </li>
          <li>
            <span className="font-bold text-white">Deadline:</span>{" "}
            {event.registrationClosesAt ? formatDate(event.registrationClosesAt) : "Open until announced"}
          </li>
          <li>
            <span className="font-bold text-white">Participation:</span>{" "}
            {event.participationType === "TEAM" ? "Team registration" : "Solo registration"}
          </li>
          <li>
            <span className="font-bold text-white">Venue:</span> {event.venue || "Venue to be announced"}
          </li>
        </ul>

        <div className="mt-6 flex flex-wrap gap-2">
          <EventPill>{event.participationType}</EventPill>
          <EventPill tone={event.requiresPayment ? "warning" : "success"}>
            {event.requiresPayment ? "Paid" : "Free"}
          </EventPill>
          <EventPill tone={event.audienceScope === "UNIVERSITY_ONLY" ? "accent" : "default"}>
            {event.audienceScope === "UNIVERSITY_ONLY" ? "University only" : "Open"}
          </EventPill>
        </div>

        <div className="mt-auto pt-8">
          <span className="inline-flex w-full items-center justify-center rounded-none bg-[#ff5665] px-5 py-4 text-center text-lg font-black uppercase tracking-[0.08em] text-white transition-colors group-hover:bg-[#ff6f7c]">
            View full details
          </span>
        </div>
      </div>
    </Link>
  );
}

function FilterGroup({
  label,
  options,
  activeValue,
  onSelect,
}: {
  label: string;
  options: Array<[string, string]>;
  activeValue: string | null;
  onSelect: (value: string) => void;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/45">{label}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map(([value, optionLabel]) => (
          <button
            key={value}
            onClick={() => onSelect(value)}
            className={cn(
              "rounded-full border px-3 py-2 text-sm transition-colors",
              activeValue === value
                ? "border-[#ff5665] bg-[#ff5665]/10 text-[#ff8994]"
                : "border-white/10 bg-white/[0.03] text-white/65 hover:text-white"
            )}
          >
            {optionLabel}
          </button>
        ))}
      </div>
    </div>
  );
}

function GroupStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.4rem] border border-white/10 bg-black/45 p-4 backdrop-blur-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#ff5665]/10 text-[#ff8994]">
        <Icon className="h-4 w-4" />
      </div>
      <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">{label}</p>
      <p className="mt-2 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function EventPill({
  children,
  tone = "default",
}: {
  children: string;
  tone?: "default" | "success" | "warning" | "accent";
}) {
  const toneClass =
    tone === "success"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
      : tone === "warning"
        ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
        : tone === "accent"
          ? "border-sky-500/30 bg-sky-500/10 text-sky-300"
          : "border-white/10 bg-white/[0.04] text-white/65";

  return (
    <span className={cn("rounded-full border px-3 py-1 text-[11px] font-semibold", toneClass)}>
      {children}
    </span>
  );
}
