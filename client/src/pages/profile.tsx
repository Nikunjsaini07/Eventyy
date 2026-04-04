import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Activity,
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
  Shield,
  CalendarDays,
  Trash2,
  KeyRound,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import type { UserProfile } from "@/types";
import { cn, formatDate, formatDateTime } from "@/lib/utils";

export default function ProfilePage() {
  const { user: authUser, refreshUser, logout } = useAuth();
  const navigate = useNavigate();

  const [deleteStep, setDeleteStep] = useState<"idle" | "verify">("idle");
  const [deleteCode, setDeleteCode] = useState("");
  const [deleting, setDeleting] = useState(false);

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

  const handleRequestDeleteOtp = async () => {
    setDeleting(true);
    try {
      await api.post("/profile/me/request-delete-otp");
      toast.success("Deletion OTP sent to your email.");
      setDeleteStep("verify");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to request OTP";
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  const handleConfirmDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (deleteCode.length !== 6) return;
    setDeleting(true);
    try {
      await api.delete("/profile/me", { data: { code: deleteCode } });
      toast.success("Account deleted successfully.");
      logout();
      navigate("/");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to delete account";
      toast.error(msg);
      setDeleting(false);
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

  const registrationActivities = profile.activities?.registrations ?? {
    upcoming: [],
    ongoingOrRecent: profile.registrations ?? [],
    past: [],
  };

  const coordinatorActivities = profile.activities?.coordinatorAssignments ?? {
    active: profile.coordinatorAssignments ?? [],
    upcoming: [],
    past: [],
  };

  const badgeHistory = profile.activities?.badgeHistory ?? [];

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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={CalendarDays}
              label="Registrations"
              value={String(profile.activitySummary?.totalRegistrations ?? profile.registrations.length)}
            />
            <StatCard
              icon={Shield}
              label="Coordinator Roles"
              value={String(
                profile.activitySummary?.totalCoordinatorAssignments ??
                  profile.coordinatorAssignments.length
              )}
            />
            <StatCard
              icon={Activity}
              label="Active Coordination"
              value={String(profile.activitySummary?.activeCoordinatorAssignments ?? 0)}
            />
            <StatCard
              icon={GraduationCap}
              label="Email Status"
              value={profile.isEmailVerified ? "Verified" : "Pending"}
            />
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

          <div className="rounded-2xl glass border border-border overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold text-text flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-primary" />
                  Event Activity
                </h2>
                <Link
                  to="/my-events"
                  className="text-xs font-mono tracking-widest uppercase text-primary hover:underline"
                >
                  Open My Events
                </Link>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <ActivityColumn
                  title="Upcoming"
                  emptyText="No upcoming participations"
                  items={registrationActivities.upcoming}
                />
                <ActivityColumn
                  title="Recent / Ongoing"
                  emptyText="No recent activity"
                  items={registrationActivities.ongoingOrRecent}
                />
                <ActivityColumn
                  title="Past"
                  emptyText="No past events yet"
                  items={registrationActivities.past}
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl glass border border-border overflow-hidden">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-text flex items-center gap-2 mb-5">
                <Shield className="w-5 h-5 text-primary" />
                Coordinator Activity
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <CoordinatorColumn
                  title="Active"
                  emptyText="No active coordinator assignments"
                  items={coordinatorActivities.active}
                />
                <CoordinatorColumn
                  title="Upcoming"
                  emptyText="No upcoming coordinator assignments"
                  items={coordinatorActivities.upcoming}
                />
                <CoordinatorColumn
                  title="Past"
                  emptyText="No past coordinator assignments"
                  items={coordinatorActivities.past}
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl glass border border-border overflow-hidden">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-text flex items-center gap-2 mb-5">
                <GraduationCap className="w-5 h-5 text-primary" />
                Badge History
              </h2>

              {badgeHistory.length === 0 ? (
                <p className="text-sm text-text-muted">No badge history yet.</p>
              ) : (
                <div className="space-y-3">
                  {badgeHistory.map((entry) => (
                    <div
                      key={entry.id}
                      className="rounded-xl border border-border bg-surface-light/70 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-text">{entry.status}</p>
                          <p className="text-xs text-text-muted">
                            {formatDateTime(entry.createdAt)}
                          </p>
                        </div>
                        {entry.reviewer && (
                          <p className="text-xs text-text-muted">
                            Reviewed by {entry.reviewer.fullName}
                          </p>
                        )}
                      </div>
                      {entry.notes && (
                        <p className="mt-3 text-sm text-text-muted">{entry.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Danger Zone */}
          <div className="border border-danger/20 bg-danger/[0.02] p-5 mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-danger text-sm font-mono tracking-widest uppercase mb-1 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> Delete Account
                </h3>
                <p className="text-xs text-text-muted max-w-md">
                  We will send a one-time code to your email before deletion. This action is irreversible.
                </p>
              </div>

              {deleteStep === "idle" && (
                <button
                  onClick={handleRequestDeleteOtp}
                  disabled={deleting}
                  className="shrink-0 px-4 py-2 bg-background border border-danger/50 text-danger hover:bg-danger hover:text-white transition-all duration-200 font-mono text-xs uppercase font-bold tracking-widest disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <KeyRound className="w-3 h-3" />}
                  Send Delete OTP
                </button>
              )}
            </div>

            {deleteStep === "verify" && (
              <div className="mt-5 pt-5 border-t border-danger/10">
                <form onSubmit={handleConfirmDelete} className="flex flex-col sm:flex-row sm:items-end gap-4">
                  <div className="space-y-2 flex-grow max-w-xs">
                    <label className="block text-[10px] font-bold text-danger font-mono tracking-widest uppercase mb-1">
                      Verification Code
                    </label>
                    <input
                      type="text"
                      value={deleteCode}
                      onChange={(e) => setDeleteCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="6-DIGIT CODE"
                      required
                      maxLength={6}
                      className="w-full px-3 py-2 bg-background border border-danger/30 text-text placeholder:text-text-dim focus:outline-none focus:border-danger transition-colors font-mono text-sm tracking-[0.2em] uppercase"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleRequestDeleteOtp}
                      disabled={deleting}
                      className="px-4 py-2 text-text-muted hover:text-danger transition-colors font-mono text-xs uppercase tracking-widest h-9"
                    >
                      Resend OTP
                    </button>
                    <button
                      type="submit"
                      disabled={deleting || deleteCode.length !== 6}
                      className="px-5 py-2 bg-danger text-white border border-danger hover:bg-danger/80 transition-all duration-200 font-mono text-xs uppercase font-bold tracking-widest disabled:opacity-50 flex items-center justify-center gap-2 h-9"
                    >
                      {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                      Confirm
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteStep("idle");
                        setDeleteCode("");
                      }}
                      className="px-4 py-2 text-text-muted hover:text-white transition-colors font-mono text-xs uppercase tracking-widest h-9"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
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

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Activity;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <Icon className="mb-2 h-5 w-5 text-primary" />
      <p className="text-xs text-text-dim">{label}</p>
      <p className="text-lg font-semibold text-text">{value}</p>
    </div>
  );
}

function ActivityColumn({
  title,
  emptyText,
  items,
}: {
  title: string;
  emptyText: string;
  items: UserProfile["registrations"];
}) {
  return (
    <div className="rounded-xl border border-border bg-surface-light/70 p-4">
      <h3 className="mb-4 text-xs font-mono tracking-widest uppercase text-text-muted">{title}</h3>
      <div className="space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-text-muted">{emptyText}</p>
        ) : (
          items.map((registration) => (
            <div key={registration.id} className="rounded-lg border border-border bg-surface p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-text">
                    {registration.event?.title ?? "Event"}
                  </p>
                  <p className="text-xs text-text-muted">
                    {registration.event?.group?.title ?? "Standalone event"}
                  </p>
                </div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-primary">
                  {registration.status}
                </span>
              </div>
              <p className="mt-3 text-xs text-text-muted">
                Registered on {formatDate(registration.createdAt)}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function CoordinatorColumn({
  title,
  emptyText,
  items,
}: {
  title: string;
  emptyText: string;
  items: UserProfile["coordinatorAssignments"];
}) {
  return (
    <div className="rounded-xl border border-border bg-surface-light/70 p-4">
      <h3 className="mb-4 text-xs font-mono tracking-widest uppercase text-text-muted">{title}</h3>
      <div className="space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-text-muted">{emptyText}</p>
        ) : (
          items.map((assignment) => (
            <div key={assignment.id} className="rounded-lg border border-border bg-surface p-3">
              <p className="text-sm font-semibold text-text">
                {assignment.event?.title ?? "Event"}
              </p>
              <p className="mt-1 text-xs text-text-muted">
                {assignment.event?.group?.title ?? "Event group"}
              </p>
              <p className="mt-3 text-xs text-text-muted">
                {formatDateTime(assignment.startsAt)} to {formatDateTime(assignment.endsAt)}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
