import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-background bg-grid px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <div className="text-8xl font-black text-primary mb-6 font-mono">
          404
        </div>
        <h1 className="text-2xl font-black text-white mb-3 uppercase tracking-tighter">
          Page Not Found
        </h1>
        <p className="text-text-muted mb-8 max-w-md mx-auto font-mono text-sm">
          Target destination does not exist in the system.
        </p>
        <div className="flex justify-center gap-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-black font-bold font-mono text-sm tracking-widest uppercase hover:bg-primary-light transition-colors"
          >
            <Home className="w-4 h-4" />
            HOME
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 px-6 py-3 bg-surface border border-border text-text font-mono text-sm tracking-widest uppercase hover:bg-surface-light transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            BACK
          </button>
        </div>
      </motion.div>
    </div>
  );
}
