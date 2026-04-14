import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Loader2, ShieldCheck, Users, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { useAuth } from "@/context/auth-context";
import api from "@/lib/api";
import { cn, formatDateTime } from "@/lib/utils";
import type { EventRegistration } from "@/types";

type CoordinatorEvent = {
  id: string;
  startsAt: string;
  endsAt: string;
  event: {
    id: string;
    title: string;
    slug: string;
    venue?: string;
    startsAt?: string;
    group?: {
      title: string;
    };
    _count?: {
      registrations: number;
    };
  };
};

type RegistrationDeskResponse = {
  event: {
    id: string;
    title: string;
    venue?: string;
    startsAt?: string;
    group?: {
      title: string;
    };
  };
  registrations: EventRegistration[];
};

export default function CoordinatorPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [events, setEvents] = useState<CoordinatorEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [desk, setDesk] = useState<RegistrationDeskResponse | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [deskLoading, setDeskLoading] = useState(false);
  const [actingOn, setActingOn] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});

  const loadAssignedEvents = async () => {
    const response = await api.get("/coordinator/events");
    setEvents(response.data);
    if (!selectedEventId && response.data.length > 0) {
      setSelectedEventId(response.data[0].event.id);
    }
  };

  const loadDesk = async (eventId: string) => {
    setDeskLoading(true);
    try {
      const response = await api.get(`/coordinator/events/${eventId}/registrations`);
      setDesk(response.data);
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Failed to load registrations";
      toast.error(message);
      setDesk(null);
    } finally {
      setDeskLoading(false);
    }
  };

  useEffect(() => {
    if (loading) return;

    if (!user) {
      navigate("/login");
      return;
    }

    if (!user.effectiveRoles.includes("COORDINATOR")) {
      navigate(user.role === "ADMIN" ? "/admin" : "/");
      return;
    }

    loadAssignedEvents()
      .catch(() => toast.error("Failed to load coordinator assignments"))
      .finally(() => setPageLoading(false));
  }, [loading, navigate, user]);

  useEffect(() => {
    if (!selectedEventId) return;
    void loadDesk(selectedEventId);
  }, [selectedEventId]);

  const pendingCount = useMemo(
    () => desk?.registrations.filter((registration) => registration.status === "PENDING").length ?? 0,
    [desk]
  );

  const handleReview = async (registrationId: string, status: "CONFIRMED" | "REJECTED") => {
    setActingOn(registrationId);
    try {
      await api.patch(`/coordinator/registrations/${registrationId}/review`, {
        status,
        reviewNote: reviewNotes[registrationId] || undefined,
      });
      toast.success(status === "CONFIRMED" ? "Registration approved" : "Registration rejected");
      if (selectedEventId) {
        await Promise.all([loadAssignedEvents(), loadDesk(selectedEventId)]);
      }
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Failed to review registration";
      toast.error(message);
    } finally {
      setActingOn(null);
    }
  };

  if (loading || pageLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-text">
      <section className="border-b border-border bg-surface/70">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <p className="text-xs font-mono uppercase tracking-[0.22em] text-primary">Coordinator desk</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-text">Approve student registrations</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-text-muted">
            Each assigned student coordinator can review registrations for one event. Only coordinators
            and admins can access participating student details.
          </p>
        </div>
      </section>

      <section className="py-10">
        <div className="mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
          {events.length === 0 ? (
            <div className="rounded-[2rem] border border-dashed border-border bg-surface px-6 py-16 text-center">
              <ShieldCheck className="mx-auto h-10 w-10 text-text-dim" />
              <h2 className="mt-4 text-lg font-semibold text-text">No active coordinator assignment</h2>
              <p className="mt-2 text-sm text-text-muted">
                Once an admin assigns you to an event, it will appear here.
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-4 xl:grid-cols-3">
                {events.map((assignment) => (
                  <button
                    key={assignment.id}
                    onClick={() => setSelectedEventId(assignment.event.id)}
                    className={cn(
                      "rounded-[2rem] border p-5 text-left shadow-sm transition-colors",
                      selectedEventId === assignment.event.id
                        ? "border-primary/40 bg-primary/10"
                        : "border-border bg-surface hover:border-primary/30"
                    )}
                  >
                    <p className="text-xs font-mono uppercase tracking-[0.18em] text-primary">
                      {assignment.event.group?.title || "Assigned event"}
                    </p>
                    <h2 className="mt-3 text-2xl font-bold text-text">{assignment.event.title}</h2>
                    <p className="mt-2 text-sm text-text-muted">
                      {assignment.event.startsAt ? formatDateTime(assignment.event.startsAt) : "Date to be announced"}
                    </p>
                    <p className="mt-1 text-sm text-text-muted">{assignment.event.venue || "Venue to be announced"}</p>
                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <MiniStat label="Assignment ends" value={formatDateTime(assignment.endsAt)} />
                      <MiniStat
                        label="Pending requests"
                        value={String(assignment.event._count?.registrations ?? 0)}
                      />
                    </div>
                  </button>
                ))}
              </div>

              <div className="rounded-[2rem] border border-border bg-surface p-6 shadow-sm">
                {deskLoading ? (
                  <div className="flex min-h-[16rem] items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : !desk ? (
                  <div className="py-12 text-center text-sm text-text-muted">
                    Select an event to load its registrations.
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                      <div>
                        <p className="text-xs font-mono uppercase tracking-[0.18em] text-primary">
                          {desk.event.group?.title || "Assigned event"}
                        </p>
                        <h2 className="mt-3 text-3xl font-black tracking-tight text-text">
                          {desk.event.title}
                        </h2>
                        <p className="mt-2 text-sm text-text-muted">
                          {desk.event.venue || "Venue to be announced"}
                        </p>
                      </div>
                      <div className="rounded-3xl border border-border bg-background px-5 py-4">
                        <p className="text-xs font-mono uppercase tracking-[0.18em] text-text-dim">
                          Pending approvals
                        </p>
                        <p className="mt-2 text-3xl font-black text-text">{pendingCount}</p>
                      </div>
                    </div>

                    <div className="mt-6 space-y-4">
                      {desk.registrations.length === 0 ? (
                        <div className="rounded-3xl border border-dashed border-border bg-background px-6 py-12 text-center">
                          <Users className="mx-auto h-8 w-8 text-text-dim" />
                          <p className="mt-4 text-sm text-text-muted">No registrations submitted yet.</p>
                        </div>
                      ) : (
                        desk.registrations.map((registration) => (
                          <div key={registration.id} className="rounded-3xl border border-border bg-background p-5">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                              <div>
                                <p className="text-lg font-semibold text-text">
                                  {registration.team ? registration.team.name : registration.user?.fullName || "Student"}
                                </p>
                                <p className="mt-1 text-sm text-text-muted">
                                  {registration.team
                                    ? `${registration.team.members?.length ?? 0} team members`
                                    : registration.user?.email || "Student participant"}
                                </p>
                                <p className="mt-2 text-xs text-text-dim">
                                  Submitted {formatDateTime(registration.createdAt)}
                                </p>
                              </div>

                              <span
                                className={cn(
                                  "rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]",
                                  registration.status === "CONFIRMED"
                                    ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"
                                    : registration.status === "REJECTED"
                                      ? "bg-rose-500/10 text-rose-300 border border-rose-500/30"
                                      : "bg-amber-500/10 text-amber-300 border border-amber-500/30"
                                )}
                              >
                                {registration.status}
                              </span>
                            </div>

                            {registration.status === "PENDING" ? (
                              <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_auto]">
                                <label className="block space-y-2">
                                  <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-text-dim">
                                    Review note
                                  </span>
                                  <textarea
                                    value={reviewNotes[registration.id] || ""}
                                    onChange={(event) =>
                                      setReviewNotes((current) => ({
                                        ...current,
                                        [registration.id]: event.target.value,
                                      }))
                                    }
                                    rows={3}
                                    className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-text outline-none transition-colors focus:border-primary"
                                    placeholder="Optional note for the student"
                                  />
                                </label>

                                <div className="flex flex-wrap items-end gap-3">
                                  <button
                                    onClick={() => void handleReview(registration.id, "CONFIRMED")}
                                    disabled={actingOn === registration.id}
                                    className="inline-flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-300 disabled:opacity-60"
                                  >
                                    {actingOn === registration.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <CheckCircle2 className="h-4 w-4" />
                                    )}
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => void handleReview(registration.id, "REJECTED")}
                                    disabled={actingOn === registration.id}
                                    className="inline-flex items-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-300 disabled:opacity-60"
                                  >
                                    {actingOn === registration.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <XCircle className="h-4 w-4" />
                                    )}
                                    Reject
                                  </button>
                                </div>
                              </div>
                            ) : registration.reviewNote ? (
                              <div className="mt-4 rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-text-muted">
                                {registration.reviewNote}
                              </div>
                            ) : null}
                          </div>
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-background p-4">
      <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-text-dim">{label}</p>
      <p className="mt-2 text-sm font-semibold text-text">{value}</p>
    </div>
  );
}
