import { Link } from "react-router-dom";
import { CalendarDays, Clock3, GraduationCap } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#050505]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Link to="/" className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-primary shadow-sm">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-primary">Shobhit University</p>
                <p className="text-sm font-semibold text-white">Gangoh Events</p>
              </div>
            </Link>
            <p className="mt-4 max-w-md text-sm leading-7 text-white/50">
              The official event management platform for campus fests, cultural showcases, technical competitions and student activities at Shobhit University Gangoh.
            </p>
          </div>

          <div>
            <p className="text-xs font-mono uppercase tracking-[0.22em] text-primary">Navigate</p>
            <div className="mt-4 space-y-3 text-sm text-white/50">
              <Link to="/events" className="block hover:text-white transition-colors">
                Events
              </Link>
              <Link to="/schedule" className="block hover:text-white transition-colors">
                Schedule
              </Link>
              <Link to="/my-events" className="block hover:text-white transition-colors">
                My Events
              </Link>
              <Link to="/contact" className="block hover:text-white transition-colors">
                Contact
              </Link>
            </div>
          </div>

          <div>
            <p className="text-xs font-mono uppercase tracking-[0.22em] text-primary">Highlights</p>
            <div className="mt-4 space-y-4 text-sm text-white/50">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-primary" />
                Shobhit University Gangoh identity
              </div>
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" />
                Event-focused browsing
              </div>
              <div className="flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-primary" />
                Schedule-first discovery
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-white/30">
          <p>© {new Date().getFullYear()} Shobhit University Gangoh Events. All rights reserved.</p>
          <p className="text-[10px] uppercase font-mono tracking-[0.2em] text-white/30">dev - Nikunj Saini, Shreya, Vidhi</p>
        </div>
      </div>
    </footer>
  );
}
