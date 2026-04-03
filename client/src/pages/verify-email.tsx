import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, KeyRound, ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const initialEmail = searchParams.get("email") || "";

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [verified, setVerified] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || code.length !== 6) return;
    setLoading(true);
    try {
      await api.post("/auth/verify-email", { email, code });
      setVerified(true);
      toast.success("Email verified successfully!");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Invalid or expired code";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    try {
      await api.post("/auth/request-verification-otp", { email });
      toast.success("New verification code sent!");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to resend code";
      toast.error(msg);
    } finally {
      setResending(false);
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
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-black text-white tracking-tighter uppercase">
                {verified ? "Verified" : "Verify Email"}
              </h1>
              <p className="text-xs font-mono text-text-muted mt-3 tracking-widest uppercase">
                {verified
                  ? "Your email has been confirmed"
                  : `Enter the 6-digit code sent to your email`}
              </p>
            </div>

            {verified ? (
              <div className="text-center space-y-6">
                <div className="w-16 h-16 mx-auto bg-primary/10 border border-primary flex items-center justify-center">
                  <ShieldCheck className="w-8 h-8 text-primary" />
                </div>
                <p className="text-sm font-mono text-text-muted">
                  You can now login with your credentials.
                </p>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-black font-bold font-mono tracking-widest text-sm hover:bg-primary-light transition-colors group"
                >
                  GO TO LOGIN
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            ) : (
              <form onSubmit={handleVerify} className="space-y-6">
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
                    Verification Code
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
                    <input
                      type="text"
                      value={code}
                      onChange={(e) =>
                        setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                      }
                      placeholder="000000"
                      required
                      maxLength={6}
                      className="w-full pl-12 pr-4 py-3 bg-background border border-border text-text placeholder:text-text-dim focus:outline-none focus:border-primary transition-colors text-xl tracking-[0.5em] font-mono font-bold text-center"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || code.length !== 6}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-black font-bold font-mono tracking-widest text-sm hover:bg-primary-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      VERIFY{" "}
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  className="w-full text-xs font-mono tracking-widest text-text-muted hover:text-primary transition-colors py-2 uppercase disabled:opacity-50"
                >
                  {resending ? "Sending..." : "Resend Verification Code"}
                </button>
              </form>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
