import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CalendarDays,
  MapPin,
  Users,
  Clock,
  Trophy,
  Swords,
  Eye,
  Crown,
  UserPlus,
  Loader2,
  CheckCircle,
  XCircle,
  DollarSign,
  Shield,
  Terminal,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import type { Event, EventRegistration } from "@/types";
import { cn, formatDateTime } from "@/lib/utils";

export default function EventDetailPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [memberIds, setMemberIds] = useState("");

  useEffect(() => {
    if (!eventId) return;
    api
      .get(`/events/${eventId}`)
      .then((res) => setEvent(res.data))
      .catch(() => toast.error("Event not found"))
      .finally(() => setLoading(false));
  }, [eventId]);

  const myRegistration = event?.registrations?.find(
    (r: EventRegistration) =>
      r.userId === user?.id ||
      r.team?.captainId === user?.id
  );

  const handleSoloRegister = async () => {
    if (!user) { navigate("/login"); return; }
    setRegistering(true);
    try {
      await api.post(`/events/${eventId}/register`, {});
      toast.success("Registration successful!");
      const { data } = await api.get(`/events/${eventId}`);
      setEvent(data);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Registration failed";
      toast.error(msg);
    } finally {
      setRegistering(false);
    }
  };

  const handleTeamRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { navigate("/login"); return; }
    setRegistering(true);
    try {
      const ids = memberIds.split(",").map((id) => id.trim()).filter(Boolean);
      const payload: Record<string, unknown> = { name: teamName };
      if (ids.length > 0) {
        payload.memberIds = ids;
      }
      await api.post(`/events/${eventId}/register-team`, payload);
      toast.success("Team registered successfully!");
      const { data } = await api.get(`/events/${eventId}`);
      setEvent(data);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Registration failed";
      toast.error(msg);
    } finally {
      setRegistering(false);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await api.delete(`/events/${eventId}/register`);
      toast.success("Registration cancelled");
      const { data } = await api.get(`/events/${eventId}`);
      setEvent(data);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Cancellation failed";
      toast.error(msg);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-text-muted">
        <XCircle className="w-16 h-16 mb-4 opacity-30" />
        <p className="text-lg font-mono uppercase tracking-widest">Event Not Found</p>
        <Link to="/events" className="mt-4 text-primary text-sm font-mono hover:underline uppercase tracking-wider">
          &lt;- Return to Database
        </Link>
      </div>
    );
  }

  const TypeIcon = { PVP: Swords, RANKED: Crown, VISITING: Eye }[event.type] || Eye;
  const regCount = event.registrations?.filter((r) => r.status !== "CANCELLED").length ?? 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative py-20 border-b border-border overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <Link
            to="/events"
            className="inline-flex items-center gap-2 text-text-muted hover:text-white font-mono text-xs uppercase tracking-widest mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            BACK TO DATABASE
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex flex-wrap gap-2 mb-6">
              <span className="px-3 py-1 text-xs font-bold font-mono tracking-widest border border-primary text-primary bg-primary/10 uppercase">
                <TypeIcon className="w-3.5 h-3.5 inline mr-1.5" />
                {event.type}
              </span>
              <span className="px-3 py-1 text-xs font-bold font-mono tracking-widest border border-border bg-surface text-text-muted uppercase">
                {event.participationType === "TEAM" ? (
                  <><Users className="w-3.5 h-3.5 inline mr-1.5" />Team Protocol</>
                ) : (
                  "Solo Protocol"
                )}
              </span>
              {event.audienceScope === "UNIVERSITY_ONLY" && (
                <span className="px-3 py-1 text-xs font-bold font-mono tracking-widest border border-warning/50 text-warning bg-warning/10 uppercase">
                  🎓 UNI ONLY
                </span>
              )}
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white uppercase tracking-tighter">
              {event.title}
            </h1>

            {event.description && (
              <p className="mt-6 text-text-muted leading-relaxed font-mono max-w-2xl text-sm">
                {event.description}
              </p>
            )}

            <div className="mt-8 pt-8 border-t border-border flex flex-wrap gap-6 text-xs text-text-muted font-mono tracking-widest uppercase">
              {event.startsAt && (
                <span className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-primary" />
                  START: {formatDateTime(event.startsAt)}
                </span>
              )}
              {event.endsAt && (
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-border" />
                  END: {formatDateTime(event.endsAt)}
                </span>
              )}
              {event.venue && (
                <span className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  LOC: {event.venue}
                </span>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Details */}
            <div className="lg:col-span-2 space-y-8">
              {/* Event Info Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <InfoCard icon={Users} label="Confirmed" value={String(regCount)} color="text-primary" />
                {event.maxParticipants && (
                  <InfoCard icon={Users} label="Max Capacity" value={String(event.maxParticipants)} color="text-text" />
                )}
                {event.requiresPayment && event.entryFee && (
                  <InfoCard icon={DollarSign} label="Access Fee" value={`₹${event.entryFee}`} color="text-warning" />
                )}
                {event.roundCount && (
                  <InfoCard icon={Trophy} label="Stages" value={String(event.roundCount)} color="text-primary" />
                )}
                {event.winnerCount && (
                  <InfoCard icon={Crown} label="Victors" value={String(event.winnerCount)} color="text-text" />
                )}
              </div>

              {/* Team size */}
              {event.participationType === "TEAM" && (
                <div className="p-6 bg-surface border border-border">
                  <h3 className="text-xs font-bold font-mono text-primary tracking-widest uppercase mb-2 flex items-center gap-2">
                    <Terminal className="w-4 h-4" /> Team Parameter Requirements
                  </h3>
                  <p className="text-sm font-mono text-text-muted leading-relaxed">
                    {event.teamSizeMin && event.teamSizeMax
                      ? `Valid squad size: ${event.teamSizeMin} to ${event.teamSizeMax} units.`
                      : event.teamSizeMax
                      ? `Maximum squad capacity: ${event.teamSizeMax} units.`
                      : "Unrestricted unit count."}
                  </p>
                </div>
              )}

              {/* Bracket & Leaderboard links */}
              {event.type === "PVP" && (
                <Link
                  to={`/events/${event.id}/bracket`}
                  className="flex items-center gap-4 p-5 bg-surface border border-border hover:border-primary transition-colors group"
                >
                  <Swords className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-bold font-mono tracking-widest text-white uppercase group-hover:text-primary transition-colors">Access Bracket Stream -&gt;</span>
                </Link>
              )}
              {event.type === "RANKED" && (
                <Link
                  to={`/leaderboard/${event.id}`}
                  className="flex items-center gap-4 p-5 bg-surface border border-border hover:border-primary transition-colors group"
                >
                  <Trophy className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-bold font-mono tracking-widest text-white uppercase group-hover:text-primary transition-colors">Access Global Leaderboard -&gt;</span>
                </Link>
              )}

              {/* Registrations list */}
              {event.registrations && event.registrations.length > 0 && (
                <div>
                  <h3 className="text-sm font-black text-white font-mono tracking-widest uppercase mb-4 border-b border-border pb-2">
                    Active Rosters ({regCount})
                  </h3>
                  <div className="space-y-3">
                    {event.registrations
                      .filter((r) => r.status !== "CANCELLED")
                      .map((reg) => (
                        <div
                          key={reg.id}
                          className="flex items-center justify-between py-3 px-4 bg-surface border border-border"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-8 h-8 bg-primary/10 border border-primary flex items-center justify-center text-xs font-bold text-primary font-mono uppercase">
                              {reg.team
                                ? reg.team.name?.[0]?.toUpperCase()
                                : reg.user?.fullName?.[0]?.toUpperCase() ?? "?"}
                            </div>
                            <div>
                              <span className="text-sm font-bold font-mono text-white uppercase tracking-wider block">
                                {reg.team ? reg.team.name : reg.user?.fullName}
                              </span>
                              {reg.team && (
                                <p className="text-[10px] uppercase font-mono text-text-muted mt-0.5">
                                  {reg.team.members?.length ?? 0} UNITS
                                </p>
                              )}
                            </div>
                          </div>
                          <span
                            className={cn(
                              "text-[10px] font-bold px-2 py-1 uppercase tracking-widest font-mono border",
                              reg.status === "CONFIRMED"
                                ? "bg-success/10 text-success border-success/30"
                                : reg.status === "PENDING"
                                ? "bg-warning/10 text-warning border-warning/30"
                                : "bg-text-muted/10 text-text-muted border-text-muted/30"
                            )}
                          >
                            {reg.status}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Coordinators */}
              {event.coordinatorAssignments && event.coordinatorAssignments.length > 0 && (
                <div>
                  <h3 className="text-sm font-black text-white font-mono tracking-widest uppercase mb-3 text-text-muted">Command Structure</h3>
                  <div className="flex flex-wrap gap-3">
                    {event.coordinatorAssignments.map((ca) => (
                      <div
                        key={ca.id}
                        className="flex items-center gap-2 px-3 py-1.5 bg-surface border border-border text-xs font-mono tracking-widest uppercase"
                      >
                        <Shield className="w-3.5 h-3.5 text-primary" />
                        <span className="text-text">
                          {(ca as unknown as { user?: { fullName: string } }).user?.fullName ?? "Admin"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Registration */}
            <div>
              <div className="sticky top-24 bg-surface border border-primary/50 p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-8 h-8 bg-primary/10" />
                <h3 className="text-lg font-black text-white tracking-widest uppercase mb-6 font-mono border-b border-border pb-4">
                  Registration Node
                </h3>

                {myRegistration ? (
                  <div className="space-y-6">
                    <div className="flex flex-col gap-3 p-5 bg-primary/5 border border-primary">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                        <p className="text-xs font-black font-mono tracking-widest text-primary uppercase">Identity Confirmed</p>
                      </div>
                      <p className="text-[10px] text-text-muted font-mono tracking-widest uppercase pl-8">
                        STATUS: {myRegistration.status}
                      </p>
                    </div>
                    {myRegistration.status !== "CANCELLED" && (
                      <button
                        onClick={handleCancel}
                        disabled={cancelling}
                        className="w-full flex items-center justify-center gap-2 py-3 border border-danger/50 text-danger text-xs font-bold font-mono uppercase tracking-widest hover:bg-danger/10 transition-colors disabled:opacity-50"
                      >
                        {cancelling ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <XCircle className="w-4 h-4" />
                            ABORT REGISTRATION
                          </>
                        )}
                      </button>
                    )}
                  </div>
                ) : event.status === "PUBLISHED" ? (
                  event.participationType === "SOLO" ? (
                    <button
                      onClick={handleSoloRegister}
                      disabled={registering}
                      className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-black font-bold font-mono text-sm tracking-widest uppercase transition-colors hover:bg-primary-light disabled:opacity-50"
                    >
                      {registering ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <UserPlus className="w-5 h-5" />
                          INITIALIZE SOLO
                        </>
                      )}
                    </button>
                  ) : (
                    <form onSubmit={handleTeamRegister} className="space-y-5">
                      <div>
                        <label className="block text-[10px] font-bold text-primary font-mono tracking-widest uppercase mb-1.5">
                          Squad Designation
                        </label>
                        <input
                          type="text"
                          value={teamName}
                          onChange={(e) => setTeamName(e.target.value)}
                          required
                          placeholder="ENTER TEAM NAME..."
                          className="w-full px-4 py-3 bg-background border border-border text-text text-sm font-mono placeholder:text-text-dim focus:outline-none focus:border-primary transition-colors uppercase"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-primary font-mono tracking-widest uppercase mb-1.5">
                          External Units (CSV)
                        </label>
                        <input
                          type="text"
                          value={memberIds}
                          onChange={(e) => setMemberIds(e.target.value)}
                          placeholder="ID1, ID2, ID3"
                          className="w-full px-4 py-3 bg-background border border-border text-text text-sm font-mono placeholder:text-text-dim focus:outline-none focus:border-primary transition-colors uppercase"
                        />
                        <p className="text-[10px] text-text-dim mt-2 font-mono uppercase">
                          Leave empty to deploy without external units
                        </p>
                      </div>
                      <button
                        type="submit"
                        disabled={registering || !teamName}
                        className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-black font-bold font-mono text-sm tracking-widest uppercase transition-colors hover:bg-primary-light disabled:opacity-50"
                      >
                        {registering ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <>
                            <Users className="w-5 h-5" />
                            DEPLOY SQUAD
                          </>
                        )}
                      </button>
                    </form>
                  )
                ) : (
                  <div className="p-4 bg-surface border border-border border-dashed text-center">
                    <p className="text-[10px] font-mono tracking-widest uppercase text-text-muted">
                      Registration pathway offline.
                    </p>
                  </div>
                )}

                {/* Registration window */}
                {(event.registrationOpensAt || event.registrationClosesAt) && (
                  <div className="mt-6 pt-4 border-t border-border space-y-2 text-[10px] text-text-muted font-mono tracking-widest uppercase">
                    {event.registrationOpensAt && (
                      <p>R-OPEN: {formatDateTime(event.registrationOpensAt)}</p>
                    )}
                    {event.registrationClosesAt && (
                      <p>R-CLOSE: {formatDateTime(event.registrationClosesAt)}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function InfoCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="p-5 bg-surface border border-border text-center overflow-hidden relative">
      <Icon className={cn("w-6 h-6 mx-auto mb-3", color, "opacity-70")} />
      <div className="text-2xl font-black text-white font-mono tracking-tighter mb-1">{value}</div>
      <div className="text-[10px] font-bold text-text-muted font-mono tracking-widest uppercase">{label}</div>
    </div>
  );
}
