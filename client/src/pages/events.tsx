import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion, type Variants } from "framer-motion";
import {
  Search,
  Filter,
  CalendarDays,
  Users,
  Clock,
  MapPin,
  ChevronDown,
  X,
  Crown,
  Swords,
  Eye,
  Terminal
} from "lucide-react";
import api from "@/lib/api";
import type { Event, EventType, ParticipationType } from "@/types";
import { cn, formatDate } from "@/lib/utils";

const eventTypeIcons: Record<string, typeof Swords> = {
  PVP: Swords,
  RANKED: Crown,
  VISITING: Eye,
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.4 },
  }),
};

export default function EventsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const typeFilter = searchParams.get("type") as EventType | null;
  const participationFilter = searchParams.get("participationType") as ParticipationType | null;
  const tab = searchParams.get("tab") || "active";

  useEffect(() => {
    const params: Record<string, string> = {};
    if (typeFilter) params.type = typeFilter;
    if (participationFilter) params.participationType = participationFilter;

    api
      .get("/events", { params })
      .then((res) => setEvents(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [typeFilter, participationFilter]);

  const now = new Date();
  const activeEvents = events.filter(
    (e) => !e.endsAt || new Date(e.endsAt) >= now
  );
  const pastEvents = events.filter(
    (e) => e.endsAt && new Date(e.endsAt) < now
  );
  const displayEvents = tab === "active" ? activeEvents : pastEvents;

  const filteredEvents = displayEvents.filter((e) =>
    e.title.toLowerCase().includes(search.toLowerCase())
  );

  // Group by fest (using metadata.festName)
  const festGroups = new Map<string, Event[]>();
  const ungrouped: Event[] = [];

  filteredEvents.forEach((event) => {
    const festName = (event.metadata as Record<string, unknown>)?.festName as string | undefined;
    if (festName) {
      if (!festGroups.has(festName)) festGroups.set(festName, []);
      festGroups.get(festName)!.push(event);
    } else {
      ungrouped.push(event);
    }
  });

  const setFilter = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    setSearchParams(params);
  };

  return (
    <div className="min-h-screen bg-background text-text">
      {/* Hero */}
      <section className="py-20 relative border-b border-border overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />
        <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none -translate-y-1/2" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="inline-flex items-center justify-center gap-2 px-3 py-1 bg-surface border border-border text-primary font-mono text-xs uppercase tracking-widest mb-4">
              <Terminal className="w-3 h-3" /> Event Database
            </div>
            <h1 className="text-5xl font-black text-white tracking-tighter uppercase">
              Operational <span className="text-primary">Events</span>
            </h1>
            <p className="text-text-muted mt-3 max-w-xl font-mono text-sm leading-relaxed">
              Discover and inject into upcoming fests, brackets, and campus operations.
            </p>
          </motion.div>

          {/* Tabs + Search */}
          <div className="mt-12 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex bg-surface border border-border p-1">
              {["active", "past"].map((t) => (
                <button
                  key={t}
                  onClick={() => setFilter("tab", t === "active" ? null : t)}
                  className={cn(
                    "px-6 py-2 text-xs font-bold font-mono tracking-widest uppercase transition-all",
                    tab === t
                      ? "bg-primary text-black"
                      : "text-text-muted hover:text-white hover:bg-surface-light"
                  )}
                >
                  {t === "active" ? "Active" : "Archived"}
                </button>
              ))}
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="QUERY DATABASE..."
                  className="w-full pl-10 pr-4 py-2 bg-surface border border-border text-text text-sm font-mono placeholder:text-text-dim focus:outline-none focus:border-primary transition-colors uppercase"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  "flex items-center justify-center gap-2 px-4 py-2 border font-mono text-xs tracking-widest uppercase font-bold transition-all",
                  showFilters
                    ? "bg-primary text-black border-primary"
                    : "bg-surface border-border text-text-muted hover:text-white"
                )}
              >
                <Filter className="w-4 h-4" />
                Filters
                <ChevronDown className={cn("w-4 h-4 transition-transform", showFilters && "rotate-180")} />
              </button>
            </div>
          </div>

          {/* Filters panel */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 p-5 bg-surface border border-border flex flex-wrap gap-4 items-center"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs text-primary font-mono tracking-widest uppercase">Type:</span>
                <div className="flex gap-2">
                  {(["PVP", "RANKED", "VISITING"] as EventType[]).map((type) => {
                    const Icon = eventTypeIcons[type];
                    return (
                      <button
                        key={type}
                        onClick={() => setFilter("type", typeFilter === type ? null : type)}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold font-mono uppercase tracking-widest border transition-all",
                          typeFilter === type
                            ? "bg-primary/10 border-primary text-primary"
                            : "bg-background border-border text-text-muted hover:text-white"
                        )}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {type}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="w-px h-6 bg-border mx-2 hidden sm:block" />

              <div className="flex items-center gap-2">
                <span className="text-xs text-primary font-mono tracking-widest uppercase">Format:</span>
                <div className="flex gap-2">
                  {(["SOLO", "TEAM"] as ParticipationType[]).map((pt) => (
                    <button
                      key={pt}
                      onClick={() => setFilter("participationType", participationFilter === pt ? null : pt)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold font-mono uppercase tracking-widest border transition-all",
                        participationFilter === pt
                          ? "bg-primary/10 border-primary text-primary"
                          : "bg-background border-border text-text-muted hover:text-white"
                      )}
                    >
                      {pt}
                    </button>
                  ))}
                </div>
              </div>

              {(typeFilter || participationFilter) && (
                <button
                  onClick={() => {
                    setFilter("type", null);
                    setFilter("participationType", null);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold font-mono uppercase tracking-widest text-danger hover:bg-danger/10 border border-transparent hover:border-danger/30 transition-colors ml-auto sm:ml-0"
                >
                  <X className="w-3.5 h-3.5" />
                  Clear
                </button>
              )}
            </motion.div>
          )}
        </div>
      </section>

      {/* Events Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-80 border border-border bg-surface animate-pulse" />
              ))}
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-24 border border-border border-dashed">
              <CalendarDays className="w-12 h-12 mx-auto mb-4 text-border" />
              <p className="text-lg font-mono text-text-muted uppercase tracking-widest">No Events Found</p>
              <p className="text-sm mt-2 text-text-dim">Adjust parameters to retry query.</p>
            </div>
          ) : (
            <>
              {/* Fest Groups */}
              {Array.from(festGroups.entries()).map(([festName, festEvents]) => (
                <div key={festName} className="mb-16">
                  <div className="mb-6 p-6 bg-surface border-l-4 border-l-primary border-t border-b border-r border-border">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/10 border border-primary/30 flex items-center justify-center">
                        <Crown className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tight">{festName}</h2>
                        <p className="text-xs font-mono text-primary mt-1 tracking-widest uppercase">
                          {festEvents.length} Payload{festEvents.length > 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {festEvents.map((event, i) => (
                      <EventCard key={event.id} event={event} index={i} />
                    ))}
                  </div>
                </div>
              ))}

              {/* Ungrouped Events */}
              {ungrouped.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {ungrouped.map((event, i) => (
                    <EventCard key={event.id} event={event} index={i} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function EventCard({ event, index }: { event: Event; index: number }) {
  const TypeIcon = eventTypeIcons[event.type] || Eye;

  return (
    <motion.div
      custom={index}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={fadeUp}
    >
      <Link to={`/events/${event.id}`} className="block group h-full">
        <div className="h-full bg-surface border border-border hover:border-primary transition-colors flex flex-col relative overflow-hidden">
          {/* Header */}
          <div className="h-40 bg-surface-lighter border-b border-border relative flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-dot opacity-30" />
            <TypeIcon className="w-16 h-16 text-surface-light group-hover:text-border transition-colors -rotate-12 scale-150 absolute right-4 bottom-4" />
            
            <div className="absolute top-4 right-4 relative z-10">
              <span className="px-3 py-1 text-[10px] font-mono tracking-widest uppercase border border-primary/50 text-primary bg-background">
                {event.type}
              </span>
            </div>
            
            {event.participationType === "TEAM" && (
              <div className="absolute top-4 left-4 relative z-10">
                <span className="px-3 py-1 text-[10px] font-mono tracking-widest uppercase border border-border text-text bg-background">
                  <Users className="w-3 h-3 inline mr-1 mb-[1px]" />
                  Team
                </span>
              </div>
            )}

            {event.audienceScope === "UNIVERSITY_ONLY" && (
              <div className="absolute bottom-4 left-4 relative z-10">
                <span className="px-3 py-1 text-[10px] font-mono tracking-widest uppercase border border-warning/50 text-warning bg-background">
                  UNI ONLY
                </span>
              </div>
            )}
          </div>

          <div className="p-6 flex-1 flex flex-col">
            <h3 className="text-lg font-bold text-white uppercase group-hover:text-primary transition-colors mb-2 line-clamp-1">
              {event.title}
            </h3>
            {event.description && (
              <p className="text-sm text-text-muted mb-6 flex-1 line-clamp-2">
                {event.description}
              </p>
            )}
            <div className="mt-auto pt-4 border-t border-border flex flex-col gap-3 text-xs text-text-dim font-mono uppercase tracking-wider">
              {event.startsAt && (
                <span className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  {formatDate(event.startsAt)}
                </span>
              )}
              {event.venue && (
                <span className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  {event.venue}
                </span>
              )}
              {event.requiresPayment && event.entryFee && (
                <span className="flex items-center gap-2 mt-1 py-1 text-primary">
                  <div className="w-1.5 h-1.5 bg-primary rounded-none animate-pulse-slow" />
                  FEE: ₹{event.entryFee}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
