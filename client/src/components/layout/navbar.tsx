import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon, Menu, X, Home, CalendarDays, Trophy, Mail, User, LogIn, LogOut, LayoutDashboard, Shield, Sparkles, Bell, Activity } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { cn } from "@/lib/utils";

const navLinks = [
  { to: "/", label: "Home", icon: Home },
  { to: "/events", label: "Events", icon: CalendarDays },
  { to: "/contact", label: "Contact", icon: Mail },
];

export default function Navbar() {
  const { user, logout, isCoordinator, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined") {
      return document.documentElement.classList.contains("dark") || localStorage.getItem("theme") === "dark";
    }
    return false;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  const handleLogout = () => {
    logout();
    setProfileOpen(false);
    navigate("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background-light dark:bg-background-dark border-b-2 border-border-light dark:border-border-dark transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 border-2 border-border-light dark:border-border-dark bg-primary flex items-center justify-center shadow-comic-sm group-hover:-translate-y-0.5 transition-transform duration-200">
              <Sparkles className="w-3.5 h-3.5 text-black" />
            </div>
            <span className="text-sm font-heading font-bold text-text-light dark:text-text-dark tracking-[0.2em] hidden sm:block">
              EVENTYY
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={cn(
                    "px-3 py-1 text-[11px] font-mono tracking-widest uppercase transition-all duration-150 relative text-text-muted-light dark:text-text-muted-dark hover:text-primary",
                    isActive && "text-primary font-bold"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="nav-active"
                      className="absolute inset-x-0 bottom-0 h-0.5 bg-primary"
                      transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    <link.icon className="w-3 h-3" />
                    {link.label}
                  </span>
                </Link>
              );
            })}

            {user && (
              <Link
                to="/my-events"
                className={cn(
                  "px-3 py-1 text-[11px] font-mono tracking-widest uppercase transition-all duration-200 flex items-center gap-1.5 text-text-muted-light dark:text-text-muted-dark hover:text-primary",
                  location.pathname.startsWith("/my-events") && "text-primary"
                )}
              >
                <Activity className="w-3.5 h-3.5" />
                MY EVENTS
              </Link>
            )}

            {isAdmin && (
              <Link
                to="/admin"
                className={cn(
                  "px-3 py-1 text-[11px] font-mono tracking-widest uppercase transition-all duration-200 flex items-center gap-1.5 text-text-muted-light dark:text-text-muted-dark hover:text-danger",
                  location.pathname.startsWith("/admin") && "text-danger"
                )}
              >
                <Shield className="w-3.5 h-3.5" />
                ADMIN
              </Link>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <button
              onClick={() => setIsDark(!isDark)}
              className="p-1.5 border-2 border-border-light dark:border-border-dark bg-surface-muted-light dark:bg-surface-muted-dark shadow-comic-sm dark:shadow-comic-sm-dark hover:-translate-y-0.5 transition-all"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-3.5 h-3.5 text-primary" /> : <Moon className="w-3.5 h-3.5 text-primary" />}
            </button>

            {user ? (
              <div className="flex items-center gap-2">
                <button
                  className="p-1.5 text-text-muted hover:text-primary transition-colors relative"
                  aria-label="Notifications"
                >
                  <Bell className="w-4 h-4 text-text-light dark:text-text-dark" />
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_8px_rgba(242,194,0,0.4)]" />
                </button>
                <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-lg hover:bg-surface-muted-light dark:hover:bg-surface-muted-dark transition-colors"
                >
                  <div className="w-6 h-6 border border-primary bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold font-mono">
                    {user.fullName?.[0]?.toUpperCase() ?? "U"}
                  </div>
                  <span className="text-xs font-medium text-text-light dark:text-text-dark max-w-[100px] truncate hidden sm:block">
                    {user.fullName.split(' ')[0]}
                  </span>
                </button>

                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.98, y: -5 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98, y: -5 }}
                      transition={{ duration: 0.1 }}
                      className="absolute right-0 mt-2 w-48 bg-surface-light dark:bg-surface-dark border-2 border-border-light dark:border-border-dark shadow-comic-lg dark:shadow-comic-lg-dark overflow-hidden z-50"
                    >
                      <div className="px-3 py-2 border-b border-border-light/10 dark:border-border-dark/10">
                        <p className="text-xs font-bold text-text-light dark:text-text-dark truncate">{user.fullName}</p>
                      </div>
                      <div className="py-1">
                        <Link
                          to="/profile"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-[11px] text-text-muted font-mono uppercase tracking-widest hover:bg-surface-muted-light dark:hover:bg-surface-muted-dark transition-colors"
                        >
                          <User className="w-3 h-3" />
                          Profile
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-3 py-2 text-[11px] text-danger font-mono uppercase tracking-widest hover:bg-danger/10 transition-colors"
                        >
                          <LogOut className="w-3 h-3" />
                          Logout
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="text-[11px] font-mono uppercase tracking-widest text-text-muted hover:text-text-light dark:hover:text-text-dark transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="px-3 py-1.5 border-2 border-border bg-primary text-black text-[10px] font-mono font-bold tracking-[0.15em] shadow-comic-sm hover:-translate-y-0.5 active:translate-y-0 transition-all"
                >
                  JOIN
                </Link>
              </div>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-1.5 rounded-lg hover:bg-surface-muted-light dark:hover:bg-surface-muted-dark transition-colors"
          >
            {mobileOpen ? <X className="w-4 h-4 text-text-light dark:text-text-dark" /> : <Menu className="w-4 h-4 text-text-light dark:text-text-dark" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden bg-surface-light dark:bg-surface-dark border-b-2 border-border-light dark:border-border-dark"
          >
            <div className="px-4 py-4 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 text-[11px] font-mono tracking-widest uppercase transition-colors rounded-lg",
                    location.pathname === link.to
                      ? "text-primary bg-primary/10"
                      : "text-text-muted hover:bg-surface-muted-light dark:hover:bg-surface-muted-dark"
                  )}
                >
                  <link.icon className="w-4 h-4" />
                  {link.label}
                </Link>
              ))}

              <div className="pt-3 border-t border-border-light/10 dark:border-border-dark/10">
                {user ? (
                  <div className="space-y-1">
                    <Link
                      to="/profile"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-[11px] font-mono tracking-widest uppercase text-text-muted hover:bg-surface-muted-light group"
                    >
                      <User className="w-4 h-4 group-hover:text-primary transition-colors" />
                      Profile
                    </Link>
                    <button
                      onClick={() => { handleLogout(); setMobileOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-[11px] font-mono tracking-widest uppercase text-danger hover:bg-danger/10"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <Link
                      to="/login"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-text-muted text-[10px] font-mono tracking-widest transition-all"
                    >
                      LOGIN
                    </Link>
                    <Link
                      to="/signup"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-border bg-primary text-black text-[10px] font-mono font-bold tracking-widest transition-all"
                    >
                      SIGN UP
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
