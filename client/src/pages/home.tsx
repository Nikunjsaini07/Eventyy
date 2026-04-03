import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, type Variants } from "framer-motion";
import {
  CalendarDays,
  Users,
  Trophy,
  ArrowRight,
  Zap,
  Star,
  Sparkles,
  ChevronRight,
  Clock,
  MapPin,
} from "lucide-react";
import api from "@/lib/api";
import type { Event } from "@/types";
import { cn, formatDate } from "@/lib/utils";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" },
  }),
};

const stats = [
  { label: "EVENTS HOSTED", value: "50+", icon: CalendarDays },
  { label: "PARTICIPANTS", value: "2000+", icon: Users },
  { label: "COMPETITIONS", value: "30+", icon: Trophy },
  { label: "UNIVERSITIES", value: "10+", icon: Star },
];

const steps = [
  {
    num: "01",
    title: "DISCOVER",
    desc: "Browse upcoming fests, competitions, and college events.",
    icon: Sparkles,
  },
  {
    num: "02",
    title: "REGISTER",
    desc: "Solo or with your team - sign up instantly with simple OTP.",
    icon: Zap,
  },
  {
    num: "03",
    title: "COMPETE",
    desc: "Participate in brackets and climb the leaderboard.",
    icon: Trophy,
  },
];

export default function HomePage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/events")
      .then((res) => setEvents(res.data.slice(0, 6)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="overflow-hidden bg-background">
      {/* Hero Section */}
      <section className="relative min-h-[95vh] flex items-center border-b border-border bg-grid">
        {/* Glow behind text */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/10 blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full pt-20">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 border border-primary/30 bg-primary/5 text-xs font-mono text-primary mb-8 tracking-widest uppercase"
            >
              <Sparkles className="w-3 h-3" />
              Event Management Platform
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-6xl sm:text-7xl lg:text-8xl font-black leading-[1.1] tracking-tighter uppercase text-white"
            >
              Where Campus
              <br />
              <span className="text-glow text-primary">Comes Alive</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="mt-8 text-lg sm:text-xl text-text-muted max-w-2xl mx-auto font-medium"
            >
              Discover epic fests, compete in PVP brackets, climb ranked leaderboards, and make unforgettable college memories.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="mt-12 flex flex-col sm:flex-row justify-center gap-4 sm:gap-6"
            >
              <Link
                to="/events"
                className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-primary text-black font-bold font-mono tracking-widest text-sm hover:bg-primary-light transition-colors group"
              >
                EXPLORE EVENTS
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/leaderboard"
                className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-surface text-white border border-border font-bold font-mono tracking-widest text-sm hover:bg-border transition-colors"
              >
                LEADERBOARD
                <Trophy className="w-4 h-4" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats - Grid layout */}
      <section className="border-b border-border bg-surface">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-border">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="p-8 sm:p-12 text-center group hover:bg-surface-light transition-colors relative overflow-hidden"
              >
                <div className="relative z-10">
                  <stat.icon className="w-6 h-6 mx-auto mb-4 text-primary opacity-80 group-hover:opacity-100 transition-opacity" />
                  <div className="text-4xl sm:text-5xl font-black text-white font-mono tracking-tighter mb-2">{stat.value}</div>
                  <div className="text-xs font-bold text-text-muted font-mono tracking-widest">{stat.label}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Events */}
      <section className="py-24 relative">
        <div className="absolute top-0 right-0 w-1/3 h-[500px] bg-grid opacity-30 pointer-events-none mask-image:linear-gradient(to_bottom,black,transparent)" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col sm:flex-row items-baseline justify-between mb-16 gap-6">
            <div>
              <h2 className="text-4xl font-black text-white tracking-tighter uppercase">Upcoming Events</h2>
              <p className="text-primary font-mono text-sm tracking-widest mt-2 uppercase">Systems online. Action pending.</p>
            </div>
            <Link
              to="/events"
              className="inline-flex items-center gap-2 text-primary hover:text-white transition-colors text-sm font-mono tracking-widest font-bold group"
            >
              VIEW ALL
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-80 border border-border bg-surface animate-pulse" />
              ))}
            </div>
          ) : events.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {events.map((event, i) => (
                <motion.div
                  key={event.id}
                  custom={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                >
                  <Link
                    to={`/events/${event.id}`}
                    className="block group h-full"
                  >
                    <div className="h-full bg-surface border border-border hover:border-primary transition-colors flex flex-col relative overflow-hidden">
                      {/* Top Graphic */}
                      <div className="h-40 bg-surface-lighter border-b border-border relative flex items-center justify-center overflow-hidden">
                        <div className="absolute inset-0 bg-dot opacity-30" />
                        <div className="text-5xl font-black text-surface-light group-hover:text-border transition-colors uppercase tracking-tighter absolute -right-4 -bottom-4 select-none">
                          {event.type}
                        </div>
                        
                        <div className="absolute top-4 right-4 relative z-10">
                          <span className="px-3 py-1 text-[10px] font-mono tracking-widest uppercase border border-primary/50 text-primary bg-primary/10">
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
                      </div>

                      {/* Content */}
                      <div className="p-6 flex-1 flex flex-col">
                        <h3 className="text-xl font-bold text-white uppercase group-hover:text-primary transition-colors mb-2">
                          {event.title}
                        </h3>
                        {event.description && (
                          <p className="text-sm text-text-muted line-clamp-2 mb-6">
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
                              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse-slow" />
                              FEE: ₹{event.entryFee}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-24 border border-border border-dashed">
              <CalendarDays className="w-12 h-12 mx-auto mb-4 text-border" />
              <p className="text-lg font-mono text-text-muted uppercase tracking-widest">No Active Parameters</p>
              <p className="text-sm mt-2 text-text-dim">Systems stand by for new events.</p>
            </div>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 border-y border-border bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tighter uppercase">Execution Sequence</h2>
            <p className="text-primary font-mono text-sm tracking-widest mt-3 uppercase">Three steps to integration</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-border text-center divide-y md:divide-y-0 md:divide-x divide-border bg-background">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="p-10 relative group hover:bg-surface transition-colors"
              >
                <div className="absolute top-4 left-4 text-border font-black text-5xl opacity-40 group-hover:text-primary/20 group-hover:scale-110 transition-all font-mono pointer-events-none">
                  {step.num}
                </div>
                <div className="inline-flex items-center justify-center w-12 h-12 border border-border bg-surface mb-6 relative z-10 group-hover:border-primary transition-colors">
                  <step.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-white mb-3 uppercase tracking-wider relative z-10">{step.title}</h3>
                <p className="text-sm text-text-muted leading-relaxed font-mono relative z-10">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 bg-background relative border-b border-border overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-50" />
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="p-12 border border-primary/30 bg-primary/5 backdrop-blur-[2px]"
          >
            <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tighter uppercase mb-6">
              Initialize <span className="text-primary">Sequence</span>
            </h2>
            <p className="text-text-muted font-mono leading-relaxed mb-10 max-w-xl mx-auto">
              Terminal ready. Authenticate to access events, deploy teams, and view the global standings.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-6">
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-primary text-black font-bold font-mono tracking-widest text-sm hover:bg-primary-light transition-colors group"
              >
                AUTHENTICATE
                <Zap className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
