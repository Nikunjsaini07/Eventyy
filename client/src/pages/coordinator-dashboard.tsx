import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Loader2,
  Trophy,
  Swords,
  ArrowLeft,
  Plus,
  CheckCircle,
  Save,
  List,
  Terminal,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import type { Event, EventRegistration } from "@/types";
import { cn, formatDate } from "@/lib/utils";

export default function CoordinatorDashboard() {
  const { eventId } = useParams<{ eventId: string }>();
  const { user, isCoordinator, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || (!isCoordinator && !isAdmin)) {
      navigate("/");
    }
  }, [user, isCoordinator, isAdmin, navigate]);

  if (eventId) {
    return <EventManagement eventId={eventId} />;
  }

  return <DashboardHub />;
}

function DashboardHub() {
  const { user } = useAuth();
  const assignments = user?.coordinatorAssignments || [];

  return (
    <div className="min-h-screen bg-background">
      <section className="py-16 border-b border-border relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/30 text-primary font-mono text-xs uppercase tracking-widest mb-4">
              <LayoutDashboard className="w-3 h-3" /> Coordinator Mode
            </div>
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase">
              Coordinator <span className="text-primary">Dashboard</span>
            </h1>
            <p className="text-text-muted mt-2 font-mono text-sm">
              Manage your assigned events
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {assignments.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-border">
              <LayoutDashboard className="w-12 h-12 mx-auto mb-4 text-border" />
              <p className="text-sm font-mono text-text-muted uppercase tracking-widest">
                No active assignments
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assignments.map((ca, i) => (
                <motion.div
                  key={ca.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link
                    to={`/coordinator/${ca.eventId}`}
                    className="block bg-surface border border-border hover:border-primary transition-colors p-6 group"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-primary/10 border border-primary/30 flex items-center justify-center">
                        <LayoutDashboard className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white uppercase tracking-wider text-sm group-hover:text-primary transition-colors">
                          {ca.event?.title ?? "Event"}
                        </h3>
                        <p className="text-[10px] font-mono text-text-dim tracking-widest uppercase">
                          {formatDate(ca.startsAt)} — {formatDate(ca.endsAt)}
                        </p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        "px-2 py-0.5 text-[10px] font-bold font-mono tracking-widest uppercase border",
                        ca.isActive
                          ? "border-success/50 text-success bg-success/10"
                          : "border-border text-text-dim bg-background"
                      )}
                    >
                      {ca.isActive ? "ACTIVE" : "ENDED"}
                    </span>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function EventManagement({ eventId }: { eventId: string }) {
  const [event, setEvent] = useState<Event | null>(null);
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"registrations" | "rounds" | "results">(
    "registrations"
  );

  const [roundName, setRoundName] = useState("");
  const [roundNumber, setRoundNumber] = useState(1);
  const [syncingRounds, setSyncingRounds] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get(`/competition/events/${eventId}/registrations`),
      api.get(`/events/${eventId}`),
    ])
      .then(([regRes, eventRes]) => {
        setRegistrations(regRes.data.registrations || []);
        setEvent(eventRes.data);
      })
      .catch(() => toast.error("Failed to load event data"))
      .finally(() => setLoading(false));
  }, [eventId]);

  const handleSyncRound = async (e: React.FormEvent) => {
    e.preventDefault();
    setSyncingRounds(true);
    try {
      await api.post(`/competition/events/${eventId}/rounds`, {
        rounds: [{ roundNumber, name: roundName }],
      });
      toast.success("Round synced!");
      setRoundName("");
      setRoundNumber((prev) => prev + 1);
      const { data } = await api.get(`/events/${eventId}`);
      setEvent(data);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed";
      toast.error(msg);
    } finally {
      setSyncingRounds(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const regCount = registrations.filter(
    (r) => r.status !== "CANCELLED"
  ).length;

  return (
    <div className="min-h-screen bg-background">
      <section className="py-12 border-b border-border relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <Link
            to="/coordinator"
            className="inline-flex items-center gap-2 text-text-muted hover:text-white text-xs font-mono uppercase tracking-widest mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            DASHBOARD
          </Link>
          <h1 className="text-2xl font-black text-white uppercase tracking-tighter">
            {event?.title ?? "Event"}
          </h1>
          <p className="text-text-muted text-xs font-mono mt-1 tracking-widest uppercase">
            Manage registrations, rounds, and results
          </p>
        </div>
      </section>

      <section className="py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Tabs */}
          <div className="flex bg-surface border border-border p-1 mb-8 w-fit">
            {(["registrations", "rounds", "results"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "px-5 py-2 text-xs font-bold font-mono tracking-widest uppercase transition-all capitalize",
                  tab === t
                    ? "bg-primary text-black"
                    : "text-text-muted hover:text-white"
                )}
              >
                {t}
              </button>
            ))}
          </div>

          {tab === "registrations" && (
            <div>
              <h2 className="text-sm font-black text-white font-mono tracking-widest uppercase mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                Registrations ({regCount})
              </h2>
              {registrations.length === 0 ? (
                <p className="text-text-muted text-xs font-mono">
                  No registrations yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {registrations.map((reg) => (
                    <div
                      key={reg.id}
                      className="flex items-center justify-between p-4 bg-surface border border-border"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-primary/10 border border-primary flex items-center justify-center text-xs font-bold text-primary font-mono">
                          {reg.team
                            ? reg.team.name?.[0]?.toUpperCase()
                            : reg.user?.fullName?.[0]?.toUpperCase() ?? "?"}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                            {reg.team ? reg.team.name : reg.user?.fullName}
                          </p>
                          <p className="text-[10px] font-mono text-text-dim uppercase tracking-widest">
                            {reg.user?.email ?? ""}
                            {reg.team?.members
                              ? ` • ${reg.team.members.length} members`
                              : ""}
                          </p>
                        </div>
                      </div>
                      <span
                        className={cn(
                          "px-2 py-0.5 text-[10px] font-bold font-mono tracking-widest uppercase border",
                          reg.status === "CONFIRMED"
                            ? "border-success/50 text-success bg-success/10"
                            : reg.status === "PENDING"
                            ? "border-warning/50 text-warning bg-warning/10"
                            : "border-danger/50 text-danger bg-danger/10"
                        )}
                      >
                        {reg.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "rounds" && (
            <div>
              <h2 className="text-sm font-black text-white font-mono tracking-widest uppercase mb-4 flex items-center gap-2">
                <List className="w-4 h-4 text-primary" />
                Rounds
              </h2>

              {event?.rounds && event.rounds.length > 0 && (
                <div className="space-y-2 mb-6">
                  {event.rounds.map((round) => (
                    <div
                      key={round.id}
                      className="flex items-center justify-between p-4 bg-surface border border-border"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 border border-primary flex items-center justify-center text-sm font-bold text-primary font-mono">
                          {round.roundNumber}
                        </div>
                        <span className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                          {round.name}
                        </span>
                      </div>
                      {round.isOptional && (
                        <span className="text-[10px] font-mono text-text-dim uppercase tracking-widest">
                          Optional
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <form
                onSubmit={handleSyncRound}
                className="p-5 bg-surface border border-primary/30"
              >
                <h3 className="text-xs font-bold text-primary font-mono tracking-widest uppercase mb-3 flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add Round
                </h3>
                <div className="flex gap-3">
                  <input
                    type="number"
                    value={roundNumber}
                    onChange={(e) => setRoundNumber(parseInt(e.target.value))}
                    min={1}
                    placeholder="Round #"
                    className="w-20 px-3 py-2 bg-background border border-border text-text text-sm font-mono focus:outline-none focus:border-primary"
                  />
                  <input
                    type="text"
                    value={roundName}
                    onChange={(e) => setRoundName(e.target.value)}
                    required
                    placeholder="Round name"
                    className="flex-1 px-4 py-2 bg-background border border-border text-text text-sm font-mono placeholder:text-text-dim focus:outline-none focus:border-primary"
                  />
                  <button
                    type="submit"
                    disabled={syncingRounds}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-black text-xs font-bold font-mono tracking-widest uppercase hover:bg-primary-light disabled:opacity-50"
                  >
                    {syncingRounds ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    SYNC
                  </button>
                </div>
              </form>
            </div>
          )}

          {tab === "results" && (
            <div>
              <h2 className="text-sm font-black text-white font-mono tracking-widest uppercase mb-4 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-primary" />
                Results
              </h2>

              {event?.type === "PVP" && (
                <Link
                  to={`/events/${eventId}/bracket`}
                  className="flex items-center gap-4 p-5 bg-surface border border-border hover:border-primary transition-colors mb-4 group"
                >
                  <Swords className="w-5 h-5 text-primary" />
                  <span className="text-sm font-bold font-mono tracking-widest text-white uppercase group-hover:text-primary transition-colors">
                    View Bracket -&gt;
                  </span>
                </Link>
              )}

              {event?.type === "RANKED" && (
                <Link
                  to={`/leaderboard/${eventId}`}
                  className="flex items-center gap-4 p-5 bg-surface border border-border hover:border-primary transition-colors mb-4 group"
                >
                  <Trophy className="w-5 h-5 text-primary" />
                  <span className="text-sm font-bold font-mono tracking-widest text-white uppercase group-hover:text-primary transition-colors">
                    View Leaderboard -&gt;
                  </span>
                </Link>
              )}

              <div className="p-6 bg-surface border border-border text-center">
                <CheckCircle className="w-10 h-10 text-border mx-auto mb-3" />
                <p className="text-xs font-mono text-text-muted tracking-widest uppercase">
                  Use the API to publish results and manage matches.
                </p>
                <p className="text-[10px] font-mono text-text-dim mt-2 tracking-widest uppercase">
                  <Terminal className="w-3 h-3 inline mr-1" />
                  POST /competition/events/{eventId}/matches
                </p>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
