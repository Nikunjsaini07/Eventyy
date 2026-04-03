import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowRight, Loader2, Zap } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { useAuth } from "@/context/auth-context";

export default function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) {
    navigate("/", { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      login(data.token, data.user);
      toast.success(`Welcome back, ${data.user.fullName}!`);
      navigate("/", { replace: true });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Invalid email or password";
      toast.error(msg);
      if (msg === "Please verify your email before logging in") {
        navigate(`/verify-email?email=${encodeURIComponent(email)}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-background bg-grid px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-surface border border-border shadow-2xl relative overflow-hidden">
          {/* Corner accents */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary/50 pointer-events-none" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary/50 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary/50 pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary/50 pointer-events-none" />

          <div className="p-8 sm:p-10">
            {/* Header */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-primary/10 border border-primary text-primary mb-6">
                <Zap className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-black text-white tracking-tighter uppercase">
                Login
              </h1>
              <p className="text-xs font-mono text-text-muted mt-3 tracking-widest uppercase">
                Access your account
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-text-muted font-mono tracking-widest uppercase">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@email.com"
                    required
                    className="w-full pl-12 pr-4 py-3 bg-background border border-border text-text placeholder:text-text-dim focus:outline-none focus:border-primary transition-colors font-mono text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-text-muted font-mono tracking-widest uppercase">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={8}
                    className="w-full pl-12 pr-4 py-3 bg-background border border-border text-text placeholder:text-text-dim focus:outline-none focus:border-primary transition-colors font-mono text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Link
                  to="/reset-password"
                  className="text-xs font-mono text-primary hover:text-primary-light transition-colors tracking-widest uppercase"
                >
                  Forgot Password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading || !email || !password}
                className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-black font-bold font-mono tracking-widest text-sm hover:bg-primary-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    LOGIN{" "}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-dashed border-border text-center space-y-3">
              <p className="text-xs font-mono text-text-muted tracking-widest uppercase">
                Don't have an account?{" "}
                <Link
                  to="/signup"
                  className="text-primary hover:text-primary-light transition-colors font-bold"
                >
                  Sign Up
                </Link>
              </p>
              <p className="text-xs font-mono text-text-muted tracking-widest uppercase">
                Need to verify your email?{" "}
                <Link
                  to="/verify-email"
                  className="text-primary hover:text-primary-light transition-colors font-bold"
                >
                  Verify Now
                </Link>
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
