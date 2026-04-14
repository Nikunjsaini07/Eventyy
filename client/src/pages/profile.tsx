import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  BadgeCheck,
  CalendarDays,
  Edit3,
  GraduationCap,
  KeyRound,
  LayoutDashboard,
  Loader2,
  Mail,
  Phone,
  Save,
  Shield,
  Trash2,
  User,
} from "lucide-react";
import toast from "react-hot-toast";

import { useAuth } from "@/context/auth-context";
import api from "@/lib/api";
import { cn, formatDate, formatDateTime } from "@/lib/utils";
import type { BadgeHistoryEntry, Event, EventRegistration, UserProfile } from "@/types";

type DeleteStep = "idle" | "verify";

export default function ProfilePage() {
  const { user: authUser, refreshUser, logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingUniversity, setEditingUniversity] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleteStep, setDeleteStep] = useState<DeleteStep>("idle");
  const [deleteCode, setDeleteCode] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [uniForm, setUniForm] = useState({
    universityName: "",
    universityEmail: "",
    universityStudentId: "",
    department: "",
    course: "",
    year: "",
  });

  const loadProfile = async () => {
    const response = await api.get("/profile/me");
    setProfile(response.data);
    setUniForm({
      universityName: response.data.universityName || "",
      universityEmail: response.data.universityEmail || "",
      universityStudentId: response.data.universityStudentId || "",
      department: response.data.department || "",
      course: response.data.course || "",
      year: response.data.year ? String(response.data.year) : "",
    });
  };

  useEffect(() => {
    if (!authUser) {
      navigate("/login");
      return;
    }

    loadProfile()
      .catch(() => toast.error("Failed to load profile"))
      .finally(() => setLoading(false));
  }, [authUser, navigate]);

  const registrationActivities = useMemo(
    () =>
      profile?.activities?.registrations ?? {
        upcoming: [],
        ongoingOrRecent: profile?.registrations ?? [],
        past: [],
      },
    [profile]
  );

  const badgeHistory = useMemo(
    () => profile?.activities?.badgeHistory ?? [],
    [profile]
  );

  const createdEvents = useMemo(
    () => profile?.createdEvents ?? profile?.activities?.createdEvents ?? [],
    [profile]
  );

  const handleUniversitySubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      await api.patch("/profile/university", {
        universityName: uniForm.universityName,
        universityEmail: uniForm.universityEmail,
        universityStudentId: uniForm.universityStudentId,
        department: uniForm.department || undefined,
        course: uniForm.course || undefined,
        year: uniForm.year ? Number(uniForm.year) : undefined,
      });
      toast.success("University details submitted for review");
      setEditingUniversity(false);
      await loadProfile();
      await refreshUser();
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Failed to update university details";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestDeleteOtp = async () => {
    setDeleting(true);
    try {
      await api.post("/profile/me/request-delete-otp");
      toast.success("A deletion OTP has been sent to your email");
      setDeleteStep("verify");
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Failed to request account deletion OTP";
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  };

  const handleConfirmDelete = async (event: React.FormEvent) => {
    event.preventDefault();
    setDeleting(true);
    try {
      await api.delete("/profile/me", { data: { code: deleteCode } });
      toast.success("Account deleted successfully");
      logout();
      navigate("/");
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Failed to delete account";
      toast.error(message);
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) return null;

  const badgeTone =
    profile.universityBadgeStatus === "VERIFIED"
      ? "success"
      : profile.universityBadgeStatus === "PENDING"
        ? "warning"
        : profile.universityBadgeStatus === "REJECTED"
          ? "danger"
          : "default";

  if (profile.role === "ADMIN") {
    return (
      <div className="min-h-screen bg-background text-text">
        <section className="border-b border-border bg-surface/70">
          <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
            <p className="text-xs font-mono uppercase tracking-[0.22em] text-primary">Admin profile</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-text">{profile.fullName}</h1>
            <p className="mt-4 text-sm text-text-muted">
              This profile stays intentionally simple for admins. Use the admin workspace for event
              management, badge approvals, and user access control.
            </p>
          </div>
        </section>

        <section className="py-10">
          <div className="mx-auto max-w-5xl space-y-6 px-4 sm:px-6 lg:px-8">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <SummaryCard icon={User} label="Role" value={profile.role} />
              <SummaryCard icon={Mail} label="Email status" value={profile.isEmailVerified ? "Verified" : "Pending"} />
              <SummaryCard
                icon={CalendarDays}
                label="Created events"
                value={String(profile.activitySummary?.totalCreatedEvents ?? createdEvents.length)}
              />
              <SummaryCard
                icon={BadgeCheck}
                label="Published"
                value={String(profile.activitySummary?.publishedCreatedEvents ?? 0)}
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
              <Card>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-mono uppercase tracking-[0.18em] text-text-dim">Admin workspace</p>
                    <h2 className="mt-2 text-2xl font-bold text-text">Manage the platform from one place</h2>
                    <p className="mt-3 text-sm leading-6 text-text-muted">
                      Review student badges, create events, update details, and control user access
                      from the dedicated admin dashboard.
                    </p>
                  </div>
                  <Link
                    to="/admin"
                    className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-black"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Open admin dashboard
                  </Link>
                </div>
              </Card>

              <Card>
                <div className="space-y-4">
                  <MiniItem icon={User} label="Role" value={profile.role} />
                  <MiniItem icon={Mail} label="Email" value={profile.email} />
                  <MiniItem icon={Phone} label="Phone" value={profile.phone || "Not set"} />
                  <MiniItem
                    icon={BadgeCheck}
                    label="Email verification"
                    value={profile.isEmailVerified ? "Verified" : "Pending"}
                  />
                  <MiniItem icon={Shield} label="Account status" value={profile.isActive ? "Active" : "Inactive"} />
                </div>
              </Card>
            </div>

            <Card>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-text">Created events</h2>
                  <p className="mt-2 text-sm text-text-muted">
                    Events created from this admin account appear here.
                  </p>
                </div>
                <Link to="/admin" className="text-sm font-medium text-primary hover:text-primary-light">
                  Manage in admin
                </Link>
              </div>

              {createdEvents.length === 0 ? (
                <p className="mt-6 text-sm text-text-muted">No events have been created from this account yet.</p>
              ) : (
                <div className="mt-6 space-y-3">
                  {createdEvents.map((event) => (
                    <CreatedEventCard key={event.id} event={event} />
                  ))}
                </div>
              )}
            </Card>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-text">
      <section className="border-b border-border bg-surface/70">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
          <p className="text-xs font-mono uppercase tracking-[0.22em] text-primary">Student profile</p>
          <h1 className="mt-3 text-5xl font-black tracking-tight text-text">{profile.fullName}</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-text-muted">
            Keep your account details current, submit badge information, and track your event
            activity here.
          </p>
        </div>
      </section>

      <section className="py-10">
        <div className="mx-auto max-w-6xl space-y-8 px-4 sm:px-6 lg:px-8">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard icon={User} label="Role" value={profile.role} />
            <SummaryCard icon={Mail} label="Email status" value={profile.isEmailVerified ? "Verified" : "Pending"} />
            <SummaryCard
              icon={CalendarDays}
              label="Registrations"
              value={String(profile.activitySummary?.totalRegistrations ?? profile.registrations.length)}
            />
            <SummaryCard
              icon={Shield}
              label="Past events"
              value={String(profile.activitySummary?.pastEvents ?? 0)}
            />
          </div>

          <Card>
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl font-bold text-text">University badge</h2>
                  <StatusBadge tone={badgeTone}>{profile.universityBadgeStatus}</StatusBadge>
                </div>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-text-muted">
                  Verified students can access university-only events. Keep your institution details
                  complete so the admin can review them quickly.
                </p>
              </div>
              {(profile.universityBadgeStatus === "NONE" || profile.universityBadgeStatus === "REJECTED") && !editingUniversity && (
                <button
                  onClick={() => setEditingUniversity(true)}
                  className="inline-flex items-center gap-2 rounded-2xl border border-primary/30 bg-primary/10 px-5 py-3 text-sm font-medium text-primary"
                >
                  <Edit3 className="h-4 w-4" />
                  Submit details
                </button>
              )}
            </div>

            {!editingUniversity && (
              <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <MiniItem icon={GraduationCap} label="University" value={profile.universityName || "Not submitted"} />
                <MiniItem icon={Mail} label="University email" value={profile.universityEmail || "Not submitted"} />
                <MiniItem icon={BadgeCheck} label="Roll no" value={profile.universityStudentId || "Not submitted"} />
                <MiniItem icon={User} label="Department" value={profile.department || "Not added"} />
                <MiniItem icon={User} label="Course" value={profile.course || "Not added"} />
                <MiniItem icon={CalendarDays} label="Year" value={profile.year ? String(profile.year) : "Not added"} />
              </div>
            )}

            {editingUniversity && (
              <form className="mt-6 space-y-4" onSubmit={handleUniversitySubmit}>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <TextField
                    label="University name"
                    value={uniForm.universityName}
                    onChange={(value) => setUniForm((current) => ({ ...current, universityName: value }))}
                    required
                  />
                  <TextField
                    label="University email"
                    value={uniForm.universityEmail}
                    onChange={(value) => setUniForm((current) => ({ ...current, universityEmail: value }))}
                    type="email"
                    required
                  />
                  <TextField
                    label="Roll no"
                    value={uniForm.universityStudentId}
                    onChange={(value) => setUniForm((current) => ({ ...current, universityStudentId: value }))}
                    required
                  />
                  <TextField
                    label="Department"
                    value={uniForm.department}
                    onChange={(value) => setUniForm((current) => ({ ...current, department: value }))}
                  />
                  <label className="block space-y-2">
                    <span className="text-xs font-mono uppercase tracking-[0.18em] text-text-dim">Course</span>
                    <select
                      value={uniForm.course}
                      onChange={(e) => setUniForm((current) => ({ ...current, course: e.target.value }))}
                      className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-text outline-none transition-colors focus:border-primary"
                    >
                      <option value="">Select course</option>
                      <option value="Bachelor of Technology (B.Tech)">Bachelor of Technology (B.Tech)</option>
                      <option value="Master of Computer Applications (MCA)">Master of Computer Applications (MCA)</option>
                      <option value="Bachelor of Computer Applications (BCA)">Bachelor of Computer Applications (BCA)</option>
                    </select>
                  </label>
                  <TextField
                    label="Year"
                    value={uniForm.year}
                    onChange={(value) => setUniForm((current) => ({ ...current, year: value }))}
                    type="number"
                  />
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-black disabled:opacity-60"
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save details
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingUniversity(false)}
                    className="rounded-2xl border border-border bg-background px-5 py-3 text-sm font-medium text-text-muted"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </Card>

          <Card>
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-text">Event activity</h2>
                <p className="mt-2 text-sm text-text-muted">All of your registrations are grouped below.</p>
              </div>
              <Link to="/my-events" className="text-sm font-medium text-primary hover:text-primary-light">
                Open my events
              </Link>
            </div>
            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              <ActivityColumn title="Upcoming" emptyText="No upcoming registrations" items={registrationActivities.upcoming} />
              <ActivityColumn
                title="Ongoing / Recent"
                emptyText="No active registrations right now"
                items={registrationActivities.ongoingOrRecent}
              />
              <ActivityColumn title="Past" emptyText="No past registrations yet" items={registrationActivities.past} />
            </div>
          </Card>

          <Card>
            <h2 className="text-2xl font-bold text-text">Badge history</h2>
            {badgeHistory.length === 0 ? (
              <p className="mt-4 text-sm text-text-muted">No badge history yet.</p>
            ) : (
              <div className="mt-6 space-y-3">
                {badgeHistory.map((entry) => (
                  <BadgeHistoryCard key={entry.id} entry={entry} />
                ))}
              </div>
            )}
          </Card>

          <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-xl font-bold text-rose-300">
                  <AlertCircle className="h-5 w-5" />
                  Delete account
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-rose-300/70">
                  We’ll send a one-time code to your email before deletion. This keeps account removal
                  deliberate and secure.
                </p>
              </div>
              {deleteStep === "idle" && (
                <button
                  onClick={handleRequestDeleteOtp}
                  disabled={deleting}
                  className="inline-flex items-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-5 py-3 text-sm font-medium text-rose-300 disabled:opacity-60"
                >
                  {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                  Send delete OTP
                </button>
              )}
            </div>

            {deleteStep === "verify" && (
              <form className="mt-6 grid gap-4 md:grid-cols-[1fr_auto]" onSubmit={handleConfirmDelete}>
                <TextField
                  label="Verification code"
                  value={deleteCode}
                  onChange={(value) => setDeleteCode(value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="Enter 6-digit OTP"
                  required
                />
                <div className="flex flex-wrap items-end gap-3">
                  <button
                    type="button"
                    onClick={handleRequestDeleteOtp}
                    disabled={deleting}
                    className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-5 py-3 text-sm font-medium text-rose-300"
                  >
                    Resend OTP
                  </button>
                  <button
                    type="submit"
                    disabled={deleting || deleteCode.length !== 6}
                    className="inline-flex items-center gap-2 rounded-2xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    Confirm delete
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteStep("idle");
                      setDeleteCode("");
                    }}
                    className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-5 py-3 text-sm font-medium text-rose-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function Card({ children }: { children: ReactNode }) {
  return <div className="rounded-3xl border border-border bg-surface p-6 shadow-sm">{children}</div>;
}

function SummaryCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof User;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-3xl border border-border bg-surface p-5 shadow-sm">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-4 text-xs font-mono uppercase tracking-[0.18em] text-text-dim">{label}</p>
      <p className="mt-2 text-lg font-semibold text-text">{value}</p>
    </div>
  );
}

function MiniItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof User;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-background p-4">
      <div className="flex items-center gap-2 text-primary">
        <Icon className="h-4 w-4" />
        <p className="text-xs font-mono uppercase tracking-[0.18em] text-text-dim">{label}</p>
      </div>
      <p className="mt-3 text-sm font-medium text-text">{value}</p>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-xs font-mono uppercase tracking-[0.18em] text-text-dim">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
        required={required}
        className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-text outline-none transition-colors focus:border-primary"
      />
    </label>
  );
}

function ActivityColumn({
  title,
  emptyText,
  items,
}: {
  title: string;
  emptyText: string;
  items: EventRegistration[];
}) {
  return (
    <div className="rounded-2xl border border-border bg-background p-4">
      <h3 className="text-sm font-semibold text-text">{title}</h3>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-text-muted">{emptyText}</p>
      ) : (
        <div className="mt-4 space-y-3">
          {items.map((registration) => (
            <div key={registration.id} className="rounded-2xl border border-border bg-surface p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-text">{registration.event?.title ?? "Event"}</p>
                  <p className="mt-1 text-xs text-text-muted">
                    {registration.event?.startsAt
                      ? formatDateTime(registration.event.startsAt)
                      : "Date to be announced"}
                  </p>
                </div>
                <span
                  className={cn(
                    "rounded-full px-3 py-1 text-[11px] font-medium",
                    registration.status === "CONFIRMED"
                      ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"
                      : registration.status === "PENDING"
                        ? "bg-amber-500/10 text-amber-300 border border-amber-500/30"
                        : registration.status === "CANCELLED"
                          ? "bg-rose-500/10 text-rose-300 border border-rose-500/30"
                          : "bg-white/5 text-white/60 border border-white/10"
                  )}
                >
                  {registration.status}
                </span>
              </div>
              <p className="mt-3 text-xs text-text-muted">Registered on {formatDate(registration.createdAt)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CreatedEventCard({ event }: { event: Event }) {
  return (
    <Link
      to={`/events/${event.id}`}
      className="block rounded-2xl border border-border bg-background p-4 transition-colors hover:border-primary/40"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-text">{event.title}</p>
          <p className="mt-1 text-xs text-text-muted">
            {event.startsAt ? formatDateTime(event.startsAt) : "Date to be announced"}
          </p>
          <p className="mt-1 text-xs text-text-muted">{event.venue || "Venue not set"}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge
            tone={
              event.status === "PUBLISHED"
                ? "success"
                : event.status === "CANCELLED"
                  ? "danger"
                  : "default"
            }
          >
            {event.status}
          </StatusBadge>
          <StatusBadge tone={event.requiresPayment ? "warning" : "default"}>
            {event.requiresPayment ? "Paid" : "Free"}
          </StatusBadge>
          <StatusBadge tone="default">{event.participationType}</StatusBadge>
          <span className="rounded-full border border-border bg-surface px-3 py-1 text-[11px] font-medium text-text-muted">
            {event.registrations?.length ?? 0} registrations
          </span>
        </div>
      </div>
    </Link>
  );
}

function BadgeHistoryCard({ entry }: { entry: BadgeHistoryEntry }) {
  const tone =
    entry.status === "VERIFIED"
      ? "success"
      : entry.status === "PENDING"
        ? "warning"
        : entry.status === "REJECTED"
          ? "danger"
          : "default";

  return (
    <div className="rounded-2xl border border-border bg-background p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-text">{entry.status}</p>
          <p className="mt-1 text-xs text-text-muted">{formatDateTime(entry.createdAt)}</p>
        </div>
        <StatusBadge tone={tone}>{entry.status}</StatusBadge>
      </div>
      {entry.reviewer && (
        <p className="mt-3 text-xs text-text-muted">Reviewed by {entry.reviewer.fullName}</p>
      )}
      {entry.notes && <p className="mt-3 text-sm text-text-muted">{entry.notes}</p>}
    </div>
  );
}

function StatusBadge({
  children,
  tone = "default",
}: {
  children: string;
  tone?: "default" | "success" | "warning" | "danger";
}) {
  const classes =
    tone === "success"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
      : tone === "warning"
        ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
        : tone === "danger"
          ? "border-rose-500/30 bg-rose-500/10 text-rose-300"
          : "border-white/10 bg-white/5 text-white/60";

  return (
    <span className={cn("rounded-full border px-3 py-1 text-[11px] font-medium", classes)}>
      {children}
    </span>
  );
}
