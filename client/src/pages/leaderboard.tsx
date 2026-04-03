import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Trophy, Medal, Crown, Loader2, ArrowLeft, Search, Star } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { cn } from "@/lib/utils";

interface Score {
  id: string;
  registration: {
    team?: { name: string };
    user?: { fullName: string; email: string };
  };
  score: number;
}

interface Event {
  id: string;
  title: string;
}

export default function LeaderboardPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const [scores, setScores] = useState<Score[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>(eventId || "");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch RANKED events for the dropdown
    api
      .get("/events?type=RANKED")
      .then((res) => {
        setEvents(res.data);
        if (!selectedEventId && res.data.length > 0) {
          setSelectedEventId(res.data[0].id);
        }
      })
      .catch(() => toast.error("Failed to load events"))
      .finally(() => {
        if (!eventId && !selectedEventId) setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!selectedEventId) return;
    setLoading(true);
    api
      .get(`/competition/events/${selectedEventId}/leaderboard`)
      .then((res) => setScores(res.data))
      .catch(() => toast.error("Failed to load leaderboard"))
      .finally(() => setLoading(false));
  }, [selectedEventId]);

  const selectedEvent = events.find((e) => e.id === selectedEventId);

  return (
    <div className="min-h-screen bg-background">
      <section className="py-16 border-b border-border relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center justify-center w-14 h-14 bg-primary/10 border border-primary text-primary mb-6">
              <Trophy className="w-6 h-6" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tighter uppercase mb-4">
              Hall of <span className="text-primary">Fame</span>
            </h1>
            <p className="text-text-muted font-mono text-sm max-w-2xl mx-auto uppercase tracking-widest">
              Top performers across ranked events
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
            <Link
              to="/events"
              className="inline-flex items-center gap-2 text-text-muted hover:text-white text-xs font-mono uppercase tracking-widest transition-colors mr-auto"
            >
              <ArrowLeft className="w-4 h-4" /> BROWSE EVENTS
            </Link>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-surface border border-border text-text focus:outline-none focus:border-primary transition-colors appearance-none font-mono text-sm tracking-widest uppercase cursor-pointer"
              >
                <option value="" disabled>Select Event</option>
                {events.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-surface border border-border p-6 sm:p-8 relative">
            {/* Corner accents */}
            <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-primary/50 pointer-events-none" />
            <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-primary/50 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-primary/50 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-primary/50 pointer-events-none" />

            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : scores.length === 0 ? (
              <div className="text-center py-20">
                <Star className="w-12 h-12 text-border mx-auto mb-4" />
                <p className="text-sm font-mono text-text-muted tracking-widest uppercase">
                  No scores recorded yet for {selectedEvent?.title || "this event"}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {scores.map((score, index) => (
                  <motion.div
                    key={score.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div
                      className={cn(
                        "flex items-center justify-between p-4 sm:p-6 border transition-colors relative overflow-hidden",
                        index === 0
                          ? "bg-primary/5 border-primary"
                          : index === 1
                          ? "bg-surface-light border-border hover:border-white/20"
                          : index === 2
                          ? "bg-surface border-border hover:border-white/20"
                          : "bg-background border-border hover:border-white/10"
                      )}
                    >
                      {index === 0 && (
                        <div className="absolute right-0 top-0 w-24 h-24 bg-primary/10 blur-2xl pointer-events-none" />
                      )}

                      <div className="flex items-center gap-4 sm:gap-6 relative z-10">
                        <div
                          className={cn(
                            "w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center border font-mono font-bold text-lg",
                            index === 0
                              ? "bg-primary text-black border-primary"
                              : index === 1
                              ? "bg-surface text-white border-border"
                              : index === 2
                              ? "bg-surface bottom border-border text-white"
                              : "bg-transparent border-transparent text-text-muted"
                          )}
                        >
                          {index === 0 ? <Crown className="w-6 h-6" /> : `#${index + 1}`}
                        </div>

                        <div>
                          <p className={cn("font-bold uppercase tracking-wider text-sm sm:text-base", index === 0 ? "text-primary" : "text-white")}>
                            {score.registration.team?.name || score.registration.user?.fullName}
                          </p>
                          <p className="text-[10px] sm:text-xs font-mono text-text-dim uppercase tracking-widest mt-1">
                            {score.registration.team ? "Team Entry" : "Solo Entry"}
                          </p>
                        </div>
                      </div>

                      <div className="text-right relative z-10">
                        <p className={cn("text-2xl sm:text-3xl font-black font-mono tracking-tighter", index === 0 ? "text-primary" : "text-white")}>
                          {score.score}
                        </p>
                        <p className="text-[10px] font-mono text-text-dim uppercase tracking-widest">
                          PTS
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
