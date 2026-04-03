import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, MessageSquare, Send, MapPin, Loader2, Zap } from "lucide-react";
import toast from "react-hot-toast";

export default function ContactPage() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;
    
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      toast.success("Message sent successfully! We'll get back to you soon.");
      setForm({ name: "", email: "", message: "" });
    }, 1500);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      {/* Header section */}
      <section className="py-16 border-b border-border relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center justify-center w-14 h-14 bg-primary/10 border border-primary text-primary mb-6">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tighter uppercase mb-4">
              Get in <span className="text-primary">Touch</span>
            </h1>
            <p className="text-text-muted font-mono text-sm max-w-2xl mx-auto uppercase tracking-widest">
              Have questions about an event? Need support? Drop us a line.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            
            {/* Contact Info */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-8"
            >
              <div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-6">
                  Contact Information
                </h2>
                <div className="space-y-6">
                  <div className="flex items-start gap-4 p-6 bg-surface border border-border">
                    <div className="w-10 h-10 bg-primary/10 border border-primary flex items-center justify-center shrink-0">
                      <Mail className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white uppercase tracking-wider text-sm mb-1">Email Us</h3>
                      <p className="text-text-muted font-mono text-xs mb-2">For general queries and support</p>
                      <a href="mailto:support@eventyy.com" className="text-primary font-mono text-sm hover:underline">
                        support@eventyy.com
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-6 bg-surface border border-border">
                    <div className="w-10 h-10 bg-primary/10 border border-primary flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white uppercase tracking-wider text-sm mb-1">Visit Us</h3>
                      <p className="text-text-muted font-mono text-xs mb-2">Student Activity Center</p>
                      <p className="text-primary font-mono text-sm">
                        Main Campus Building,<br />
                        University Avenue, 10001
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-6 bg-surface border border-border">
                    <div className="w-10 h-10 bg-primary/10 border border-primary flex items-center justify-center shrink-0">
                      <Zap className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white uppercase tracking-wider text-sm mb-1">Fast Response</h3>
                      <p className="text-text-muted font-mono text-xs max-w-sm">
                        We aim to respond to all inquiries within 24 hours during business days.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="bg-surface border border-border p-8 sm:p-10 relative">
                {/* Corner accents */}
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary pointer-events-none" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-primary pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-primary pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary pointer-events-none" />

                <h2 className="text-xl font-black text-white uppercase tracking-tighter mb-8 flex items-center gap-2">
                  <Send className="w-5 h-5 text-primary" /> Send a Message
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-text-muted font-mono tracking-widest uppercase">
                      Name
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="YOUR NAME"
                      required
                      className="w-full px-4 py-3 bg-background border border-border text-text placeholder:text-text-dim focus:outline-none focus:border-primary transition-colors font-mono text-sm uppercase"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-text-muted font-mono tracking-widest uppercase">
                      Email
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="NAME@EMAIL.COM"
                      required
                      className="w-full px-4 py-3 bg-background border border-border text-text placeholder:text-text-dim focus:outline-none focus:border-primary transition-colors font-mono text-sm uppercase"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-text-muted font-mono tracking-widest uppercase">
                      Message
                    </label>
                    <textarea
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder="HOW CAN WE HELP YOU?"
                      required
                      rows={5}
                      className="w-full px-4 py-3 bg-background border border-border text-text placeholder:text-text-dim focus:outline-none focus:border-primary transition-colors font-mono text-sm resize-none uppercase"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !form.name || !form.email || !form.message}
                    className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-black font-bold font-mono tracking-widest text-sm hover:bg-primary-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" /> SEND MESSAGE
                      </>
                    )}
                  </button>
                </form>
              </div>
            </motion.div>

          </div>
        </div>
      </section>
    </div>
  );
}
