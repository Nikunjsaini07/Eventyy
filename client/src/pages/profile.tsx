import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  GraduationCap,
  Loader2,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Edit,
  Save,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import type { UserProfile } from "@/types";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const { user: authUser, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingUniversity, setEditingUniversity] = useState(false);
  const [uniForm, setUniForm] = useState({
    universityName: "",
    universityEmail: "",
    universityStudentId: "",
    department: "",
    course: "",
    year: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authUser) {
      navigate("/login");
      return;
    }
    api
      .get("/profile/me")
      .then((res) => {
        setProfile(res.data);
        setUniForm({
          universityName: res.data.universityName || "",
          universityEmail: res.data.universityEmail || "",
          universityStudentId: res.data.universityStudentId || "",
          department: res.data.department || "",
          course: res.data.course || "",
          year: res.data.year?.toString() || "",
        });
      })
      .catch(() => toast.error("Failed to load profile"))
      .finally(() => setLoading(false));
  }, [authUser, navigate]);

  const handleUniversitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        universityName: uniForm.universityName,
        universityEmail: uniForm.universityEmail,
        universityStudentId: uniForm.universityStudentId,
      };
      if (uniForm.department) body.department = uniForm.department;
      if (uniForm.course) body.course = uniForm.course;
      if (uniForm.year) body.year = parseInt(uniForm.year);

      await api.patch("/profile/university", body);
      toast.success("University details submitted for review!");
      setEditingUniversity(false);
      // Refresh
      const { data } = await api.get("/profile/me");
      setProfile(data);
      await refreshUser();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to update";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) return null;

  const badgeConfig = {
    NONE: { icon: AlertCircle, color: "text-text-dim", bg: "bg-surface-light", label: "Not Submitted" },
    PENDING: { icon: Clock, color: "text-warning", bg: "bg-warning/10", label: "Pending Review" },
    VERIFIED: { icon: CheckCircle, color: "text-success", bg: "bg-success/10", label: "Verified" },
    REJECTED: { icon: XCircle, color: "text-danger", bg: "bg-danger/10", label: "Rejected" },
  };

  const badge = badgeConfig[profile.universityBadgeStatus];
  const BadgeIcon = badge.icon;

  return (
    <div className="min-h-screen">
      <section className="py-16 hero-gradient border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-2xl font-bold text-white">
                {profile.fullName?.[0]?.toUpperCase()}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-text">{profile.fullName}</h1>
                <p className="text-text-muted text-sm flex items-center gap-2 mt-1">
                  <Mail className="w-4 h-4" />
                  {profile.email}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* User Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <InfoCard icon={User} label="Role" value={profile.role} />
            <InfoCard icon={Phone} label="Phone" value={profile.phone || "Not set"} />
            <InfoCard icon={Mail} label="Joined" value={new Date(profile.createdAt).toLocaleDateString()} />
          </div>

          {/* University Badge */}
          <div className="rounded-2xl glass border border-border overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-text flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-primary" />
                  University Badge
                </h2>
                <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold", badge.bg, badge.color)}>
                  <BadgeIcon className="w-4 h-4" />
                  {badge.label}
                </div>
              </div>

              {profile.universityBadgeStatus === "VERIFIED" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3 rounded-xl bg-surface-light">
                    <p className="text-xs text-text-dim">University</p>
                    <p className="text-sm font-medium text-text">{profile.universityName}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-light">
                    <p className="text-xs text-text-dim">Student ID</p>
                    <p className="text-sm font-medium text-text">{profile.universityStudentId}</p>
                  </div>
                  {profile.department && (
                    <div className="p-3 rounded-xl bg-surface-light">
                      <p className="text-xs text-text-dim">Department</p>
                      <p className="text-sm font-medium text-text">{profile.department}</p>
                    </div>
                  )}
                  {profile.course && (
                    <div className="p-3 rounded-xl bg-surface-light">
                      <p className="text-xs text-text-dim">Course</p>
                      <p className="text-sm font-medium text-text">{profile.course}</p>
                    </div>
                  )}
                </div>
              )}

              {(profile.universityBadgeStatus === "NONE" || profile.universityBadgeStatus === "REJECTED") && !editingUniversity && (
                <button
                  onClick={() => setEditingUniversity(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Submit University Details
                </button>
              )}

              {editingUniversity && (
                <form onSubmit={handleUniversitySubmit} className="space-y-4 mt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input
                      type="text"
                      value={uniForm.universityName}
                      onChange={(e) => setUniForm({ ...uniForm, universityName: e.target.value })}
                      required
                      placeholder="University Name *"
                      className="w-full px-4 py-2.5 rounded-xl bg-surface-light border border-border text-text text-sm placeholder:text-text-dim focus:outline-none focus:border-primary transition-colors"
                    />
                    <input
                      type="email"
                      value={uniForm.universityEmail}
                      onChange={(e) => setUniForm({ ...uniForm, universityEmail: e.target.value })}
                      required
                      placeholder="University Email *"
                      className="w-full px-4 py-2.5 rounded-xl bg-surface-light border border-border text-text text-sm placeholder:text-text-dim focus:outline-none focus:border-primary transition-colors"
                    />
                    <input
                      type="text"
                      value={uniForm.universityStudentId}
                      onChange={(e) => setUniForm({ ...uniForm, universityStudentId: e.target.value })}
                      required
                      placeholder="Student ID *"
                      className="w-full px-4 py-2.5 rounded-xl bg-surface-light border border-border text-text text-sm placeholder:text-text-dim focus:outline-none focus:border-primary transition-colors"
                    />
                    <input
                      type="text"
                      value={uniForm.department}
                      onChange={(e) => setUniForm({ ...uniForm, department: e.target.value })}
                      placeholder="Department"
                      className="w-full px-4 py-2.5 rounded-xl bg-surface-light border border-border text-text text-sm placeholder:text-text-dim focus:outline-none focus:border-primary transition-colors"
                    />
                    <input
                      type="text"
                      value={uniForm.course}
                      onChange={(e) => setUniForm({ ...uniForm, course: e.target.value })}
                      placeholder="Course"
                      className="w-full px-4 py-2.5 rounded-xl bg-surface-light border border-border text-text text-sm placeholder:text-text-dim focus:outline-none focus:border-primary transition-colors"
                    />
                    <input
                      type="number"
                      value={uniForm.year}
                      onChange={(e) => setUniForm({ ...uniForm, year: e.target.value })}
                      placeholder="Year"
                      min={1}
                      max={10}
                      className="w-full px-4 py-2.5 rounded-xl bg-surface-light border border-border text-text text-sm placeholder:text-text-dim focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary to-secondary text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50"
                    >
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Submit
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingUniversity(false)}
                      className="px-4 py-2.5 rounded-xl text-text-muted text-sm hover:bg-surface-light transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}

function InfoCard({ icon: Icon, label, value }: { icon: typeof User; label: string; value: string }) {
  return (
    <div className="p-4 rounded-xl bg-surface border border-border">
      <Icon className="w-5 h-5 text-primary mb-2" />
      <p className="text-xs text-text-dim">{label}</p>
      <p className="text-sm font-semibold text-text">{value}</p>
    </div>
  );
}
