import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useInView, type Variants, useSpring, useMotionValue } from "framer-motion";
import {
  CalendarDays, Users, Trophy, ArrowRight,
  Zap, Star, Sparkles, ChevronRight, Clock, MapPin,
} from "lucide-react";
import api from "@/lib/api";
import type { Event } from "@/types";
import { cn, formatDate } from "@/lib/utils";

function useTypewriter(text: string, speed = 42, startDelay = 800) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    setDisplayed(""); setDone(false);
    const start = setTimeout(() => {
      let i = 0;
      const t = setInterval(() => {
        if (i < text.length) { setDisplayed(text.slice(0, ++i)); }
        else { setDone(true); clearInterval(t); }
      }, speed);
      return () => clearInterval(t);
    }, startDelay);
    return () => clearTimeout(start);
  }, [text, speed, startDelay]);
  return { displayed, done };
}

const springPop: Variants = {
  hidden:  { scale: 0.8, opacity: 0 },
  visible: (i: number) => ({
    scale: 1, opacity: 1,
    transition: { type: "spring", stiffness: 340, damping: 20, delay: i * 0.09 },
  }),
};

const slideIn: Variants = {
  hidden:  { x: -28, opacity: 0 },
  visible: (i: number) => ({
    x: 0, opacity: 1,
    transition: { type: "spring", stiffness: 280, damping: 22, delay: i * 0.1 },
  }),
};

const tiltIn: Variants = {
  hidden:  { rotateX: -10, rotateY: 10, scale: 0.9, opacity: 0 },
  visible: (i: number) => ({
    rotateX: 0, rotateY: 0, scale: 1, opacity: 1,
    transition: { type: "spring", stiffness: 260, damping: 20, delay: i * 0.12 },
  }),
};

const charVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { type: "spring", stiffness: 300, damping: 25, delay: i * 0.03 }
  })
};

const MARQUEE_WORDS = [
  "EVENTS", "FESTS", "CONCERTS", "HACKATHONS",
  "WORKSHOPS", "MEETUPS", "EXHIBITIONS", "CULTURAL NIGHTS",
];

const stats = [
  { label: "Events",    value: "50+",  icon: CalendarDays, bg: "bg-primary", text: "text-text-light dark:text-text-dark" },
  { label: "Attendees", value: "2K+",  icon: Users,        bg: "bg-surface-muted-light dark:bg-surface-muted-dark", text: "text-text-light dark:text-text-dark" },
  { label: "Colleges",  value: "30+",  icon: Trophy,       bg: "bg-primary", text: "text-text-light dark:text-text-dark" },
  { label: "Venues",    value: "10+",  icon: Star,         bg: "bg-surface-muted-light dark:bg-surface-muted-dark", text: "text-text-light dark:text-text-dark" },
];

const steps = [
  { num: "01", title: "DISCOVER", desc: "Browse fests, workshops & cultural nights in one place.", icon: Sparkles, bg: "bg-primary",    iconText: "text-text-light",  shadow: "shadow-comic dark:shadow-comic-dark" },
  { num: "02", title: "REGISTER", desc: "Solo or with your crew — lock in your spot instantly.",   icon: Zap,      bg: "bg-surface-muted-light dark:bg-surface-muted-dark", iconText: "text-text-light dark:text-text-dark", shadow: "shadow-comic-yellow" },
  { num: "03", title: "SHOW UP",  desc: "Stand out, make memories, and do it all again.",           icon: Star,     bg: "bg-primary", iconText: "text-text-light", shadow: "shadow-comic dark:shadow-comic-dark" },
];

const CARD_ACCENTS = [
  { top: "bg-primary",   shadow: "shadow-comic-yellow" },
  { top: "bg-border-light dark:bg-border-dark", shadow: "shadow-comic dark:shadow-comic-dark" },
];

export default function HomePage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const heroRef = useRef<HTMLDivElement>(null);
  const heroInView = useInView(heroRef, { once: true });

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 100, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 100, damping: 20 });

  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const { left, top, width, height } = heroRef.current?.getBoundingClientRect() || { left: 0, top: 0, width: 0, height: 0 };
    const x = (clientX - left - width / 2) / 30;
    const y = (clientY - top - height / 2) / 30;
    mouseX.set(x);
    mouseY.set(y);
  };

  const { displayed, done } = useTypewriter(
    "Fests. Concerts. Hackathons. Cultural Nights.",
    44, 800
  );

  useEffect(() => {
    api.get("/events")
      .then((r) => setEvents(r.data.slice(0, 6)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark overflow-x-hidden pt-14 selection:bg-primary selection:text-black" onMouseMove={handleMouseMove}>
      <div className="bg-scanline" />

      {/* HERO SECTION */}
      <section className="relative border-b-2 border-border-light dark:border-border-dark overflow-hidden min-h-[85vh] flex items-center" ref={heroRef}>
        <div className="absolute inset-0 speed-lines pointer-events-none opacity-40" />
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-primary rounded-full opacity-15"
              initial={{ x: Math.random() * 100 + "%", y: Math.random() * 100 + "%" }}
              animate={{ y: [null, Math.random() * 100 + "%"], x: [null, Math.random() * 100 + "%"], scale: [0, 1, 0], opacity: [0, 0.25, 0] }}
              transition={{ duration: 12 + Math.random() * 8, repeat: Infinity, ease: "linear" }}
            />
          ))}
        </div>
        <div className="absolute top-0 right-0 w-[400px] h-[400px] halftone-yellow opacity-15 dark:opacity-10 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 relative z-10 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.9fr] gap-12 items-center">
            
            <div className="flex flex-col items-start translate-y-[-20px]">
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={heroInView ? { opacity: 1, scale: 1 } : {}} className="mb-6">
                <span className="section-label group cursor-default text-[10px] tracking-widest py-1.5 px-3">
                  <Sparkles className="w-3 h-3 text-primary animate-pulse" />
                  Your campus. Your event.
                </span>
              </motion.div>

              <div className="flex flex-col gap-2 items-start">
                <div className="overflow-hidden">
                  <h1 className="font-heading text-[3rem] sm:text-[4rem] lg:text-[5rem] leading-none tracking-tight uppercase flex flex-wrap">
                    {"WELCOME TO".split(" ").map((word, wi) => (
                      <span key={wi} className="flex mr-4" style={{ display: 'flex' }}>
                        {word.split("").map((char, ci) => (
                          <motion.span key={ci} custom={wi * 10 + ci} variants={charVariants} initial="hidden" animate={heroInView ? "visible" : "hidden"}>
                            {char}
                          </motion.span>
                        ))}
                      </span>
                    ))}
                  </h1>
                </div>
                <div className="overflow-hidden mt-1 lg:mt-2">
                  <motion.div initial={{ y: "110%" }} animate={heroInView ? { y: 0 } : {}} transition={{ type: "spring", stiffness: 220, damping: 22, delay: 0.1 }} className="relative inline-block">
                    <span className="font-heading text-[4.5rem] sm:text-[6.2rem] lg:text-[7.2rem] leading-none tracking-tight text-text-light dark:text-text-dark uppercase">EVENTYY</span>
                    <motion.span initial={{ scaleX: 0 }} animate={heroInView ? { scaleX: 1 } : {}} transition={{ delay: 0.4, duration: 0.6, ease: "circOut" }} style={{ originX: 0 }} className="absolute -bottom-1 left-0 right-0 h-4 bg-primary -z-10 shadow-[0_0_15px_rgba(242,194,0,0.3)] animate-pulse-glow" />
                  </motion.div>
                </div>
              </div>

              <motion.div initial={{ opacity: 0 }} animate={heroInView ? { opacity: 1 } : {}} transition={{ delay: 0.8 }} className="mt-8 h-5 font-mono text-[11px] tracking-widest text-text-muted-light dark:text-text-muted-dark flex items-center">
                <div className="bg-primary/5 border-l-2 border-primary px-4 py-1">
                   {displayed}
                   {!done && <span className="tw-cursor" />}
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 15 }} animate={heroInView ? { opacity: 1, y: 0 } : {}} transition={{ type: "spring", stiffness: 250, damping: 22, delay: 1 }} className="mt-10 flex flex-wrap gap-4">
                <Link to="/events" className="cut-tr group relative inline-flex items-center gap-3 px-6 py-2.5 bg-border-light dark:bg-border-dark text-white font-heading text-sm uppercase tracking-[0.2em] shadow-comic-dark dark:shadow-comic-dark-dark transition-all duration-200 hover:-translate-y-1 active:translate-y-0">
                  EXPLORE <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link to="/leaderboard" className="cut-bl group relative inline-flex items-center gap-3 px-6 py-2.5 bg-primary text-black font-heading text-sm uppercase tracking-[0.2em] shadow-comic hover:-translate-y-1 active:translate-y-0 transition-all duration-200">
                  LEADERBOARD <Trophy className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                </Link>
              </motion.div>
            </div>

            <motion.div style={{ x: springX, y: springY }} initial={{ opacity: 0, scale: 0.8 }} animate={heroInView ? { opacity: 1, scale: 1 } : {}} transition={{ type: "spring", stiffness: 180, damping: 20, delay: 0.4 }} className="hidden lg:block relative">
              <div className="relative group">
                <motion.div className="comic-panel shadow-comic-xl dark:shadow-comic-xl-dark bg-white dark:bg-surface-dark relative overflow-hidden" animate={{ y: [0, -8, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}>
                  <div className="absolute top-0 right-0 w-40 h-40 halftone-yellow opacity-25 dark:opacity-10 pointer-events-none -rotate-12 translate-x-10 -translate-y-10" />
                  <div className="h-1.5 bg-primary border-b-2 border-border-light dark:border-border-dark" />
                  <div className="p-7">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="font-heading text-5xl leading-none text-text-light dark:text-text-dark tracking-tighter">EV</div>
                        <div className="font-heading text-[1.1rem] tracking-[0.4em] text-primary uppercase">ENTYY</div>
                      </div>
                      <div className="w-9 h-9 border-2 border-border-light dark:border-border-dark rounded-full flex items-center justify-center bg-surface-muted-light dark:bg-surface-muted-dark">
                        <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                      </div>
                    </div>
                    <div className="h-px bg-border-light/10 dark:bg-border-dark/20 mb-4" />
                    <div className="grid grid-cols-2 gap-2.5">
                      {stats.map((s, i) => (
                        <motion.div key={s.label} custom={i} initial="hidden" animate={heroInView ? "visible" : "hidden"} variants={springPop} className="border-2 border-border-light dark:border-border-dark p-2.5 bg-white dark:bg-surface-muted-dark relative group/stat overflow-hidden">
                          <div className={cn("absolute left-0 top-0 bottom-0 w-1 transition-all group-hover/stat:w-full group-hover/stat:opacity-5", s.bg)} />
                          <div className="relative z-10">
                            <div className="font-heading text-xl leading-none text-text-light dark:text-text-dark group-hover/stat:text-primary transition-colors">{s.value}</div>
                            <div className="text-[8px] font-mono uppercase tracking-widest mt-0.5 text-text-dim-light dark:text-text-dim-dark">{s.label}</div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
                <div className="absolute inset-0 border-2 border-border-light dark:border-border-dark translate-x-3 translate-y-3 bg-primary -z-10 group-hover:translate-x-4 group-hover:translate-y-4 transition-transform duration-300" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="border-b-2 border-border-light dark:border-border-dark bg-border-light dark:bg-border-dark py-2.5 overflow-hidden select-none relative z-20">
        <div className="marquee-track font-heading text-[11px] tracking-[0.25em] text-white gap-0 uppercase">
          {[...MARQUEE_WORDS, ...MARQUEE_WORDS, ...MARQUEE_WORDS].map((w, i) => (
            <span key={i} className="mx-8 flex items-center gap-3">
              {w} <Sparkles className="w-3 h-3 text-primary opacity-50" />
            </span>
          ))}
        </div>
      </div>

      {/* STATS STRIP */}
      <section className="border-b-2 border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4">
            {stats.map((stat, i) => (
              <motion.div key={stat.label} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={springPop} className="p-7 text-center border-r-2 border-border-light dark:border-border-dark last:border-r-0 group cursor-default relative overflow-hidden">
                <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors" />
                <motion.div whileHover={{ scale: 1.15, rotate: -2 }} transition={{ type: "spring", stiffness: 450, damping: 15 }} className="relative z-10">
                  <div className={cn("w-9 h-9 mx-auto mb-2 flex items-center justify-center border-2 border-border-light dark:border-border-dark shadow-comic-sm dark:shadow-comic-sm-dark transition-transform", stat.bg)}>
                    <stat.icon className="w-4.5 h-4.5 text-black" />
                  </div>
                </motion.div>
                <div className="text-3xl font-heading text-text-light dark:text-text-dark mb-0.5 relative z-10">{stat.value}</div>
                <div className="text-[9px] font-mono uppercase tracking-[0.15em] text-text-muted-light dark:text-text-muted-dark relative z-10">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* EVENTS */}
      <section className="py-20 bg-surface-light dark:bg-background-dark relative">
        <div className="absolute inset-0 halftone-yellow opacity-10 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col sm:flex-row items-end justify-between mb-12 gap-6">
            <motion.div custom={0} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={slideIn}>
              <div className="section-label mb-2 group text-[10px]"><CalendarDays className="w-3 h-3 text-primary" /> UPCOMING FESTS</div>
              <h2 className="font-heading text-5xl sm:text-6xl uppercase leading-none tracking-tight">POPULAR <span className="text-primary italic">HAPPENINGS</span></h2>
            </motion.div>
            <Link to="/events" className="text-[10px] font-mono uppercase tracking-[0.2em] text-text-muted-light dark:text-text-muted-dark hover:text-primary transition-all flex items-center gap-2 group pb-1">
              <span>View all events</span>
              <div className="w-6 h-6 rounded-full border-2 border-border-light dark:border-border-dark flex items-center justify-center group-hover:bg-primary group-hover:text-black transition-colors"><ArrowRight className="w-3.5 h-3.5" /></div>
            </Link>
          </div>

          {!loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event, i) => {
                const acc = CARD_ACCENTS[i % CARD_ACCENTS.length];
                return (
                  <motion.div key={event.id} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={tiltIn}>
                    <Link to={`/events/${event.id}`} className="block group h-full">
                      <div className={cn("h-full comic-panel flex flex-col transition-all duration-300", acc.shadow, "hover:scale-[1.012]")}>
                        <div className={cn("h-1.5 border-b-2 border-border-light dark:border-border-dark", acc.top)} />
                        <div className="p-6 flex flex-col flex-1">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-[9px] font-mono uppercase tracking-widest border-2 border-border-light dark:border-border-dark px-1.5 py-0.5 bg-white dark:bg-surface-muted-dark">{event.type}</span>
                            {event.participationType === "TEAM" && <div className="w-5 h-5 border-2 border-border-light dark:border-border-dark bg-primary flex items-center justify-center"><Users className="w-2.5 h-2.5 text-black" /></div>}
                          </div>
                          <h3 className="font-heading text-xl uppercase leading-[1.1] group-hover:text-primary transition-colors mb-2 line-clamp-2 tracking-tight">{event.title}</h3>
                          <p className="text-[11px] text-text-muted-light dark:text-text-muted-dark line-clamp-3 leading-relaxed mb-4 opacity-80">{event.description}</p>
                          <div className="mt-auto pt-5 border-t-2 border-border-light/10 dark:border-border-dark/10 flex flex-col gap-2 text-[10px] text-text-muted-light dark:text-text-muted-dark font-mono">
                            {event.startsAt && (
                              <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-primary" />{formatDate(event.startsAt)}</span>
                            )}
                            {event.venue && (
                              <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-primary" />{event.venue}</span>
                            )}
                            {event.entryFee && <div className="mt-1 text-lg font-heading text-primary tracking-tight">₹{event.entryFee}</div>}
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20 border-t-2 border-b-2 border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark relative overflow-hidden">
        <div className="absolute inset-0 halftone-yellow opacity-15 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-xl mb-12">
            <div className="section-label mb-2 text-[9px]"> // THE PROTOCOL</div>
            <h2 className="font-heading text-5xl sm:text-6xl uppercase leading-none tracking-tight">ZERO FRICTION. <br /><span className="text-primary italic">TOTAL ACCESS.</span></h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((step, i) => (
              <motion.div key={step.num} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={springPop}>
                <div className={cn("comic-panel h-full flex flex-col group overflow-hidden", step.shadow)}>
                  <div className={cn("px-6 py-6 border-b-2 border-border-light dark:border-border-dark flex items-center justify-between", step.bg)}>
                    <div className="w-9 h-9 border-2 border-border-light flex items-center justify-center bg-white"><step.icon className="w-4 h-4 text-black group-hover:rotate-12 transition-transform" /></div>
                    <span className="font-heading text-5xl text-black/10 group-hover:text-black/20 transition-colors uppercase select-none">{step.num}</span>
                  </div>
                  <div className="p-6 flex-1 bg-white dark:bg-surface-dark transition-colors">
                    <h3 className="font-heading text-2xl uppercase mb-1.5 tracking-tight text-text-light dark:text-text-dark">{step.title}</h3>
                    <p className="text-[12px] text-text-muted-light dark:text-text-muted-dark leading-relaxed font-sans opacity-90">{step.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-surface-light dark:bg-background-dark relative">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="relative">
            <div className="comic-panel border-4 border-border-light dark:border-border-dark px-8 py-14 relative z-10 bg-white dark:bg-surface-dark shadow-comic-xl dark:shadow-comic-xl-dark">
              <div className="absolute top-0 right-0 w-28 h-28 halftone-yellow opacity-25 pointer-events-none" />
              <div className="relative z-10">
                <div className="section-label justify-center mb-6 text-[10px]">// JOIN THE CLUB</div>
                <h2 className="font-heading text-7xl uppercase leading-[0.9] mb-2 tracking-tighter">MISSION <span className="text-primary">CONTROL</span></h2>
                <p className="text-[11px] text-text-muted-light dark:text-text-muted-dark font-mono mt-4 mb-8 max-w-sm mx-auto">UNFILTERED ACCESS TO THE BEST EVENTS ON CAMPUS. NO NOISE. NO NONSENSE.</p>
                <div className="flex items-center justify-center">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link to="/signup" className="cut-tr inline-flex items-center gap-2.5 px-6 py-2.5 bg-primary text-black font-heading text-sm uppercase tracking-[0.2em] shadow-comic hover:shadow-comic-lg transition-all">
                      GET ENTYY <Zap className="w-4 h-4 fill-black" />
                    </Link>
                  </motion.div>
                </div>
              </div>
            </div>
            <div className="absolute inset-0 bg-border-light dark:bg-border-dark translate-x-4 translate-y-4 -z-10 opacity-10" />
          </motion.div>
        </div>
      </section>
    </div>
  );
}
