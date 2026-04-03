import { Link } from "react-router-dom";
import { Sparkles, ExternalLink, Mail, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 border border-primary bg-primary/5 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">
                Eventyy
              </span>
            </Link>
            <p className="text-sm text-text-muted leading-relaxed font-mono">
              University events, competitions, and fests — all in one place.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xs font-bold text-primary font-mono mb-4 uppercase tracking-widest">
              Quick Links
            </h3>
            <ul className="space-y-3">
              {[
                { to: "/events", label: "Events" },
                { to: "/leaderboard", label: "Leaderboard" },
                { to: "/contact", label: "Contact" },
              ].map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-text-muted hover:text-primary transition-colors font-mono uppercase tracking-wider"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Event Types */}
          <div>
            <h3 className="text-xs font-bold text-primary font-mono mb-4 uppercase tracking-widest">
              Event Types
            </h3>
            <ul className="space-y-3 text-sm text-text-muted font-mono">
              <li>⚔️ PVP Competitions</li>
              <li>🏆 Ranked Events</li>
              <li>🎉 Visiting Events</li>
              <li>👥 Solo & Team</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-xs font-bold text-primary font-mono mb-4 uppercase tracking-widest">
              Get in Touch
            </h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="mailto:contact@eventyy.com"
                  className="flex items-center gap-2 text-sm text-text-muted hover:text-primary transition-colors font-mono"
                >
                  <Mail className="w-4 h-4" />
                  contact@eventyy.com
                </a>
              </li>
              <li className="flex items-center gap-2 text-sm text-text-muted font-mono">
                <MapPin className="w-4 h-4" />
                University Campus
              </li>
              <li>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-text-muted hover:text-primary transition-colors font-mono"
                >
                  <ExternalLink className="w-4 h-4" />
                  GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[10px] text-text-dim font-mono tracking-widest uppercase">
            © {new Date().getFullYear()} Eventyy. Built for universities.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-[10px] text-text-dim font-mono tracking-widest uppercase">
              Made with 💚
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
