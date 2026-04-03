import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  Home,
  CalendarDays,
  Trophy,
  Mail,
  User,
  LogIn,
  LogOut,
  LayoutDashboard,
  Shield,
  Sparkles,
  Bell,
  Activity,
} from "lucide-react";
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

  const handleLogout = () => {
    logout();
    setProfileOpen(false);
    navigate("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 border border-primary bg-primary/5 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight hidden sm:block">
              Eventyy
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
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 relative",
                    isActive
                      ? "text-white"
                      : "text-text-muted hover:text-white hover:bg-surface-light"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="nav-active"
                      className="absolute inset-0 rounded-lg bg-surface-light border border-border"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <link.icon className="w-4 h-4" />
                    {link.label}
                  </span>
                </Link>
              );
            })}

            {user && (
              <Link
                to="/my-events"
                className={cn(
                  "px-4 py-2 text-xs font-mono tracking-widest uppercase transition-all duration-200 flex items-center gap-2",
                  location.pathname.startsWith("/my-events")
                    ? "text-primary border border-primary bg-primary/10"
                    : "text-text-muted hover:text-primary"
                )}
              >
                <Activity className="w-4 h-4" />
                MY EVENTS
              </Link>
            )}

            {isAdmin && (
              <Link
                to="/admin"
                className={cn(
                  "px-4 py-2 text-xs font-mono tracking-widest uppercase transition-all duration-200 flex items-center gap-2",
                  location.pathname.startsWith("/admin")
                    ? "text-danger border border-danger bg-danger/10"
                    : "text-text-muted hover:text-danger"
                )}
              >
                <Shield className="w-4 h-4" />
                ADMIN
              </Link>
            )}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                <button
                  className="p-2 text-text-muted hover:text-primary transition-colors relative"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
                </button>
                <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-surface-light transition-colors"
                >
                  <div className="w-8 h-8 border border-primary bg-primary/10 flex items-center justify-center text-primary text-sm font-bold font-mono">
                    {user.fullName?.[0]?.toUpperCase() ?? "U"}
                  </div>
                  <span className="text-sm font-medium text-text max-w-[120px] truncate">
                    {user.fullName}
                  </span>
                </button>

                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -5 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -5 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-56 bg-surface border border-border shadow-2xl overflow-hidden"
                    >
                      <div className="px-4 py-3 border-b border-border">
                        <p className="text-sm font-semibold text-text">{user.fullName}</p>
                        <p className="text-xs text-text-muted truncate">{user.email}</p>
                      </div>
                      <div className="py-1">
                        <Link
                          to="/profile"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-muted hover:text-white hover:bg-surface-light transition-colors"
                        >
                          <User className="w-4 h-4" />
                          Profile
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-danger hover:bg-danger/10 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Logout
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link
                  to="/login"
                  className="text-sm font-mono text-text-muted hover:text-white transition-colors flex items-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  LOGIN
                </Link>
                <Link
                  to="/signup"
                  className="px-5 py-2 border border-primary bg-primary/10 text-primary text-sm font-mono tracking-wider hover:bg-primary hover:text-black transition-all"
                >
                  SIGN UP
                </Link>
              </div>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-surface-light transition-colors"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
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
            className="md:hidden overflow-hidden bg-surface border-b border-border"
          >
            <div className="px-4 py-4 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                    location.pathname === link.to
                      ? "text-white bg-surface-light"
                      : "text-text-muted hover:text-white hover:bg-surface-light"
                  )}
                >
                  <link.icon className="w-4 h-4" />
                  {link.label}
                </Link>
              ))}

              {user && (
                <Link
                  to="/my-events"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-primary"
                >
                  <Activity className="w-4 h-4" />
                  My Events
                </Link>
              )}

              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-warning"
                >
                  <Shield className="w-4 h-4" />
                  Admin Panel
                </Link>
              )}

              <div className="pt-3 border-t border-border">
                {user ? (
                  <>
                    <Link
                      to="/profile"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-text-muted hover:text-white"
                    >
                      <User className="w-4 h-4" />
                      Profile
                    </Link>
                    <button
                      onClick={() => { handleLogout(); setMobileOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-danger"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </>
                ) : (
                  <div className="space-y-2">
                    <Link
                      to="/login"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-center gap-2 px-4 py-3 border border-border bg-surface text-text-muted hover:text-white text-sm font-mono tracking-wider transition-all"
                    >
                      <LogIn className="w-4 h-4" />
                      LOGIN
                    </Link>
                    <Link
                      to="/signup"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-center gap-2 px-4 py-3 border border-primary bg-primary/10 text-primary hover:bg-primary hover:text-black text-sm font-mono tracking-wider transition-all"
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
