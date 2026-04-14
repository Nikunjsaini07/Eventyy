import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Briefcase, CalendarDays, ChevronDown, ListChecks, LogIn, LogOut, Menu, User, X } from "lucide-react";

import { useAuth } from "@/context/auth-context";
import { cn } from "@/lib/utils";

const publicLinks = [
  { to: "/events", label: "Events" },
  { to: "/schedule", label: "Schedule" }
];

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
    setMenuOpen(false);
  }, [location.pathname]);

  const isCoordinator = user?.effectiveRoles?.includes("COORDINATOR") ?? false;

  const navLinks = [...publicLinks, ...(user ? [{ to: "/my-events", label: "My Events" }] : [])];

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#020202]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-12 items-center justify-center rounded-lg bg-white/5 py-1 px-3 shadow-sm border border-white/10">
            <img src="/shobhit-logo.png" alt="Shobhit University Logo" className="h-8 w-auto object-contain" />
          </div>
        </Link>

        <div className="hidden items-center gap-2 md:flex">
          {navLinks.map((link) => {
            const active = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  "rounded-full px-4 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-white/10 text-white shadow-sm"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                )}
              >
                {link.label}
              </Link>
            );
          })}
          {isCoordinator && (
            <Link
              to="/coordinator"
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors",
                location.pathname === "/coordinator"
                  ? "bg-primary/15 text-primary border border-primary/30"
                  : "text-primary/80 hover:bg-primary/10 hover:text-primary border border-primary/20"
              )}
            >
              <ListChecks className="h-4 w-4" />
              Coordinator
            </Link>
          )}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((current) => !current)}
                className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-3 py-2 shadow-sm transition-colors hover:border-primary/30"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {user.fullName?.[0]?.toUpperCase() ?? "U"}
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-white">{user.fullName}</p>
                  <p className="text-xs text-white/50">{isAdmin ? "Admin" : isCoordinator ? "Coordinator" : "Student"}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-white/40" />
              </button>

              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18 }}
                    className="absolute right-0 mt-3 w-64 overflow-hidden rounded-3xl border border-white/10 bg-[#0a0a0a] shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
                  >
                    <div className="border-b border-white/10 px-5 py-4">
                      <p className="text-sm font-semibold text-white">{user.fullName}</p>
                      <p className="mt-1 text-xs text-white/50">{user.email}</p>
                    </div>
                    <div className="p-2">
                      <Link
                        to="/profile"
                        className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-white/60 transition-colors hover:bg-white/5 hover:text-white"
                      >
                        <User className="h-4 w-4" />
                        Profile
                      </Link>
                      {isCoordinator && (
                        <Link
                          to="/coordinator"
                          className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-white/60 transition-colors hover:bg-white/5 hover:text-white"
                        >
                          <ListChecks className="h-4 w-4" />
                          Coordinator Desk
                        </Link>
                      )}
                      {isAdmin && (
                        <Link
                          to="/admin"
                          className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-white/60 transition-colors hover:bg-white/5 hover:text-white"
                        >
                          <Briefcase className="h-4 w-4" />
                          Admin Console
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm text-rose-400 transition-colors hover:bg-rose-500/10"
                      >
                        <LogOut className="h-4 w-4" />
                        Logout
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-dark"
            >
              <LogIn className="h-4 w-4" />
              Login
            </Link>
          )}
        </div>

        <button
          onClick={() => setMobileOpen((current) => !current)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white shadow-sm md:hidden"
          aria-label="Toggle navigation"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-white/10 bg-[#050505] md:hidden"
          >
            <div className="space-y-1 px-4 py-4">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={cn(
                    "block rounded-2xl px-4 py-3 text-sm font-medium",
                    location.pathname === link.to ? "bg-white/10 text-white shadow-sm" : "text-white/60"
                  )}
                >
                  {link.label}
                </Link>
              ))}

              {user ? (
                <>
                  <Link to="/profile" className="block rounded-2xl px-4 py-3 text-sm font-medium text-white/60">
                    Profile
                  </Link>
                  {isCoordinator && (
                    <Link to="/coordinator" className="block rounded-2xl px-4 py-3 text-sm font-medium text-white/60">
                      Coordinator Desk
                    </Link>
                  )}
                  {isAdmin && (
                    <Link to="/admin" className="block rounded-2xl px-4 py-3 text-sm font-medium text-white/60">
                      Admin Console
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="block w-full rounded-2xl px-4 py-3 text-left text-sm font-medium text-rose-400"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="mt-2 block rounded-2xl bg-primary px-4 py-3 text-center text-sm font-semibold text-white"
                >
                  Login
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
