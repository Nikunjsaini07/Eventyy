import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Activity,
  CalendarDays,
  Shield,
  Loader2,
  LayoutDashboard,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import type { UserProfile } from "@/types";
import { cn, formatDate } from "@/lib/utils";

export default function MyEventsPage() {
  const { user: authUser } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authUser) {
      navigate("/login");
      return;
    }
    api
      .get("/profile/me")
      .then((res) => setProfile(res.data))
      .catch(() => toast.error("Failed to load events"))
      .finally(() => setLoading(false));
  }, [authUser, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) return null;

  const assignments = profile.coordinatorAssignments || [];
  const registrations = profile.registrations || [];

  return (
    <div className="min-h-screen bg-background">
      <section className="py-16 border-b border-border relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/30 text-primary font-mono text-xs uppercase tracking-widest mb-4">
              <Activity className="w-3 h-3" /> Event Hub
            </div>
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase">
              My <span className="text-primary">Events</span>
            </h1>
            <p className="text-text-muted mt-2 font-mono text-sm max-w-xl">
              Track your event registrations and manage events you are coordinating.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Coordinator Assignments */}
          {assignments.length > 0 && (
            <div>
              <h2 className="text-lg font-black text-white font-mono tracking-widest uppercase mb-6 flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Coordinating Events
              </h2>
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
                            {(ca.event as { title: string })?.title ?? "Event"}
                          </h3>
                          <p className="text-[10px] font-mono text-text-dim tracking-widest uppercase">
                            {formatDate(ca.startsAt)} — {formatDate(ca.endsAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
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
                        <span className="text-[10px] font-bold font-mono text-primary tracking-widest uppercase group-hover:underline">
                          Manage -&gt;
                        </span>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* User Registrations */}
          <div>
            <h2 className="text-lg font-black text-white font-mono tracking-widest uppercase mb-6 flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-primary" />
              My Participations
            </h2>
            {registrations.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-border bg-surface">
                <CalendarDays className="w-12 h-12 mx-auto mb-4 text-border" />
                <p className="text-sm font-mono text-text-muted uppercase tracking-widest">
                  Not registered for any events yet.
                </p>
                <Link
                  to="/events"
                  className="inline-block mt-4 text-xs font-bold font-mono text-primary tracking-widest uppercase hover:underline"
                >
                  Browse Events -&gt;
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {registrations.map((reg, i) => (
                  <motion.div
                    key={reg.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link
                      to={`/events/${reg.eventId}`}
                      className="block bg-surface border border-border hover:border-primary transition-colors p-6 group"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-white uppercase tracking-wider text-sm group-hover:text-primary transition-colors">
                          {(reg.event as { title: string })?.title ?? "Event"}
                        </h3>
                      </div>
                      <p className="text-[10px] font-mono text-text-dim tracking-widest uppercase mb-4">
                        Registered {formatDate(reg.createdAt)}
                      </p>
                      <div className="flex items-center justify-between mt-auto">
                        <span
                          className={cn(
                            "px-2 py-0.5 text-[10px] font-bold font-mono tracking-widest uppercase border",
                            reg.status === "CONFIRMED"
                              ? "border-success/50 text-success bg-success/10"
                              : reg.status === "PENDING"
                              ? "border-warning/50 text-warning bg-warning/10"
                              : reg.status === "CANCELLED"
                              ? "border-danger/50 text-danger bg-danger/10"
                              : "border-secondary/50 text-secondary bg-secondary/10"
                          )}
                        >
                          {reg.status}
                        </span>
                        <span className="text-[10px] font-bold font-mono text-primary tracking-widest uppercase group-hover:underline">
                          View details -&gt;
                        </span>
                      </div>
                    </Link>
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
