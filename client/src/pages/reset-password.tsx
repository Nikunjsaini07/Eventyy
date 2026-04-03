import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  KeyRound,
  Lock,
  ArrowRight,
  Loader2,
  RefreshCw,
  CheckCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";

type Step = "email" | "reset" | "done";

export default function ResetPasswordPage() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await api.post("/auth/request-password-reset-otp", { email });
      toast.success("Reset code sent to your email!");
      setStep("reset");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to send reset code";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !newPassword) return;
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { email, code, newPassword });
      toast.success("Password reset successfully!");
      setStep("done");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Reset failed";
      toast.error(msg);
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
          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary/50 pointer-events-none" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary/50 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary/50 pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary/50 pointer-events-none" />

          <div className="p-8 sm:p-10">
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-primary/10 border border-primary text-primary mb-6">
                <RefreshCw className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-black text-white tracking-tighter uppercase">
                {step === "done" ? "All Set" : "Reset Password"}
              </h1>
              <p className="text-xs font-mono text-text-muted mt-3 tracking-widest uppercase">
                {step === "email" && "Enter your email to receive a reset code"}
                {step === "reset" && `Code sent to ${email}`}
                {step === "done" && "Your password has been updated"}
              </p>
            </div>

            <AnimatePresence mode="wait">
              {step === "email" && (
                <motion.form
                  key="email"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleRequestOtp}
                  className="space-y-6"
                >
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

                  <button
                    type="submit"
                    disabled={loading || !email}
                    className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-black font-bold font-mono tracking-widest text-sm hover:bg-primary-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        SEND RESET CODE{" "}
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep("reset")}
                    className="w-full text-xs font-mono tracking-widest text-text-muted hover:text-white transition-colors py-2 uppercase mt-4"
                  >
                    Already have a reset code?
                  </button>
                </motion.form>
              )}

              {step === "reset" && (
                <motion.form
                  key="reset"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleResetPassword}
                  className="space-y-6"
                >
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
                      Reset Code
                    </label>
                    <div className="relative">
                      <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
                      <input
                        type="text"
                        value={code}
                        onChange={(e) =>
                          setCode(
                            e.target.value.replace(/\D/g, "").slice(0, 6)
                          )
                        }
                        placeholder="000000"
                        required
                        maxLength={6}
                        className="w-full pl-12 pr-4 py-3 bg-background border border-border text-text placeholder:text-text-dim focus:outline-none focus:border-primary transition-colors text-xl tracking-[0.5em] font-mono font-bold text-center"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-text-muted font-mono tracking-widest uppercase">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Min 8 characters"
                        required
                        minLength={8}
                        maxLength={128}
                        className="w-full pl-12 pr-4 py-3 bg-background border border-border text-text placeholder:text-text-dim focus:outline-none focus:border-primary transition-colors font-mono text-sm"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || code.length !== 6 || !newPassword || !email}
                    className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-black font-bold font-mono tracking-widest text-sm hover:bg-primary-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        RESET PASSWORD{" "}
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setStep("email");
                      setCode("");
                      setNewPassword("");
                    }}
                    className="w-full text-xs font-mono tracking-widest text-text-muted hover:text-white transition-colors py-2 uppercase"
                  >
                    ← Use a different email
                  </button>
                </motion.form>
              )}

              {step === "done" && (
                <motion.div
                  key="done"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center space-y-6"
                >
                  <div className="w-16 h-16 mx-auto bg-primary/10 border border-primary flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-primary" />
                  </div>
                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-black font-bold font-mono tracking-widest text-sm hover:bg-primary-light transition-colors group"
                  >
                    GO TO LOGIN
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>

            {step !== "done" && (
              <div className="mt-8 pt-6 border-t border-dashed border-border text-center">
                <p className="text-xs font-mono text-text-muted tracking-widest uppercase">
                  Remember your password?{" "}
                  <Link
                    to="/login"
                    className="text-primary hover:text-primary-light transition-colors font-bold"
                  >
                    Login
                  </Link>
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
