import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  Crown,
  FolderKanban,
  ImageIcon,
  Loader2,
  Pencil,
  RefreshCw,
  Save,
  Shield,
  Trash2,
  UserCog,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";

type AdminTab = "groups" | "events" | "coordinators" | "users" | "create-admin";
import toast from "react-hot-toast";

import { useAuth } from "@/context/auth-context";
import api from "@/lib/api";
import { cn, formatDateTime } from "@/lib/utils";
import type { Event, EventGroupSummary, User } from "@/types";

type AdminEventGroup = EventGroupSummary & {
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    id: string;
    fullName: string;
    email?: string;
  };
  events?: Event[];
};

type EventGroupFormState = {
  title: string;
  subtitle: string;
  description: string;
  bannerImageUrl: string;
  venue: string;
  startsAt: string;
  endsAt: string;
  audienceScope: "OPEN" | "UNIVERSITY_ONLY";
  status: "DRAFT" | "PUBLISHED" | "CANCELLED" | "COMPLETED";
};

type EventFormState = {
  groupId: string;
  title: string;
  description: string;
  bannerImageUrl: string;
  backgroundImageUrl: string;
  participationType: "SOLO" | "TEAM";
  audienceScope: "OPEN" | "UNIVERSITY_ONLY";
  status: "DRAFT" | "PUBLISHED" | "CANCELLED" | "COMPLETED";
  requiresApproval: boolean;
  requiresPayment: boolean;
  entryFee: string;
  venue: string;
  startsAt: string;
  endsAt: string;
  registrationOpensAt: string;
  registrationClosesAt: string;
  maxParticipants: string;
  teamSizeMin: string;
  teamSizeMax: string;
};

type CreateAdminFormState = {
  fullName: string;
  email: string;
  password: string;
  phone: string;
};

type CoordinatorFormState = {
  userId: string;
  startsAt: string;
  endsAt: string;
};

const emptyGroupForm: EventGroupFormState = {
  title: "",
  subtitle: "",
  description: "",
  bannerImageUrl: "",
  venue: "",
  startsAt: "",
  endsAt: "",
  audienceScope: "OPEN",
  status: "PUBLISHED",
};

const emptyEventForm: EventFormState = {
  groupId: "",
  title: "",
  description: "",
  bannerImageUrl: "",
  backgroundImageUrl: "",
  participationType: "SOLO",
  audienceScope: "OPEN",
  status: "PUBLISHED",
  requiresApproval: true,
  requiresPayment: false,
  entryFee: "",
  venue: "",
  startsAt: "",
  endsAt: "",
  registrationOpensAt: "",
  registrationClosesAt: "",
  maxParticipants: "",
  teamSizeMin: "",
  teamSizeMax: "",
};

const emptyAdminForm: CreateAdminFormState = {
  fullName: "",
  email: "",
  password: "",
  phone: "",
};

const sidebarItems: { key: AdminTab; label: string; icon: typeof CalendarDays }[] = [
  { key: "groups", label: "Event Groups", icon: FolderKanban },
  { key: "events", label: "Events", icon: CalendarDays },
  { key: "coordinators", label: "Assign Coordinators", icon: UserCog },
  { key: "users", label: "Users", icon: Users },
  { key: "create-admin", label: "Create Admin", icon: UserPlus },
];

export default function AdminDashboard() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AdminTab>("groups");

  const [groups, setGroups] = useState<AdminEventGroup[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [userTabFilter, setUserTabFilter] = useState("ALL");
  const [loadingData, setLoadingData] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingGroup, setSavingGroup] = useState(false);
  const [savingEvent, setSavingEvent] = useState(false);
  const [savingAdmin, setSavingAdmin] = useState(false);
  const [actingOn, setActingOn] = useState<string | null>(null);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [groupForm, setGroupForm] = useState<EventGroupFormState>(emptyGroupForm);
  const [eventForm, setEventForm] = useState<EventFormState>(emptyEventForm);
  const [adminForm, setAdminForm] = useState<CreateAdminFormState>(emptyAdminForm);
  const [coordinatorForms, setCoordinatorForms] = useState<Record<string, CoordinatorFormState>>({});

  const getErrorMessage = (error: unknown, fallback: string) => {
    const data = (error as any)?.response?.data;
    if (data?.errors?.fieldErrors) {
      const fields = Object.keys(data.errors.fieldErrors);
      if (fields.length > 0) {
        return `${data.message || "Validation failed"}: ${fields[0]} - ${data.errors.fieldErrors[fields[0]][0]}`;
      }
    }
    return data?.message ?? fallback;
  };

  const studentCoordinatorOptions = useMemo(
    () =>
      users.filter(
        (candidate) => candidate.role === "STUDENT" && candidate.isActive && candidate.isEmailVerified
      ),
    [users]
  );

  const pendingBadges = useMemo(
    () => users.filter((candidate) => candidate.universityBadgeStatus === "PENDING").length,
    [users]
  );
  const publishedGroups = useMemo(
    () => groups.filter((group) => group.status === "PUBLISHED").length,
    [groups]
  );
  const publishedEvents = useMemo(
    () => events.filter((event) => event.status === "PUBLISHED").length,
    [events]
  );
  const coordinatorSlots = useMemo(
    () => events.reduce((count, event) => count + (event.coordinatorAssignments?.length ?? 0), 0),
    [events]
  );

  const loadData = async (showFullLoader = true) => {
    if (showFullLoader) setLoadingData(true);
    else setRefreshing(true);

    try {
      const [groupsResponse, eventsResponse, usersResponse] = await Promise.all([
        api.get("/admin/event-groups"),
        api.get("/admin/events"),
        api.get("/admin/users"),
      ]);

      setGroups(groupsResponse.data);
      setEvents(eventsResponse.data);
      setUsers(usersResponse.data);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to load admin data"));
    } finally {
      setLoadingData(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user || !isAdmin) {
      navigate("/");
      return;
    }
    void loadData();
  }, [authLoading, isAdmin, navigate, user]);

  useEffect(() => {
    if (eventForm.groupId || groups.length === 0) return;
    setEventForm((current) => ({ ...current, groupId: groups[0].id }));
  }, [eventForm.groupId, groups]);

  useEffect(() => {
    setCoordinatorForms((current) => {
      const next = { ...current };
      for (const event of events) {
        if (!next[event.id]) {
          next[event.id] = {
            userId: "",
            startsAt: toLocalDateTimeValue(event.registrationOpensAt || event.startsAt || new Date().toISOString()),
            endsAt: toLocalDateTimeValue(
              event.registrationClosesAt || event.endsAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
            ),
          };
        }
      }
      return next;
    });
  }, [events]);

  const buildGroupPayload = () => {
    const payload: Record<string, unknown> = {
      title: groupForm.title,
      audienceScope: groupForm.audienceScope,
      status: groupForm.status,
    };

    if (groupForm.subtitle) payload.subtitle = groupForm.subtitle;
    if (groupForm.description) payload.description = groupForm.description;
    if (groupForm.bannerImageUrl) payload.bannerImageUrl = groupForm.bannerImageUrl;
    if (groupForm.venue) payload.venue = groupForm.venue;
    if (groupForm.startsAt) payload.startsAt = new Date(groupForm.startsAt).toISOString();
    if (groupForm.endsAt) payload.endsAt = new Date(groupForm.endsAt).toISOString();

    return payload;
  };

  const buildEventPayload = () => {
    const payload: Record<string, unknown> = {
      title: eventForm.title,
      participationType: eventForm.participationType,
      audienceScope: eventForm.audienceScope,
      status: eventForm.status,
      requiresApproval: eventForm.requiresApproval,
      requiresPayment: eventForm.requiresPayment,
    };

    if (eventForm.groupId) payload.groupId = eventForm.groupId;
    if (eventForm.description) payload.description = eventForm.description;
    if (eventForm.bannerImageUrl) payload.bannerImageUrl = eventForm.bannerImageUrl;
    if (eventForm.backgroundImageUrl) payload.backgroundImageUrl = eventForm.backgroundImageUrl;
    if (eventForm.venue) payload.venue = eventForm.venue;
    
    if (eventForm.startsAt) payload.startsAt = new Date(eventForm.startsAt).toISOString();
    if (eventForm.endsAt) payload.endsAt = new Date(eventForm.endsAt).toISOString();
    if (eventForm.registrationOpensAt) payload.registrationOpensAt = new Date(eventForm.registrationOpensAt).toISOString();
    if (eventForm.registrationClosesAt) payload.registrationClosesAt = new Date(eventForm.registrationClosesAt).toISOString();
    
    if (eventForm.maxParticipants) payload.maxParticipants = Number(eventForm.maxParticipants);
    if (eventForm.requiresPayment && eventForm.entryFee) payload.entryFee = Number(eventForm.entryFee);

    if (eventForm.participationType === "TEAM") {
      if (eventForm.teamSizeMin) payload.teamSizeMin = Number(eventForm.teamSizeMin);
      if (eventForm.teamSizeMax) payload.teamSizeMax = Number(eventForm.teamSizeMax);
    }

    return payload;
  };

  const resetGroupForm = () => {
    setEditingGroupId(null);
    setGroupForm(emptyGroupForm);
  };

  const resetEventForm = () => {
    setEditingEventId(null);
    setEventForm((current) => ({ ...emptyEventForm, groupId: groups[0]?.id || current.groupId }));
  };

  const startEditingGroup = (group: AdminEventGroup) => {
    setEditingGroupId(group.id);
    setGroupForm({
      title: group.title,
      subtitle: group.subtitle || "",
      description: group.description || "",
      bannerImageUrl: group.bannerImageUrl || "",
      venue: group.venue || "",
      startsAt: group.startsAt ? toLocalDateTimeValue(group.startsAt) : "",
      endsAt: group.endsAt ? toLocalDateTimeValue(group.endsAt) : "",
      audienceScope: group.audienceScope,
      status: group.status,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const startEditingEvent = (event: Event) => {
    setEditingEventId(event.id);
    setEventForm({
      groupId: event.group?.id || groups[0]?.id || "",
      title: event.title,
      description: event.description || "",
      bannerImageUrl: event.bannerImageUrl || "",
      backgroundImageUrl: event.backgroundImageUrl || "",
      participationType: event.participationType,
      audienceScope: event.audienceScope,
      status: event.status,
      requiresApproval: Boolean(event.requiresApproval),
      requiresPayment: event.requiresPayment,
      entryFee: event.entryFee ? String(event.entryFee) : "",
      venue: event.venue || "",
      startsAt: event.startsAt ? toLocalDateTimeValue(event.startsAt) : "",
      endsAt: event.endsAt ? toLocalDateTimeValue(event.endsAt) : "",
      registrationOpensAt: event.registrationOpensAt ? toLocalDateTimeValue(event.registrationOpensAt) : "",
      registrationClosesAt: event.registrationClosesAt ? toLocalDateTimeValue(event.registrationClosesAt) : "",
      maxParticipants: event.maxParticipants ? String(event.maxParticipants) : "",
      teamSizeMin: event.teamSizeMin ? String(event.teamSizeMin) : "",
      teamSizeMax: event.teamSizeMax ? String(event.teamSizeMax) : "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const runAction = async (
    key: string,
    action: () => Promise<void>,
    successMessage: string,
    fallbackMessage: string
  ) => {
    setActingOn(key);
    try {
      await action();
      toast.success(successMessage);
      await loadData(false);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, fallbackMessage));
    } finally {
      setActingOn(null);
    }
  };

  const handleGroupSubmit = async (submitEvent: React.FormEvent) => {
    submitEvent.preventDefault();
    setSavingGroup(true);

    try {
      const payload = buildGroupPayload();
      if (editingGroupId) {
        await api.patch(`/admin/event-groups/${editingGroupId}`, payload);
        toast.success("Event group updated successfully");
      } else {
        await api.post("/admin/event-groups", payload);
        toast.success("Event group created successfully");
      }

      resetGroupForm();
      await loadData(false);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to save event group"));
    } finally {
      setSavingGroup(false);
    }
  };

  const handleEventSubmit = async (submitEvent: React.FormEvent) => {
    submitEvent.preventDefault();
    setSavingEvent(true);

    try {
      const payload = buildEventPayload();
      if (editingEventId) {
        await api.patch(`/admin/events/${editingEventId}`, payload);
        toast.success("Event updated successfully");
      } else {
        await api.post("/admin/events", payload);
        toast.success("Event created successfully");
      }

      resetEventForm();
      await loadData(false);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to save event"));
    } finally {
      setSavingEvent(false);
    }
  };

  const handleCreateAdmin = async (submitEvent: React.FormEvent) => {
    submitEvent.preventDefault();
    setSavingAdmin(true);

    try {
      await api.post("/admin/create-admin", {
        fullName: adminForm.fullName,
        email: adminForm.email,
        password: adminForm.password,
        phone: adminForm.phone || undefined,
      });
      toast.success("Admin account created successfully");
      setAdminForm(emptyAdminForm);
      await loadData(false);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to create admin account"));
    } finally {
      setSavingAdmin(false);
    }
  };

  const handleAssignCoordinator = async (eventId: string) => {
    const form = coordinatorForms[eventId];
    if (!form?.userId || !form.startsAt || !form.endsAt) {
      toast.error("Select a student and assignment window first");
      return;
    }

    await runAction(
      `assign:${eventId}`,
      async () => {
        await api.post(`/admin/events/${eventId}/coordinators`, {
          userId: form.userId,
          startsAt: new Date(form.startsAt).toISOString(),
          endsAt: new Date(form.endsAt).toISOString(),
        });
      },
      "Coordinator assigned successfully",
      "Failed to assign coordinator"
    );
  };

  if (authLoading || loadingData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-text">
      <header className="border-b border-border bg-surface/80">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-mono uppercase tracking-[0.24em] text-primary">Admin Workspace</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-text">Dashboard</h1>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => void loadData(false)}
                disabled={refreshing}
                className="inline-flex items-center gap-2 rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm font-semibold text-primary disabled:opacity-60"
              >
                <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
                Refresh
              </button>
              <Link
                to="/events"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white"
              >
                <CalendarDays className="h-4 w-4" />
                Public site
              </Link>
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Metric icon={CalendarDays} label="Published groups" value={publishedGroups} />
            <Metric icon={BadgeCheck} label="Published events" value={publishedEvents} />
            <Metric
              icon={Shield}
              label="Pending badges"
              value={pendingBadges}
              tone={pendingBadges > 0 ? "warning" : undefined}
            />
            <Metric icon={UserCog} label="Active coordinators" value={coordinatorSlots} />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl flex gap-0 lg:gap-8 px-4 py-8 sm:px-6 lg:px-8">
        {/* â”€â”€â”€ SIDEBAR â”€â”€â”€ */}
        <aside className="hidden lg:block w-60 shrink-0">
          <nav className="sticky top-24 space-y-1">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => setActiveTab(item.key)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors text-left",
                    isActive
                      ? "bg-primary/10 text-primary border border-primary/30"
                      : "text-white/50 hover:text-white hover:bg-white/5 border border-transparent"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                  {item.key === "users" && pendingBadges > 0 && (
                    <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-black text-white">
                      {pendingBadges}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* â”€â”€â”€ MOBILE TAB BAR â”€â”€â”€ */}
        <div className="lg:hidden mb-6 w-full overflow-x-auto">
          <div className="flex gap-2 pb-2">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => setActiveTab(item.key)}
                  className={cn(
                    "flex items-center gap-2 whitespace-nowrap rounded-2xl px-4 py-2.5 text-sm font-medium transition-colors border",
                    isActive
                      ? "bg-primary/10 text-primary border-primary/30"
                      : "text-white/50 border-white/10 bg-white/[0.03]"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* â”€â”€â”€ MAIN CONTENT AREA â”€â”€â”€ */}
        <main className="flex-1 min-w-0 space-y-10">
        {/* â•â•â• EVENT GROUPS TAB â•â•â• */}
        {activeTab === "groups" && (
        <>
        <section>
          <Card>
            <SectionTitle
              title={editingGroupId ? "Update event group" : "Create event group"}
              description="Groups hold related events together and can carry their own banner image."
            />
            <form className="mt-6 space-y-5" onSubmit={handleGroupSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <Input label="Group title" value={groupForm.title} onChange={(value) => setGroupForm((c) => ({ ...c, title: value }))} required />
                </div>
                <div className="md:col-span-2">
                  <Input label="Subtitle" value={groupForm.subtitle} onChange={(value) => setGroupForm((c) => ({ ...c, subtitle: value }))} />
                </div>
                <div className="md:col-span-2">
                  <Textarea label="Description / rules (Markdown supported)" value={groupForm.description} onChange={(value) => setGroupForm((c) => ({ ...c, description: value }))} />
                </div>
                <div className="md:col-span-2">
                  <ImageUploadInput label="Banner image URL" value={groupForm.bannerImageUrl} onChange={(value) => setGroupForm((c) => ({ ...c, bannerImageUrl: value }))} />
                </div>
                <Input label="Venue" value={groupForm.venue} onChange={(value) => setGroupForm((c) => ({ ...c, venue: value }))} />
                <Select label="Audience" value={groupForm.audienceScope} onChange={(value) => setGroupForm((c) => ({ ...c, audienceScope: value as EventGroupFormState["audienceScope"] }))} options={[["OPEN", "Open"], ["UNIVERSITY_ONLY", "University only"]]} />
                <DateTimeSplitInput label="Starts at" value={groupForm.startsAt} onChange={(value) => setGroupForm((c) => ({ ...c, startsAt: value }))} />
                <DateTimeSplitInput label="Ends at" value={groupForm.endsAt} onChange={(value) => setGroupForm((c) => ({ ...c, endsAt: value }))} />
                <div className="md:col-span-2">
                  <Select label="Status" value={groupForm.status} onChange={(value) => setGroupForm((c) => ({ ...c, status: value as EventGroupFormState["status"] }))} options={[["DRAFT", "Draft"], ["PUBLISHED", "Published"], ["CANCELLED", "Cancelled"], ["COMPLETED", "Completed"]]} />
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <PrimaryButton type="submit" loading={savingGroup} icon={Save}>{editingGroupId ? "Update group" : "Create group"}</PrimaryButton>
                {editingGroupId && (<button type="button" onClick={resetGroupForm} className="rounded-2xl border border-border bg-background px-5 py-3 text-sm font-medium text-text-muted">Cancel edit</button>)}
              </div>
            </form>
          </Card>
        </section>

        <section>
          <SectionTitle title="Event groups" description="Published groups and draft groups appear here." />
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            {groups.length === 0 ? (
              <EmptyState title="No event groups yet" description="Create your first group to organize related events together." icon={CalendarDays} />
            ) : (
              groups.map((group) => (
                <Card key={group.id}>
                  <PosterPreview imageUrl={group.bannerImageUrl} title={group.title} />
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Tag>{group.status}</Tag>
                    <Tag tone={group.audienceScope === "UNIVERSITY_ONLY" ? "warning" : "default"}>{group.audienceScope === "UNIVERSITY_ONLY" ? "University only" : "Open"}</Tag>
                    <Tag tone="success">{group.events?.length ?? 0} events</Tag>
                  </div>
                  <h3 className="mt-4 text-2xl font-bold text-text">{group.title}</h3>
                  {group.subtitle && <p className="mt-2 text-sm font-medium text-primary">{group.subtitle}</p>}
                  <p className="mt-3 text-sm leading-6 text-text-muted">{group.description || "No description added yet."}</p>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <Mini label="Venue" value={group.venue || "Not set"} />
                    <Mini label="Schedule" value={group.startsAt ? formatDateTime(group.startsAt) : "Not scheduled"} />
                  </div>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <button onClick={() => startEditingGroup(group)} className="inline-flex items-center gap-2 rounded-2xl border border-primary/30 bg-primary/10 px-4 py-2.5 text-sm font-medium text-primary">
                      <Pencil className="h-4 w-4" /> Edit
                    </button>
                    <button
                      onClick={() => { if (!window.confirm(`Delete "${group.title}" and its events?`)) return; void runAction(`delete-group:${group.id}`, async () => { await api.delete(`/admin/event-groups/${group.id}`); }, "Event group deleted", "Failed to delete event group"); }}
                      disabled={actingOn === `delete-group:${group.id}`}
                      className="inline-flex items-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-sm font-medium text-rose-300 disabled:opacity-60"
                    >
                      {actingOn === `delete-group:${group.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Delete
                    </button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </section>
        </>
        )}

        {/* â•â•â• EVENTS TAB â•â•â• */}
        {activeTab === "events" && (
        <>
        <section>
          <Card>
            <SectionTitle title={editingEventId ? "Update event" : "Create event"} description="Every event belongs to a group and can carry its own poster and background image." />
            <form className="mt-6 space-y-5" onSubmit={handleEventSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <Select label="Event group" value={eventForm.groupId} onChange={(value) => setEventForm((c) => ({ ...c, groupId: value }))} options={groups.map((g) => [g.id, g.title] as [string, string])} />
                <Select label="Participation type" value={eventForm.participationType} onChange={(value) => setEventForm((c) => ({ ...c, participationType: value as EventFormState["participationType"], teamSizeMin: value === "TEAM" ? c.teamSizeMin : "", teamSizeMax: value === "TEAM" ? c.teamSizeMax : "" }))} options={[["SOLO", "Solo"], ["TEAM", "Team"]]} />
                <div className="md:col-span-2"><Input label="Event title" value={eventForm.title} onChange={(value) => setEventForm((c) => ({ ...c, title: value }))} required /></div>
                <div className="md:col-span-2"><Textarea label="Description / rules (Markdown supported)" value={eventForm.description} onChange={(value) => setEventForm((c) => ({ ...c, description: value }))} /></div>
                <div className="md:col-span-2"><ImageUploadInput label="Poster image URL" value={eventForm.bannerImageUrl} onChange={(value) => setEventForm((c) => ({ ...c, bannerImageUrl: value }))} /></div>
                <div className="md:col-span-2"><ImageUploadInput label="Background image URL" value={eventForm.backgroundImageUrl} onChange={(value) => setEventForm((c) => ({ ...c, backgroundImageUrl: value }))} /></div>
                <Input label="Venue" value={eventForm.venue} onChange={(value) => setEventForm((c) => ({ ...c, venue: value }))} />
                <Select label="Audience" value={eventForm.audienceScope} onChange={(value) => setEventForm((c) => ({ ...c, audienceScope: value as EventFormState["audienceScope"] }))} options={[["OPEN", "Open"], ["UNIVERSITY_ONLY", "University only"]]} />
                <DateTimeSplitInput label="Starts at" value={eventForm.startsAt} onChange={(value) => setEventForm((c) => ({ ...c, startsAt: value }))} />
                <DateTimeSplitInput label="Ends at" value={eventForm.endsAt} onChange={(value) => setEventForm((c) => ({ ...c, endsAt: value }))} />
                <DateTimeSplitInput label="Registration opens" value={eventForm.registrationOpensAt} onChange={(value) => setEventForm((c) => ({ ...c, registrationOpensAt: value }))} />
                <DateTimeSplitInput label="Registration closes" value={eventForm.registrationClosesAt} onChange={(value) => setEventForm((c) => ({ ...c, registrationClosesAt: value }))} />
                <Input label="Maximum participants" type="number" value={eventForm.maxParticipants} onChange={(value) => setEventForm((c) => ({ ...c, maxParticipants: value }))} />
                <Select label="Status" value={eventForm.status} onChange={(value) => setEventForm((c) => ({ ...c, status: value as EventFormState["status"] }))} options={[["DRAFT", "Draft"], ["PUBLISHED", "Published"], ["CANCELLED", "Cancelled"], ["COMPLETED", "Completed"]]} />
                {eventForm.requiresPayment && <Input label="Entry fee" type="number" value={eventForm.entryFee} onChange={(value) => setEventForm((c) => ({ ...c, entryFee: value }))} />}
                {eventForm.participationType === "TEAM" && (
                  <>
                    <Input label="Minimum team size" type="number" value={eventForm.teamSizeMin} onChange={(value) => setEventForm((c) => ({ ...c, teamSizeMin: value }))} />
                    <Input label="Maximum team size" type="number" value={eventForm.teamSizeMax} onChange={(value) => setEventForm((c) => ({ ...c, teamSizeMax: value }))} />
                  </>
                )}
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <Toggle label="Coordinator approval required" checked={eventForm.requiresApproval} onChange={(checked) => setEventForm((c) => ({ ...c, requiresApproval: checked }))} />
                <Toggle label="Requires payment" checked={eventForm.requiresPayment} onChange={(checked) => setEventForm((c) => ({ ...c, requiresPayment: checked, entryFee: checked ? c.entryFee : "" }))} />
              </div>
              <div className="flex flex-wrap gap-3">
                <PrimaryButton type="submit" loading={savingEvent} icon={Save}>{editingEventId ? "Update event" : "Create event"}</PrimaryButton>
                {editingEventId && (<button type="button" onClick={resetEventForm} className="rounded-2xl border border-border bg-background px-5 py-3 text-sm font-medium text-text-muted">Cancel edit</button>)}
              </div>
            </form>
          </Card>
        </section>

        <section>
          <SectionTitle title="All events" description="All events across all groups." />
          <div className="mt-5 space-y-5">
            {events.length === 0 ? (
              <EmptyState title="No events yet" description="Create an event inside a group to start." icon={BadgeCheck} />
            ) : (
              events.map((event) => (
                <Card key={event.id}>
                  <div className="grid gap-6 xl:grid-cols-[1fr_auto]">
                    <div>
                      <PosterPreview imageUrl={event.bannerImageUrl || event.backgroundImageUrl} title={event.title} />
                      <div className="mt-5 flex flex-wrap gap-2">
                        <Tag>{event.status}</Tag>
                        <Tag tone={event.participationType === "TEAM" ? "warning" : "default"}>{event.participationType}</Tag>
                        <Tag tone={event.requiresPayment ? "warning" : "success"}>{event.requiresPayment ? `â‚¹${event.entryFee}` : "Free"}</Tag>
                      </div>
                      <h3 className="mt-4 text-2xl font-bold text-text">{event.title}</h3>
                      <p className="mt-2 text-sm text-text-muted">Group: {event.group?.title || "None"}</p>
                      <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        <Mini label="Starts" value={event.startsAt ? formatDateTime(event.startsAt) : "Not set"} />
                        <Mini label="Ends" value={event.endsAt ? formatDateTime(event.endsAt) : "Not set"} />
                        <Mini label="Venue" value={event.venue || "Not set"} />
                        <Mini label="Registrations" value={String(event.registrations?.length ?? 0)} />
                        <Mini label="Coordinator" value={event.coordinatorAssignments?.[0]?.user.fullName || "Not assigned"} />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3 items-start">
                      <button onClick={() => startEditingEvent(event)} className="inline-flex items-center gap-2 rounded-2xl border border-primary/30 bg-primary/10 px-4 py-2.5 text-sm font-medium text-primary">
                        <Pencil className="h-4 w-4" /> Edit
                      </button>
                      <button
                        onClick={() => { void runAction(`delete-event:${event.id}`, async () => { await api.delete(`/admin/events/${event.id}`); }, "Event deleted", "Failed to delete event"); }}
                        disabled={actingOn === `delete-event:${event.id}`}
                        className="inline-flex items-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-sm font-medium text-rose-300 disabled:opacity-60"
                      >
                        {actingOn === `delete-event:${event.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Delete
                      </button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </section>
        </>
        )}

        {/* â•â•â• COORDINATORS TAB â•â•â• */}
        {activeTab === "coordinators" && (
        <section>
          <SectionTitle title="Coordinator assignments" description="Assign student coordinators to approve registrations for each event." />
          <div className="mt-5 space-y-5">
            {events.length === 0 ? (
              <EmptyState title="No events yet" description="Create events first, then assign coordinators." icon={UserCog} />
            ) : (
              events.map((event) => {
                const coordinatorForm = coordinatorForms[event.id] ?? { userId: "", startsAt: "", endsAt: "" };
                return (
                <Card key={event.id}>
                  <h3 className="text-xl font-bold text-text">{event.title}</h3>
                  <p className="mt-1 text-sm text-text-muted">Group: {event.group?.title || "None"}</p>
                  <div className="mt-3">
                    <Mini label="Current coordinator" value={event.coordinatorAssignments?.[0]?.user.fullName || "Not assigned"} />
                  </div>

                  <p className="mt-5 text-xs font-mono uppercase tracking-[0.18em] text-text-dim">Assign new coordinator</p>
                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    <Select label="Student (Roll No)" value={coordinatorForm.userId} onChange={(value) => setCoordinatorForms((c) => ({ ...c, [event.id]: { ...coordinatorForm, userId: value } }))} options={[["", "Select a student"], ...studentCoordinatorOptions.map((u) => [u.id, `${u.fullName} (${u.universityStudentId || 'No Roll No'})`] as [string, string])]} />
                    <DateTimeSplitInput label="Starts at" value={coordinatorForm.startsAt} onChange={(value) => setCoordinatorForms((c) => ({ ...c, [event.id]: { ...coordinatorForm, startsAt: value } }))} />
                    <DateTimeSplitInput label="Ends at" value={coordinatorForm.endsAt} onChange={(value) => setCoordinatorForms((c) => ({ ...c, [event.id]: { ...coordinatorForm, endsAt: value } }))} />
                  </div>
                  <button onClick={() => void handleAssignCoordinator(event.id)} disabled={actingOn === `assign:${event.id}`} className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
                    {actingOn === `assign:${event.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCog className="h-4 w-4" />} Assign coordinator
                  </button>

                  {(event.coordinatorAssignments ?? []).length > 0 && (
                    <div className="mt-4 space-y-3">
                      <p className="text-xs font-mono uppercase tracking-[0.18em] text-text-dim">Active assignments</p>
                      {(event.coordinatorAssignments ?? []).map((assignment) => (
                        <div key={assignment.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="text-sm font-semibold text-text">{assignment.user.fullName}</p>
                              <p className="text-xs text-text-muted">{assignment.user.email}</p>
                              <p className="mt-1 text-xs text-text-dim">{formatDateTime(assignment.startsAt)} â†’ {formatDateTime(assignment.endsAt)}</p>
                            </div>
                            <button
                              onClick={() => void runAction(`deactivate-assignment:${assignment.id}`, async () => { await api.patch(`/admin/coordinator-assignments/${assignment.id}/deactivate`); }, "Coordinator deactivated", "Failed to deactivate")}
                              disabled={actingOn === `deactivate-assignment:${assignment.id}`}
                              className="inline-flex items-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-sm font-medium text-rose-300 disabled:opacity-60"
                            >
                              {actingOn === `deactivate-assignment:${assignment.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />} Deactivate
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
                );
              })
            )}
          </div>
        </section>
        )}

        {/* â•â•â• USERS TAB â•â•â• */}
        {activeTab === "users" && (
        <section>
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <SectionTitle title="Users" description="Review student verification, account activity, and existing admin accounts." />
            <select
              value={userTabFilter}
              onChange={(e) => setUserTabFilter(e.target.value)}
              className="mt-2 rounded-2xl border border-white/10 bg-[#0a0a0a] px-4 py-3 text-sm text-white outline-none transition-colors focus:border-primary shrink-0 min-w-[200px]"
            >
              <option value="ALL">All Users</option>
              <option value="ADMIN">Admins Only</option>
              <option value="OUTER">Outer Students</option>
              <option value="COURSE_YEAR">Course & Year</option>
            </select>
          </div>
          <div className="mt-5 space-y-4">
            {users.length === 0 ? (
              <EmptyState title="No users yet" description="Registered users will appear here." icon={Users} />
            ) : (
              (function () {
                const pendingUni = users.filter((u) => u.universityBadgeStatus === "PENDING" && u.role === "STUDENT");
                const verifiedUni = users.filter((u) => u.universityBadgeStatus === "VERIFIED" && u.role === "STUDENT");
                const nonUni = users.filter((u) => u.universityBadgeStatus !== "PENDING" && u.universityBadgeStatus !== "VERIFIED" && u.role === "STUDENT");
                const admins = users.filter((u) => u.role === "ADMIN");

                const renderUserList = (list: typeof users) => (
                  <div className="space-y-4">
                    {list.map((currentUser) => (
                      <div key={currentUser.id} className="rounded-3xl border border-border bg-surface p-5">
                       <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap gap-2">
                            <Tag tone={currentUser.role === "ADMIN" ? "warning" : "default"}>{currentUser.role}</Tag>
                            <Tag tone={currentUser.isActive ? "success" : "danger"}>{currentUser.isActive ? "ACTIVE" : "INACTIVE"}</Tag>
                            <Tag tone={currentUser.universityBadgeStatus === "VERIFIED" ? "success" : currentUser.universityBadgeStatus === "PENDING" ? "warning" : currentUser.universityBadgeStatus === "REJECTED" ? "danger" : "default"}>Badge: {currentUser.universityBadgeStatus}</Tag>
                          </div>
                          <h3 className="mt-4 text-xl font-bold text-text">{currentUser.fullName}</h3>
                          <p className="mt-1 text-sm text-text-muted">{currentUser.email}</p>
                          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            <Mini label="Department" value={currentUser.department || "Not set"} />
                            <Mini label="Course" value={currentUser.course || "Not set"} />
                            <Mini label="Year" value={currentUser.year ? String(currentUser.year) : "Not set"} />
                            <Mini label="Joined" value={formatDateTime(currentUser.createdAt)} />
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 xl:w-[15rem] xl:flex-col">
                          {currentUser.universityBadgeStatus === "PENDING" && (
                            <>
                              <button onClick={() => void runAction(`verify:${currentUser.id}`, async () => { await api.patch(`/admin/users/${currentUser.id}/university-badge`, { status: "VERIFIED" }); }, "Badge verified", "Failed to verify badge")} disabled={actingOn === `verify:${currentUser.id}`} className="inline-flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm font-medium text-emerald-300 disabled:opacity-60">
                                {actingOn === `verify:${currentUser.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Verify badge
                              </button>
                              <button onClick={() => void runAction(`reject:${currentUser.id}`, async () => { await api.patch(`/admin/users/${currentUser.id}/university-badge`, { status: "REJECTED" }); }, "Badge rejected", "Failed to reject badge")} disabled={actingOn === `reject:${currentUser.id}`} className="inline-flex items-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-sm font-medium text-rose-300 disabled:opacity-60">
                                {actingOn === `reject:${currentUser.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />} Reject badge
                              </button>
                            </>
                          )}
                          {currentUser.isActive ? (
                            <button onClick={() => void runAction(`deactivate:${currentUser.id}`, async () => { await api.patch(`/admin/users/${currentUser.id}/deactivate`); }, "User deactivated", "Failed to deactivate user")} disabled={actingOn === `deactivate:${currentUser.id}` || currentUser.id === user?.id} className="inline-flex items-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-sm font-medium text-rose-300 disabled:opacity-60">
                              {actingOn === `deactivate:${currentUser.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />} Deactivate
                            </button>
                          ) : (
                            <button onClick={() => void runAction(`activate:${currentUser.id}`, async () => { await api.patch(`/admin/users/${currentUser.id}/activate`); }, "User activated", "Failed to activate user")} disabled={actingOn === `activate:${currentUser.id}`} className="inline-flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm font-medium text-emerald-300 disabled:opacity-60">
                              {actingOn === `activate:${currentUser.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Activate
                            </button>
                          )}
                        </div>
                       </div>
                      </div>
                    ))}
                  </div>
                );

                const groupAndRender = (list: typeof users, title: string) => {
                  if (list.length === 0) return null;
                  const grouped = list.reduce((acc, u) => {
                    const c = (u.course || "Other / Not specified") + (u.year ? ` - Year ${u.year}` : "");
                    if (!acc[c]) acc[c] = [];
                    acc[c].push(u);
                    return acc;
                  }, {} as Record<string, typeof users>);

                  return (
                    <div className="space-y-6">
                      <div className="border-l-4 border-primary/50 pl-4">
                        <h2 className="text-xl font-bold tracking-tight text-white">{title}</h2>
                      </div>
                      {Object.keys(grouped).sort().map((course) => (
                        <div key={course} className="mt-4 space-y-3">
                          <h3 className="text-sm font-mono uppercase tracking-[0.18em] text-primary">{course} ({grouped[course].length})</h3>
                          {renderUserList(grouped[course])}
                        </div>
                      ))}
                    </div>
                  );
                };

                return (
                  <div className="flex flex-col gap-12">
                    {(userTabFilter === "ALL" || userTabFilter === "ADMIN") && admins.length > 0 && (
                      <div className="space-y-6">
                        <div className="border-l-4 border-warning/50 pl-4">
                           <h2 className="text-xl font-bold tracking-tight text-text">Platform Admins</h2>
                        </div>
                        {renderUserList(admins)}
                      </div>
                    )}
                    {(userTabFilter === "ALL" || userTabFilter === "COURSE_YEAR") && groupAndRender(pendingUni, "Pending University Verification")}
                    {(userTabFilter === "ALL" || userTabFilter === "COURSE_YEAR") && groupAndRender(verifiedUni, "Verified University Students")}
                    {(userTabFilter === "ALL" || userTabFilter === "OUTER") && nonUni.length > 0 && (
                      <div className="space-y-6">
                        <div className="border-l-4 border-border pl-4">
                           <h2 className="text-xl font-bold tracking-tight text-text">Non-University / Other Users</h2>
                        </div>
                        {renderUserList(nonUni)}
                      </div>
                    )}
                  </div>
                );
              })()
            )}
          </div>
        </section>
        )}

        {/* â•â•â• CREATE ADMIN TAB â•â•â• */}
        {activeTab === "create-admin" && (
        <section>
          <Card>
            <SectionTitle title="Create admin account" description="Student accounts can no longer be promoted. Create dedicated admin users here." />
            <form className="mt-6 space-y-5" onSubmit={handleCreateAdmin}>
              <Input label="Full name" value={adminForm.fullName} onChange={(value) => setAdminForm((c) => ({ ...c, fullName: value }))} required />
              <Input label="Email" type="email" value={adminForm.email} onChange={(value) => setAdminForm((c) => ({ ...c, email: value }))} required />
              <Input label="Password" type="password" value={adminForm.password} onChange={(value) => setAdminForm((c) => ({ ...c, password: value }))} required />
              <Input label="Phone" value={adminForm.phone} onChange={(value) => setAdminForm((c) => ({ ...c, phone: value }))} />
              <PrimaryButton type="submit" loading={savingAdmin} icon={Crown}>Create admin account</PrimaryButton>
            </form>
          </Card>
        </section>
        )}
      </main>
      </div>
    </div>
  );
}

function toLocalDateTimeValue(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60_000);
  return localDate.toISOString().slice(0, 16);
}

function SectionTitle({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h2 className="text-2xl font-black tracking-tight text-text">{title}</h2>
      <p className="mt-2 text-sm leading-7 text-text-muted">{description}</p>
    </div>
  );
}

function Card({ children }: { children: ReactNode }) {
  return <div className="rounded-3xl border border-border bg-surface p-6 shadow-sm">{children}</div>;
}

function Metric({ icon: Icon, label, value, tone }: { icon: typeof CalendarDays; label: string; value: number; tone?: "warning" }) {
  return (
    <div className={cn("rounded-3xl border p-5 shadow-sm", tone === "warning" ? "border-amber-500/30 bg-amber-500/10" : "border-white/10 bg-white/5")}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-mono uppercase tracking-[0.18em] text-text-dim">{label}</p>
          <p className="mt-3 text-3xl font-black tracking-tight text-text">{value}</p>
        </div>
        <div className={cn("rounded-2xl p-3", tone === "warning" ? "bg-amber-500/10 text-amber-300" : "bg-primary/10 text-primary")}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function PosterPreview({ imageUrl, title }: { imageUrl?: string; title: string }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-background">
      {imageUrl ? (
        <img src={imageUrl} alt={title} className="h-48 w-full object-cover" />
      ) : (
        <div className="flex h-48 items-center justify-center bg-[linear-gradient(135deg,#0a0a0a,#1a1a2e)] text-text-dim">
          <div className="text-center">
            <ImageIcon className="mx-auto h-8 w-8" />
            <p className="mt-3 text-xs font-mono uppercase tracking-[0.2em]">No image</p>
          </div>
        </div>
      )}
    </div>
  );
}

function Input({ label, value, onChange, type = "text", placeholder, required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string; required?: boolean }) {
  return (
    <label className="block space-y-2">
      <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-text-dim">{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} required={required} className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-text outline-none transition-colors focus:border-primary" />
    </label>
  );
}

function DateTimeSplitInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const datePart = value ? value.split("T")[0] : "";
  const timePart = value && value.includes("T") ? value.slice(11, 16) : "";

  return (
    <label className="block space-y-2">
      <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-text-dim">{label}</span>
      <div className="flex gap-2">
        <input 
          type="date" 
          value={datePart} 
          onChange={(e) => {
             const newDate = e.target.value;
             if (!newDate) return onChange(""); 
             onChange(`${newDate}T${timePart || "00:00"}`);
          }} 
          className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-text outline-none transition-colors focus:border-primary"
        />
        <input 
          type="time" 
          value={timePart} 
          onChange={(e) => {
             if (!datePart) return; 
             onChange(`${datePart}T${e.target.value}`);
          }} 
          className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-text outline-none transition-colors focus:border-primary"
        />
      </div>
    </label>
  );
}

function ImageUploadInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);
    setUploading(true);

    try {
      const response = await api.post("/upload", formData, { headers: { "Content-Type": "multipart/form-data" } });
      onChange(response.data.url);
      toast.success("Image uploaded!");
    } catch {
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  return (
    <label className="block space-y-2">
      <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-text-dim">{label}</span>
      <div className="flex items-center gap-3">
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder="Paste URL or upload file" disabled={uploading} className="w-1/2 rounded-2xl border border-border bg-background px-4 py-3 text-sm text-text outline-none transition-colors focus:border-primary disabled:opacity-50" />
        <input type="file" accept="image/*" onChange={(e) => void handleFileChange(e)} disabled={uploading} className="flex-1 rounded-2xl border border-border bg-background px-4 py-[9px] text-sm text-text outline-none transition-colors file:mr-4 file:cursor-pointer file:rounded-xl file:border-0 file:bg-primary/20 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary hover:file:bg-primary/30 disabled:opacity-50" />
        {uploading && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
      </div>
      {value && (
        <div className="mt-2 flex items-center justify-between rounded-xl bg-surface p-2 pr-4 shadow-sm border border-border/50">
          <img 
            src={value} 
            alt="Preview" 
            onError={(e) => { e.currentTarget.src = "https://placehold.co/128x72/111/444?text=Invalid\\nURL"; }}
            className="h-[4.5rem] w-32 rounded-lg object-cover bg-black" 
          />
          <button type="button" onClick={() => onChange("")} className="text-rose-500 hover:text-rose-400 text-xs font-semibold uppercase tracking-wider">Remove</button>
        </div>
      )}
    </label>
  );
}

function Textarea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block space-y-2">
      <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-text-dim">{label}</span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={4} className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-text outline-none transition-colors focus:border-primary" />
    </label>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<[string, string]> }) {
  return (
    <label className="block space-y-2">
      <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-text-dim">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-text outline-none transition-colors focus:border-primary">
        {options.map(([optionValue, optionLabel]) => (<option key={`${label}-${optionValue}`} value={optionValue}>{optionLabel}</option>))}
      </select>
    </label>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-border bg-background px-4 py-3">
      <span className="text-sm font-medium text-text">{label}</span>
      <button type="button" onClick={() => onChange(!checked)} className={cn("relative h-7 w-12 rounded-full transition-colors", checked ? "bg-primary" : "bg-border")}>
        <span className={cn("absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform", checked ? "left-6" : "left-1")} />
      </button>
    </label>
  );
}

function PrimaryButton({ children, type = "button", loading = false, icon: Icon }: { children: ReactNode; type?: "button" | "submit"; loading?: boolean; icon?: typeof Save }) {
  return (
    <button type={type} disabled={loading} className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : Icon ? <Icon className="h-4 w-4" /> : null}
      {children}
    </button>
  );
}

function Tag({ children, tone = "default" }: { children: ReactNode; tone?: "default" | "success" | "warning" | "danger" }) {
  const toneClass =
    tone === "success" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
    : tone === "warning" ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
    : tone === "danger" ? "border-rose-500/30 bg-rose-500/10 text-rose-300"
    : "border-border bg-background text-text-muted";
  return <span className={cn("rounded-full border px-3 py-1 text-[11px] font-medium", toneClass)}>{children}</span>;
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-background p-3">
      <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-text-dim">{label}</p>
      <p className="mt-1.5 text-sm font-medium text-text">{value}</p>
    </div>
  );
}

function EmptyState({ title, description, icon: Icon }: { title: string; description: string; icon: typeof CalendarDays }) {
  return (
    <div className="rounded-3xl border border-dashed border-border bg-surface p-10 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-text">{title}</h3>
      <p className="mt-2 text-sm text-text-muted">{description}</p>
    </div>
  );
}

