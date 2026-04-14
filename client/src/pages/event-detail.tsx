import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  CreditCard,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Phone,
  Shield,
  Trash2,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";

import { useAuth } from "@/context/auth-context";
import api from "@/lib/api";
import { cn, formatDate, formatDateTime } from "@/lib/utils";
import type { Event, EventRegistration, SiteContent } from "@/types";

export default function EventDetailPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [event, setEvent] = useState<Event | null>(null);
  const [siteContent, setSiteContent] = useState<SiteContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [memberIds, setMemberIds] = useState("");
  const [teamCode, setTeamCode] = useState("");
  const [teamRegistrationMode, setTeamRegistrationMode] = useState<"create" | "join">("create");

  useEffect(() => {
    if (!eventId) {
      return;
    }

    setLoading(true);

    Promise.allSettled([api.get(`/events/${eventId}`), api.get("/site-content")])
      .then(([eventResult, siteResult]) => {
        if (eventResult.status === "fulfilled") {
          setEvent(eventResult.value.data);
        } else {
          const message =
            (eventResult.reason as { response?: { data?: { message?: string } } })?.response?.data
              ?.message ?? "Event not found";
          toast.error(message);
          setEvent(null);
        }

        if (siteResult.status === "fulfilled") {
          setSiteContent(siteResult.value.data);
        } else {
          setSiteContent(null);
        }
      })
      .finally(() => setLoading(false));
  }, [eventId]);

  const refreshEvent = async () => {
    if (!eventId) {
      return;
    }

    const response = await api.get(`/events/${eventId}`);
    setEvent(response.data);
  };

  const myRegistration = event?.myRegistration ?? null;
  const activeRegistrations = useMemo(
    () => event?.registrations?.filter((entry) => entry.status !== "CANCELLED") ?? [],
    [event?.registrations]
  );

  const registrationLockedByAnotherEvent = Boolean(
    user?.hasActiveRegistration && !myRegistration && user.activeRegistrationEventId !== event?.id
  );
  const registrationBlockedForAdmin = user?.role === "ADMIN";
  const canAuthenticatedUserRegister =
    Boolean(user) &&
    !myRegistration &&
    !registrationLockedByAnotherEvent &&
    !registrationBlockedForAdmin &&
    event?.status === "PUBLISHED";
  const canRegister =
    !myRegistration && !registrationLockedByAnotherEvent && !registrationBlockedForAdmin && event?.status === "PUBLISHED";

  const handleSoloRegister = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    setRegistering(true);
    try {
      await api.post(`/events/${eventId}/register`, {});
      toast.success("Registration submitted successfully");
      await Promise.all([refreshEvent(), refreshUser()]);
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Registration failed";
      toast.error(message);
    } finally {
      setRegistering(false);
    }
  };

  const handleTeamRegister = async (submissionEvent: React.FormEvent) => {
    submissionEvent.preventDefault();

    if (!user) {
      navigate("/login");
      return;
    }

    setRegistering(true);
    try {
      const payload: { name: string; memberIds?: string[] } = {
        name: teamName,
      };
      const parsedMemberIds = memberIds
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      if (parsedMemberIds.length > 0) {
        payload.memberIds = parsedMemberIds;
      }

      await api.post(`/events/${eventId}/register-team`, payload);
      toast.success("Team registration submitted successfully");
      setTeamName("");
      setMemberIds("");
      await Promise.all([refreshEvent(), refreshUser()]);
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Team registration failed";
      toast.error(message);
    } finally {
      setRegistering(false);
    }
  };

  const handleJoinTeam = async (submissionEvent: React.FormEvent) => {
    submissionEvent.preventDefault();

    if (!user) {
      navigate("/login");
      return;
    }

    if (!teamCode.trim()) {
      toast.error("Please enter a valid Team Code");
      return;
    }

    setRegistering(true);
    try {
      await api.post(`/events/${eventId}/join-team`, { teamCode: teamCode.trim() });
      toast.success("Successfully joined the team!");
      setTeamCode("");
      await Promise.all([refreshEvent(), refreshUser()]);
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Failed to join team";
      toast.error(message);
    } finally {
      setRegistering(false);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await api.delete(`/events/${eventId}/register`);
      toast.success("Registration cancelled");
      await Promise.all([refreshEvent(), refreshUser()]);
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Failed to cancel registration";
      toast.error(message);
    } finally {
      setCancelling(false);
    }
  };

  const handleRemoveMember = async (targetUserId: string) => {
    try {
      await api.delete(`/events/${eventId}/team/members/${targetUserId}`);
      toast.success("Team member removed");
      await refreshEvent();
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Failed to remove member";
      toast.error(message);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#020202]">
        <Loader2 className="h-8 w-8 animate-spin text-[#ff5665]" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#020202] px-4 text-center text-white">
        <XCircle className="h-12 w-12 text-white/40" />
        <h1 className="mt-5 text-3xl font-black uppercase tracking-tight">Event not found</h1>
        <p className="mt-3 max-w-md text-sm text-white/60">
          This event may have been removed, kept in draft mode, or restricted to verified
          university students.
        </p>
        <Link
          to="/events"
          className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to events
        </Link>
      </div>
    );
  }

  const posterImage = event.bannerImageUrl || event.backgroundImageUrl || event.group?.bannerImageUrl;
  const infoPhone = siteContent?.contactPhone || "+91 97998 81036";
  const infoEmail = siteContent?.contactEmail || "sangeetam@shobhituniversity.ac.in";
  const infoAddress = `${siteContent?.collegeName || "Shobhit University"}${siteContent?.campusName ? `, ${siteContent.campusName}` : ""}, Adarsh Institutional Area, Babu Vijendra Marg, Gangoh, Saharanpur, Uttar Pradesh 247341`;
  const descriptionBlocks = buildDescriptionBlocks(event.description);

  return (
    <div className="min-h-screen bg-[#020202] text-white">
      <div className="absolute inset-x-0 top-0 h-[38rem] bg-[radial-gradient(circle_at_top_left,rgba(255,86,101,0.16),transparent_24%),linear-gradient(180deg,#0a0a0a_0%,#020202_85%)]" />

      <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Link
          to="/events"
          className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-white/60 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to events
        </Link>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="overflow-hidden rounded-[2rem] border border-[#ff5665]/35 bg-black shadow-[0_24px_80px_rgba(255,86,101,0.12)]">
            <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="bg-[#0b1131]">
                {posterImage ? (
                  <img src={posterImage} alt={event.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex min-h-[20rem] items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(255,86,101,0.14),transparent_22%),linear-gradient(135deg,#10183c,#0b0b0b_65%)] px-8 text-center">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#ff8994]">
                        {event.group?.title || "Event poster"}
                      </p>
                      <h1 className="mt-5 text-4xl font-black uppercase tracking-tight text-white">
                        {event.title}
                      </h1>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-5 border-t border-white/8 bg-[#060606] p-6 lg:border-l lg:border-t-0">
                <ContactCard title="Let's Join With Us" phone={infoPhone} email={infoEmail} address={infoAddress} />
                <RegistrationCard
                  event={event}
                  myRegistration={myRegistration}
                  registering={registering}
                  cancelling={cancelling}
                  canRegister={canRegister}
                  canAuthenticatedUserRegister={canAuthenticatedUserRegister}
                  registrationLockedByAnotherEvent={registrationLockedByAnotherEvent}
                  registrationBlockedForAdmin={Boolean(registrationBlockedForAdmin)}
                  teamName={teamName}
                  memberIds={memberIds}
                  teamCode={teamCode}
                  teamRegistrationMode={teamRegistrationMode}
                  setTeamName={setTeamName}
                  setMemberIds={setMemberIds}
                  setTeamCode={setTeamCode}
                  setTeamRegistrationMode={setTeamRegistrationMode}
                  onSoloRegister={handleSoloRegister}
                  onTeamRegister={handleTeamRegister}
                  onJoinTeam={handleJoinTeam}
                  onCancel={handleCancel}
                  onRemoveMember={handleRemoveMember}
                  currentUserId={user?.id}
                  onLogin={() => navigate("/login")}
                  isLoggedIn={Boolean(user)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-5 lg:pt-3">
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
              <div className="flex flex-wrap gap-2">
                <Badge>{event.participationType}</Badge>
                <Badge tone={event.requiresPayment ? "warning" : "success"}>
                  {event.requiresPayment ? "Paid" : "Free"}
                </Badge>
                <Badge tone={event.audienceScope === "UNIVERSITY_ONLY" ? "accent" : "default"}>
                  {event.audienceScope === "UNIVERSITY_ONLY" ? "University only" : "Open"}
                </Badge>
                {event.requiresApproval && <Badge tone="accent">Approval required</Badge>}
              </div>

              <h1 className="mt-6 text-4xl font-black uppercase tracking-tight text-white">
                {event.title}
              </h1>
              <p className="mt-3 text-sm uppercase tracking-[0.18em] text-[#ff8994]">
                {event.group?.title || "Featured event"}
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <InfoCard
                  icon={CreditCard}
                  label="Registration fees"
                  value={event.requiresPayment && event.entryFee ? `Rs. ${event.entryFee}` : "Free"}
                />
                <InfoCard
                  icon={CalendarDays}
                  label="Registration deadline"
                  value={event.registrationClosesAt ? formatDate(event.registrationClosesAt) : "To be announced"}
                />
                <InfoCard
                  icon={CalendarDays}
                  label="Event schedule"
                  value={event.startsAt ? formatDateTime(event.startsAt) : "Coming soon"}
                />
                <InfoCard
                  icon={MapPin}
                  label="Venue"
                  value={event.venue || event.group?.venue || "Venue to be announced"}
                />
              </div>
            </div>

            {event.audienceScope === "UNIVERSITY_ONLY" && (
              <div className="rounded-[2rem] border border-sky-500/25 bg-sky-500/10 p-6 text-sky-100">
                <div className="flex items-start gap-3">
                  <Shield className="mt-0.5 h-5 w-5 text-sky-300" />
                  <div>
                    <h2 className="text-lg font-bold uppercase tracking-[0.08em]">
                      Verified university badge required
                    </h2>
                    <p className="mt-2 text-sm leading-7 text-sky-100/80">
                      Only verified university students can view and register for this event.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[2rem] border border-[#ff5665]/30 bg-black p-6 sm:p-8">
            <p className="text-lg font-black uppercase tracking-tight text-white sm:text-2xl">
              Registration Fees:-{" "}
              <span className="text-[#ff5665]">
                {event.requiresPayment && event.entryFee ? `Rs. ${event.entryFee}` : "Free"}
              </span>
            </p>

            <div className="mt-8 flex items-center gap-4">
              <h2 className="text-3xl font-black tracking-tight text-[#ff5665] sm:text-5xl">
                Rules and Regulation
              </h2>
              <div className="h-px flex-1 bg-[#ff5665]/50" />
            </div>

            <div className="mt-8 space-y-8">
              <MarkdownSection
                title="About this event"
                content={event.description}
                emptyText="The admin has not added detailed rules for this event yet."
              />

              <DescriptionSection
                title="Registration details"
                items={[
                  `Group: ${event.group?.title || "General events"}`,
                  `Participation: ${event.participationType === "TEAM" ? "Team registration" : "Solo registration"}`,
                  `Approval flow: ${event.requiresApproval ? "Coordinator or admin approval is required" : "Direct confirmation"}`,
                  event.registrationOpensAt
                    ? `Registration opens: ${formatDateTime(event.registrationOpensAt)}`
                    : "Registration opens immediately",
                  event.registrationClosesAt
                    ? `Registration closes: ${formatDateTime(event.registrationClosesAt)}`
                    : "Registration close time has not been announced",
                ]}
              />

              {event.participationType === "TEAM" && (
                <DescriptionSection
                  title="Team requirements"
                  items={[
                    event.teamSizeMin && event.teamSizeMax
                      ? `Teams must include between ${event.teamSizeMin} and ${event.teamSizeMax} students.`
                      : event.teamSizeMax
                        ? `Teams can include up to ${event.teamSizeMax} students.`
                        : "The admin has not set a maximum team size yet.",
                    "Each student can stay in only one active event registration at a time.",
                  ]}
                />
              )}
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
              <h2 className="text-xl font-black uppercase tracking-tight text-white">
                Quick facts
              </h2>
              <div className="mt-5 space-y-3">
                <FactRow label="Status" value={event.status} />
                <FactRow
                  label="Audience"
                  value={event.audienceScope === "UNIVERSITY_ONLY" ? "University only" : "Open"}
                />
                <FactRow label="Registrations" value={String(event.registrationCount ?? 0)} />
                <FactRow
                  label="Coordinator approval"
                  value={event.requiresApproval ? "Required" : "Not required"}
                />
              </div>
            </div>

            {event.canManageRegistrations && (
              <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 print:hidden">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-black uppercase tracking-tight text-white">
                    Participating students
                  </h2>
                  <button
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/20"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Print List
                  </button>
                </div>
                {activeRegistrations.length === 0 ? (
                  <p className="mt-4 text-sm text-white/60">No registrations have been submitted yet.</p>
                ) : (
                  <div className="mt-5 space-y-3">
                    {activeRegistrations.map((registration) => (
                      <ParticipantCard key={registration.id} registration={registration} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {event.canManageRegistrations && (
        <div className="hidden print:block fixed inset-0 z-[9999] bg-white p-8 text-black">
          <h1 className="text-2xl font-bold uppercase">{event.title} - Participant List</h1>
          <p className="mt-2 text-sm text-gray-500">Generated on {new Date().toLocaleDateString()}</p>
          <table className="mt-6 w-full border-collapse border border-gray-300 text-left text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-4 py-2">Name / Team Name</th>
                <th className="border border-gray-300 px-4 py-2">Details</th>
                <th className="border border-gray-300 px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {activeRegistrations.map((reg) => {
                if (reg.team) {
                  return (
                    <React.Fragment key={reg.id}>
                      <tr className="bg-gray-50">
                        <td className="border border-gray-300 px-4 py-2 font-bold" colSpan={3}>
                          Team: {reg.team.name}
                        </td>
                      </tr>
                      {reg.team.members?.map((member) => (
                        <tr key={member.id}>
                          <td className="border border-gray-300 px-4 py-2 pl-8 font-medium">
                            {member.user?.fullName || "Student"} {member.role === "CAPTAIN" ? "(Captain)" : ""}
                          </td>
                          <td className="border border-gray-300 px-4 py-2">
                            {member.user?.email || "N/A"}
                          </td>
                          <td className="border border-gray-300 px-4 py-2 uppercase">
                            {reg.status}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                }

                return (
                  <tr key={reg.id}>
                    <td className="border border-gray-300 px-4 py-2 font-medium">
                      {reg.user?.fullName || "Student"}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {reg.user?.email || "N/A"}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 uppercase">
                      {reg.status}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function RegistrationCard({
  event,
  myRegistration,
  registering,
  cancelling,
  canRegister,
  canAuthenticatedUserRegister,
  registrationLockedByAnotherEvent,
  registrationBlockedForAdmin,
  teamName,
  memberIds,
  teamCode,
  teamRegistrationMode,
  setTeamName,
  setMemberIds,
  setTeamCode,
  setTeamRegistrationMode,
  onSoloRegister,
  onTeamRegister,
  onJoinTeam,
  onCancel,
  onRemoveMember,
  currentUserId,
  onLogin,
  isLoggedIn,
}: {
  event: Event;
  myRegistration: EventRegistration | null;
  registering: boolean;
  cancelling: boolean;
  canRegister: boolean;
  canAuthenticatedUserRegister: boolean;
  registrationLockedByAnotherEvent: boolean;
  registrationBlockedForAdmin: boolean;
  teamName: string;
  memberIds: string;
  teamCode: string;
  teamRegistrationMode: "create" | "join";
  setTeamName: (value: string) => void;
  setMemberIds: (value: string) => void;
  setTeamCode: (value: string) => void;
  setTeamRegistrationMode: (value: "create" | "join") => void;
  onSoloRegister: () => Promise<void>;
  onTeamRegister: (event: React.FormEvent) => Promise<void>;
  onJoinTeam: (event: React.FormEvent) => Promise<void>;
  onCancel: () => Promise<void>;
  onRemoveMember: (userId: string) => void;
  currentUserId?: string;
  onLogin: () => void;
  isLoggedIn: boolean;
}) {
  return (
    <>
      <div className="rounded-[2rem] border border-[#ff5665]/35 bg-black p-6">
        <button
          onClick={() => {
            if (!isLoggedIn) {
              onLogin();
              return;
            }

            if (event.participationType === "SOLO" && canRegister) {
              void onSoloRegister();
            }
          }}
          disabled={event.participationType !== "SOLO" || (isLoggedIn && !canAuthenticatedUserRegister) || registering}
          className="inline-flex w-full items-center justify-center gap-2 rounded-none bg-[#ff5665] px-5 py-4 text-lg font-black uppercase tracking-[0.08em] text-white transition-colors disabled:cursor-not-allowed disabled:bg-white/15 disabled:text-white/45"
        >
          {registering && event.participationType === "SOLO" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Lock className="h-4 w-4" />
          )}
          {myRegistration
            ? "Already registered"
            : !isLoggedIn
              ? "Login to register"
              : event.participationType === "TEAM"
                ? "Team registration below"
                : "Register now"}
        </button>

        {myRegistration ? (
          <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-100">
            <p className="font-semibold uppercase tracking-[0.08em]">You are already registered</p>
            {myRegistration.team && (
              <div className="mt-3 rounded-xl bg-black/30 p-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#ff8994]">Team info</p>
                <p className="mt-1 text-sm font-bold text-white">{myRegistration.team.name}</p>
                <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-2">
                  <span className="text-[10px] font-medium uppercase text-white/40">Team Code:</span>
                  <code className="rounded bg-[#ff5665]/20 px-1.5 py-0.5 text-xs font-bold text-[#ff8994]">
                    {myRegistration.team.id}
                  </code>
                </div>
                <p className="mt-2 text-[10px] italic text-white/50">Share this code with your friends to join</p>
                {myRegistration.team.members && myRegistration.team.members.length > 0 && (
                  <div className="mt-3 space-y-2 border-t border-white/10 pt-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#ff8994]">Team Members</p>
                    {myRegistration.team.members.map((member) => (
                      <div key={member.id} className="flex items-center justify-between gap-2 text-xs text-white/70">
                        <div className="flex flex-1 items-center gap-2">
                          <span className="min-w-[40px] font-semibold uppercase tracking-wider text-white/50">
                            {member.role === "CAPTAIN" ? "Capt" : "Memb"}
                          </span>
                          <span>{member.user?.fullName || "Student"}</span>
                          {member.userId === currentUserId && <span className="text-[#ff8994]">(You)</span>}
                        </div>
                        {currentUserId === myRegistration.team?.captainId && member.userId !== currentUserId && (
                          <button
                            type="button"
                            onClick={() => onRemoveMember(member.userId)}
                            className="rounded bg-rose-500/20 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-rose-300 transition-colors hover:bg-rose-500/30"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            <p className="mt-3 text-sm">Status: {myRegistration.status}</p>
            <button
              onClick={() => void onCancel()}
              disabled={cancelling}
              className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-2 text-sm font-semibold uppercase tracking-[0.08em] text-rose-200 disabled:opacity-60"
            >
              {cancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Cancel registration
            </button>
          </div>
        ) : registrationBlockedForAdmin ? (
          <Notice tone="warning">
            Admin accounts cannot register as participating students.
          </Notice>
        ) : !isLoggedIn ? (
          <Notice tone="default">Login first to submit your registration.</Notice>
        ) : registrationLockedByAnotherEvent ? (
          <Notice tone="warning">
            You already have an active registration in another event. Cancel that registration
            before joining a new one.
          </Notice>
        ) : event.status !== "PUBLISHED" ? (
          <Notice tone="default">Registration is unavailable because this event is not published.</Notice>
        ) : !canRegister && isLoggedIn ? (
          <Notice tone="default">Registration is currently unavailable for this event.</Notice>
        ) : null}
      </div>

      {event.participationType === "TEAM" && !myRegistration && (
        <div className="mt-5 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 focus-within:border-[#ff5665]/30">
          <div className="mb-6 flex gap-2 rounded-xl bg-black/40 p-1">
            <button
              type="button"
              onClick={() => setTeamRegistrationMode("create")}
              className={cn(
                "flex-1 rounded-lg py-2 text-[10px] font-bold uppercase tracking-widest transition-all",
                teamRegistrationMode === "create" ? "bg-[#ff5665] text-white" : "text-white/40 hover:text-white"
              )}
            >
              Create Team
            </button>
            <button
              type="button"
              onClick={() => setTeamRegistrationMode("join")}
              className={cn(
                "flex-1 rounded-lg py-2 text-[10px] font-bold uppercase tracking-widest transition-all",
                teamRegistrationMode === "join" ? "bg-[#ff5665] text-white" : "text-white/40 hover:text-white"
              )}
            >
              Join Team
            </button>
          </div>

          {teamRegistrationMode === "create" ? (
            <form onSubmit={(e) => void onTeamRegister(e)} className="space-y-4">
              <p className="text-xs leading-6 text-white/60">
                Register a new team for this event. You will become the captain.
              </p>
              <label className="block space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                  Team name
                </span>
                <input
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  required
                  disabled={!canAuthenticatedUserRegister || registering}
                  className="w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:border-[#ff5665]"
                  placeholder="Enter your team name"
                />
              </label>

              <button
                type="submit"
                disabled={!canAuthenticatedUserRegister || registering || teamName.trim().length < 2}
                className="inline-flex w-full items-center justify-center gap-2 rounded-none bg-[#ff5665] px-5 py-4 text-sm font-black uppercase tracking-[0.08em] text-white transition-colors disabled:cursor-not-allowed disabled:bg-white/15 disabled:text-white/45"
              >
                {registering ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
                Register Team
              </button>
            </form>
          ) : (
            <form onSubmit={(e) => void onJoinTeam(e)} className="space-y-4">
              <p className="text-xs leading-6 text-white/60">
                Enter the secret Team Code shared by your captain to join.
              </p>
              <label className="block space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                  Team code
                </span>
                <input
                  value={teamCode}
                  onChange={(e) => setTeamCode(e.target.value)}
                  required
                  disabled={!canAuthenticatedUserRegister || registering}
                  className="w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:border-[#ff5665]"
                  placeholder="Paste team code here..."
                />
              </label>

              <button
                type="submit"
                disabled={!canAuthenticatedUserRegister || registering || !teamCode.trim()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-none bg-[#ff5665] px-5 py-4 text-sm font-black uppercase tracking-[0.08em] text-white transition-colors disabled:cursor-not-allowed disabled:bg-white/15 disabled:text-white/45"
              >
                {registering ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
                Join Team
              </button>
            </form>
          )}
        </div>
      )}
    </>
  );
}

function ContactCard({
  title,
  phone,
  email,
  address,
}: {
  title: string;
  phone: string;
  email: string;
  address: string;
}) {
  return (
    <div className="rounded-[2rem] border border-[#ff5665]/35 bg-black p-6">
      <h2 className="text-3xl font-black uppercase tracking-tight text-white">{title}</h2>
      <div className="mt-6 space-y-4 text-sm text-white/85">
        <ContactRow icon={Phone} value={phone} />
        <ContactRow icon={Mail} value={email} />
        <ContactRow icon={MapPin} value={address} />
      </div>
    </div>
  );
}

function ContactRow({
  icon: Icon,
  value,
}: {
  icon: typeof Phone;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 text-[#ff5665]" />
      <p className="leading-6">{value}</p>
    </div>
  );
}

function InfoCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#ff5665]/10 text-[#ff8994]">
        <Icon className="h-4 w-4" />
      </div>
      <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function DescriptionSection({
  title,
  items,
  emptyText,
}: {
  title: string;
  items: string[];
  emptyText?: string;
}) {
  return (
    <section>
      <h3 className="text-2xl font-black tracking-tight text-white">{title}</h3>
      {items.length === 0 ? (
        <p className="mt-4 text-sm leading-7 text-white/60">
          {emptyText || "No details available yet."}
        </p>
      ) : (
        <ul className="mt-4 space-y-3 text-base leading-8 text-white/85">
          {items.map((item) => (
            <li key={item} className="flex gap-3">
              <span className="pt-2 text-[#ff5665]">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function MarkdownSection({
  title,
  content,
  emptyText,
}: {
  title: string;
  content?: string;
  emptyText?: string;
}) {
  return (
    <section>
      <h3 className="text-2xl font-black tracking-tight text-white">{title}</h3>
      {!content || content.trim().length === 0 ? (
        <p className="mt-4 text-sm leading-7 text-white/60">
          {emptyText || "No details available yet."}
        </p>
      ) : (
        <div className="mt-4 prose prose-invert prose-p:leading-8 prose-p:text-white/85 prose-headings:text-white prose-a:text-[#ff5665] prose-li:text-white/85 max-w-none">
          <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{content}</ReactMarkdown>
        </div>
      )}
    </section>
  );
}

function ParticipantCard({ registration }: { registration: EventRegistration }) {
  return (
    <div className="rounded-[1.6rem] border border-white/10 bg-black/45 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-white">
            {registration.team ? registration.team.name : registration.user?.fullName || "Student"}
          </p>
          <p className="mt-1 text-xs text-white/50">
            {registration.team
              ? `${registration.team.members?.length ?? 0} team members`
              : registration.user?.email || "Student participant"}
          </p>
          {registration.team && registration.team.members && registration.team.members.length > 0 && (
            <div className="mt-3 space-y-1 border-t border-white/10 pt-3">
              {registration.team.members.map((member) => (
                <div key={member.id} className="flex items-center gap-2 text-xs text-white/70">
                  <span className="w-12 font-semibold uppercase tracking-wider text-[#ff8994]">
                    {member.role === "CAPTAIN" ? "Capt" : "Memb"}
                  </span>
                  <span>{member.user?.fullName || "Student"}</span>
                  <span className="text-white/40">({member.user?.email || "N/A"})</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <span
          className={cn(
            "rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]",
            registration.status === "CONFIRMED"
              ? "bg-emerald-500/10 text-emerald-300"
              : registration.status === "REJECTED"
                ? "bg-rose-500/10 text-rose-300"
                : "bg-amber-500/10 text-amber-300"
          )}
        >
          {registration.status}
        </span>
      </div>
    </div>
  );
}

function FactRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/35 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">{label}</p>
      <p className="text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function Notice({
  children,
  tone,
}: {
  children: string;
  tone: "default" | "warning";
}) {
  const toneClass =
    tone === "warning"
      ? "border-amber-500/25 bg-amber-500/10 text-amber-100"
      : "border-white/10 bg-white/[0.04] text-white/70";

  return <div className={cn("mt-4 rounded-2xl border p-4 text-sm leading-6", toneClass)}>{children}</div>;
}

function Badge({
  children,
  tone = "default",
}: {
  children: string;
  tone?: "default" | "success" | "warning" | "accent";
}) {
  const toneClass =
    tone === "success"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
      : tone === "warning"
        ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
        : tone === "accent"
          ? "border-sky-500/30 bg-sky-500/10 text-sky-300"
          : "border-white/10 bg-white/[0.04] text-white/65";

  return (
    <span className={cn("rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]", toneClass)}>
      {children}
    </span>
  );
}

function buildDescriptionBlocks(description?: string) {
  if (!description) {
    return [];
  }

  return description
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}
