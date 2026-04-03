import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Users,
  CalendarDays,
  Shield,
  Layers,
  Loader2,
  Plus,
  Trash2,
  Crown,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Terminal,
  ChevronDown,
  Save,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import type { User, Event, CoordinatorAssignment } from "@/types";
import { cn, formatDate } from "@/lib/utils";

type Tab = "users" | "events" | "groups" | "coordinators";

interface EventGroup {
  id: string;
  title: string;
  description?: string;
  venue?: string;
  startsAt?: string;
  endsAt?: string;
  audienceScope: string;
  status: string;
  events?: Event[];
}

export default function AdminDashboard() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("users");

  useEffect(() => {
    if (!user || !isAdmin) navigate("/");
  }, [user, isAdmin, navigate]);

  const tabs: { key: Tab; label: string; icon: typeof Users }[] = [
    { key: "users", label: "USERS", icon: Users },
    { key: "events", label: "EVENTS", icon: CalendarDays },
    { key: "groups", label: "EVENT GROUPS", icon: Layers },
    { key: "coordinators", label: "COORDINATORS", icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="py-16 border-b border-border relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-danger/10 border border-danger/30 text-danger font-mono text-xs uppercase tracking-widest mb-4">
            <Shield className="w-3 h-3" /> Admin Access
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tighter uppercase">
            Control <span className="text-primary">Panel</span>
          </h1>
          <p className="text-text-muted font-mono text-sm mt-2">
            Manage users, events, groups, and coordinators.
          </p>
        </div>
      </section>

      {/* Tab Bar */}
      <div className="border-b border-border bg-surface sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex overflow-x-auto">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  "flex items-center gap-2 px-6 py-4 text-xs font-bold font-mono tracking-widest uppercase border-b-2 transition-all whitespace-nowrap",
                  tab === t.key
                    ? "border-primary text-primary"
                    : "border-transparent text-text-muted hover:text-white"
                )}
              >
                <t.icon className="w-4 h-4" />
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {tab === "users" && <UsersTab />}
        {tab === "events" && <EventsTab />}
        {tab === "groups" && <GroupsTab />}
        {tab === "coordinators" && <CoordinatorsTab />}
      </div>
    </div>
  );
}

/* ========================= USERS TAB ========================= */
function UsersTab() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    try {
      const { data } = await api.get("/admin/users");
      setUsers(data);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const promoteToAdmin = async (userId: string) => {
    try {
      await api.post(`/admin/users/${userId}/make-admin`);
      toast.success("User promoted to admin!");
      fetchUsers();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed";
      toast.error(msg);
    }
  };

  const reviewBadge = async (userId: string, status: "VERIFIED" | "REJECTED") => {
    try {
      await api.patch(`/admin/users/${userId}/university-badge`, { status });
      toast.success(`Badge ${status.toLowerCase()}!`);
      fetchUsers();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed";
      toast.error(msg);
    }
  };

  if (loading) return <LoadingState />;

  return (
    <div>
      <h2 className="text-lg font-black text-white font-mono tracking-widest uppercase mb-6 flex items-center gap-2">
        <Users className="w-5 h-5 text-primary" /> All Users ({users.length})
      </h2>
      <div className="space-y-3">
        {users.map((u) => (
          <div key={u.id} className="p-5 bg-surface border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-primary/10 border border-primary flex items-center justify-center text-primary text-sm font-bold font-mono shrink-0">
                {u.fullName?.[0]?.toUpperCase() ?? "?"}
              </div>
              <div>
                <p className="text-sm font-bold text-white uppercase tracking-wider">{u.fullName}</p>
                <p className="text-xs font-mono text-text-muted">{u.email}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className={cn(
                    "px-2 py-0.5 text-[10px] font-bold font-mono tracking-widest uppercase border",
                    u.role === "ADMIN" ? "border-danger/50 text-danger bg-danger/10" : "border-border text-text-muted bg-background"
                  )}>
                    {u.role}
                  </span>
                  {u.universityBadgeStatus !== "NONE" && (
                    <span className={cn(
                      "px-2 py-0.5 text-[10px] font-bold font-mono tracking-widest uppercase border",
                      u.universityBadgeStatus === "VERIFIED" ? "border-success/50 text-success bg-success/10" :
                      u.universityBadgeStatus === "PENDING" ? "border-warning/50 text-warning bg-warning/10" :
                      "border-danger/50 text-danger bg-danger/10"
                    )}>
                      🎓 {u.universityBadgeStatus}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 sm:flex-nowrap shrink-0">
              {u.role !== "ADMIN" && (
                <button
                  onClick={() => promoteToAdmin(u.id)}
                  className="px-3 py-1.5 text-[10px] font-bold font-mono uppercase tracking-widest border border-warning/50 text-warning bg-warning/10 hover:bg-warning/20 transition-colors"
                >
                  <Crown className="w-3 h-3 inline mr-1" />Make Admin
                </button>
              )}
              {u.universityBadgeStatus === "PENDING" && (
                <>
                  <button
                    onClick={() => reviewBadge(u.id, "VERIFIED")}
                    className="px-3 py-1.5 text-[10px] font-bold font-mono uppercase tracking-widest border border-success/50 text-success bg-success/10 hover:bg-success/20 transition-colors"
                  >
                    <CheckCircle className="w-3 h-3 inline mr-1" />Verify
                  </button>
                  <button
                    onClick={() => reviewBadge(u.id, "REJECTED")}
                    className="px-3 py-1.5 text-[10px] font-bold font-mono uppercase tracking-widest border border-danger/50 text-danger bg-danger/10 hover:bg-danger/20 transition-colors"
                  >
                    <XCircle className="w-3 h-3 inline mr-1" />Reject
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ========================= EVENTS TAB ========================= */
function EventsTab() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [groups, setGroups] = useState<EventGroup[]>([]);

  // Form
  const [form, setForm] = useState({
    groupId: "",
    title: "",
    description: "",
    type: "VISITING" as string,
    participationType: "SOLO" as string,
    audienceScope: "OPEN" as string,
    status: "DRAFT" as string,
    venue: "",
    startsAt: "",
    endsAt: "",
  });
  const [saving, setSaving] = useState(false);

  const fetchEvents = useCallback(async () => {
    try {
      const { data } = await api.get("/events");
      setEvents(data);
    } catch {
      toast.error("Failed to load events");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchGroups = useCallback(async () => {
    try {
      const { data } = await api.get("/admin/users");
      // We need groups — let's try fetching events that have groupId
      // Actually admin creates event groups, let me just try listing
      void data;
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchEvents(); fetchGroups(); }, [fetchEvents, fetchGroups]);

  // Also fetch groups for the dropdown
  useEffect(() => {
    api.get("/events").then((res) => {
      // Extract unique groups from events metadata if available
      // For now we will let user type groupId
      void res;
    }).catch(() => {});
  }, []);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        groupId: form.groupId,
        title: form.title,
        type: form.type,
        participationType: form.participationType,
        audienceScope: form.audienceScope,
        status: form.status,
      };
      if (form.description) payload.description = form.description;
      if (form.venue) payload.venue = form.venue;
      if (form.startsAt) payload.startsAt = new Date(form.startsAt).toISOString();
      if (form.endsAt) payload.endsAt = new Date(form.endsAt).toISOString();
      await api.post("/admin/events", payload);
      toast.success("Event created!");
      setShowForm(false);
      setForm({ groupId: "", title: "", description: "", type: "VISITING", participationType: "SOLO", audienceScope: "OPEN", status: "DRAFT", venue: "", startsAt: "", endsAt: "" });
      fetchEvents();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to create event";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const deleteEvent = async (eventId: string) => {
    if (!confirm("Delete this event?")) return;
    try {
      await api.delete(`/admin/events/${eventId}`);
      toast.success("Event deleted");
      fetchEvents();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed";
      toast.error(msg);
    }
  };

  if (loading) return <LoadingState />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-black text-white font-mono tracking-widest uppercase flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-primary" /> Events ({events.length})
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-black text-xs font-bold font-mono tracking-widest uppercase hover:bg-primary-light transition-colors"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? "CANCEL" : "CREATE"}
        </button>
      </div>

      {showForm && (
        <motion.form
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          onSubmit={handleCreateEvent}
          className="p-6 bg-surface border border-primary/30 mb-8 space-y-4"
        >
          <h3 className="text-xs font-bold text-primary font-mono tracking-widest uppercase flex items-center gap-2">
            <Terminal className="w-4 h-4" /> New Event
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField label="Group ID *" value={form.groupId} onChange={(v) => setForm({ ...form, groupId: v })} required />
            <InputField label="Title *" value={form.title} onChange={(v) => setForm({ ...form, title: v })} required />
            <InputField label="Venue" value={form.venue} onChange={(v) => setForm({ ...form, venue: v })} />
            <SelectField label="Type" value={form.type} onChange={(v) => setForm({ ...form, type: v })} options={["PVP", "RANKED", "VISITING"]} />
            <SelectField label="Participation" value={form.participationType} onChange={(v) => setForm({ ...form, participationType: v })} options={["SOLO", "TEAM"]} />
            <SelectField label="Audience" value={form.audienceScope} onChange={(v) => setForm({ ...form, audienceScope: v })} options={["OPEN", "UNIVERSITY_ONLY"]} />
            <SelectField label="Status" value={form.status} onChange={(v) => setForm({ ...form, status: v })} options={["DRAFT", "PUBLISHED", "CANCELLED", "COMPLETED"]} />
            <InputField label="Starts At" value={form.startsAt} onChange={(v) => setForm({ ...form, startsAt: v })} type="datetime-local" />
            <InputField label="Ends At" value={form.endsAt} onChange={(v) => setForm({ ...form, endsAt: v })} type="datetime-local" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-text-muted font-mono tracking-widest uppercase mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 bg-background border border-border text-text text-sm font-mono placeholder:text-text-dim focus:outline-none focus:border-primary transition-colors resize-none"
            />
          </div>
          <button
            type="submit"
            disabled={saving || !form.title || !form.groupId}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-black text-xs font-bold font-mono tracking-widest uppercase hover:bg-primary-light transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            CREATE EVENT
          </button>
        </motion.form>
      )}

      <div className="space-y-3">
        {events.map((ev) => (
          <div key={ev.id} className="p-5 bg-surface border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-white uppercase tracking-wider">{ev.title}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="px-2 py-0.5 text-[10px] font-bold font-mono tracking-widest uppercase border border-primary/50 text-primary bg-primary/10">{ev.type}</span>
                <span className="px-2 py-0.5 text-[10px] font-bold font-mono tracking-widest uppercase border border-border text-text-muted bg-background">{ev.participationType}</span>
                <span className={cn(
                  "px-2 py-0.5 text-[10px] font-bold font-mono tracking-widest uppercase border",
                  ev.status === "PUBLISHED" ? "border-success/50 text-success bg-success/10" :
                  ev.status === "DRAFT" ? "border-warning/50 text-warning bg-warning/10" :
                  "border-border text-text-muted bg-background"
                )}>{ev.status}</span>
              </div>
              {ev.startsAt && <p className="text-[10px] font-mono text-text-dim mt-2 uppercase tracking-widest">START: {formatDate(ev.startsAt)}</p>}
            </div>
            <button
              onClick={() => deleteEvent(ev.id)}
              className="px-3 py-1.5 text-[10px] font-bold font-mono uppercase tracking-widest border border-danger/50 text-danger bg-danger/10 hover:bg-danger/20 transition-colors shrink-0"
            >
              <Trash2 className="w-3 h-3 inline mr-1" />Delete
            </button>
          </div>
        ))}
        {events.length === 0 && <EmptyState label="No events found" />}
      </div>
    </div>
  );
}

/* ========================= EVENT GROUPS TAB ========================= */
function GroupsTab() {
  const [showForm, setShowForm] = useState(false);
  const [groups, setGroups] = useState<EventGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: "", description: "", venue: "", audienceScope: "OPEN", status: "DRAFT" });
  const [saving, setSaving] = useState(false);

  // There's no public GET /event-groups endpoint visible, so we show a creation form
  // and rely on the admin to know the group IDs
  useEffect(() => {
    // Try to list event groups if endpoint exists
    api.get("/events").then((res) => {
      // Extract groups from events data if available
      const evts = res.data as Event[];
      // Group by groupId - but we don't have group details from this endpoint
      // We'll show what we can
      void evts;
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        title: form.title,
        audienceScope: form.audienceScope,
        status: form.status,
      };
      if (form.description) payload.description = form.description;
      if (form.venue) payload.venue = form.venue;
      const { data } = await api.post("/admin/event-groups", payload);
      toast.success(`Event group created! ID: ${data.id}`);
      setGroups((prev) => [...prev, data]);
      setShowForm(false);
      setForm({ title: "", description: "", venue: "", audienceScope: "OPEN", status: "DRAFT" });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const deleteGroup = async (groupId: string) => {
    if (!confirm("Delete this event group?")) return;
    try {
      await api.delete(`/admin/event-groups/${groupId}`);
      toast.success("Group deleted");
      setGroups((prev) => prev.filter((g) => g.id !== groupId));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed";
      toast.error(msg);
    }
  };

  if (loading) return <LoadingState />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-black text-white font-mono tracking-widest uppercase flex items-center gap-2">
          <Layers className="w-5 h-5 text-primary" /> Event Groups
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-black text-xs font-bold font-mono tracking-widest uppercase hover:bg-primary-light transition-colors"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? "CANCEL" : "CREATE GROUP"}
        </button>
      </div>

      {showForm && (
        <motion.form
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          onSubmit={handleCreate}
          className="p-6 bg-surface border border-primary/30 mb-8 space-y-4"
        >
          <h3 className="text-xs font-bold text-primary font-mono tracking-widest uppercase flex items-center gap-2">
            <Terminal className="w-4 h-4" /> New Event Group (Fest)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField label="Title *" value={form.title} onChange={(v) => setForm({ ...form, title: v })} required />
            <InputField label="Venue" value={form.venue} onChange={(v) => setForm({ ...form, venue: v })} />
            <SelectField label="Audience" value={form.audienceScope} onChange={(v) => setForm({ ...form, audienceScope: v })} options={["OPEN", "UNIVERSITY_ONLY"]} />
            <SelectField label="Status" value={form.status} onChange={(v) => setForm({ ...form, status: v })} options={["DRAFT", "PUBLISHED", "CANCELLED", "COMPLETED"]} />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-text-muted font-mono tracking-widest uppercase mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 bg-background border border-border text-text text-sm font-mono placeholder:text-text-dim focus:outline-none focus:border-primary transition-colors resize-none"
            />
          </div>
          <button
            type="submit"
            disabled={saving || !form.title}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-black text-xs font-bold font-mono tracking-widest uppercase hover:bg-primary-light transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            CREATE GROUP
          </button>
        </motion.form>
      )}

      <div className="p-5 bg-surface border border-dashed border-border text-center mb-6">
        <AlertTriangle className="w-6 h-6 text-warning mx-auto mb-2" />
        <p className="text-xs font-mono text-text-muted tracking-widest uppercase">
          Created groups will appear below. Copy the Group ID to use when creating events.
        </p>
      </div>

      <div className="space-y-3">
        {groups.map((g) => (
          <div key={g.id} className="p-5 bg-surface border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-white uppercase tracking-wider">{g.title}</p>
              <p className="text-[10px] font-mono text-primary mt-1 tracking-widest select-all">ID: {g.id}</p>
              {g.description && <p className="text-xs text-text-muted mt-1">{g.description}</p>}
            </div>
            <button
              onClick={() => deleteGroup(g.id)}
              className="px-3 py-1.5 text-[10px] font-bold font-mono uppercase tracking-widest border border-danger/50 text-danger bg-danger/10 hover:bg-danger/20 transition-colors shrink-0"
            >
              <Trash2 className="w-3 h-3 inline mr-1" />Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ========================= COORDINATORS TAB ========================= */
function CoordinatorsTab() {
  const [assignments, setAssignments] = useState<(CoordinatorAssignment & { user?: { fullName: string; email: string } })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ userId: "", eventId: "", startsAt: "", endsAt: "" });
  const [saving, setSaving] = useState(false);

  const fetchAssignments = useCallback(async () => {
    try {
      const { data } = await api.get("/admin/coordinators");
      setAssignments(data);
    } catch {
      toast.error("Failed to load coordinators");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAssignments(); }, [fetchAssignments]);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/admin/coordinators", {
        userId: form.userId,
        eventId: form.eventId,
        startsAt: new Date(form.startsAt).toISOString(),
        endsAt: new Date(form.endsAt).toISOString(),
      });
      toast.success("Coordinator assigned!");
      setShowForm(false);
      setForm({ userId: "", eventId: "", startsAt: "", endsAt: "" });
      fetchAssignments();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const deactivate = async (assignmentId: string) => {
    try {
      await api.patch(`/admin/coordinators/${assignmentId}/deactivate`);
      toast.success("Assignment deactivated");
      fetchAssignments();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed";
      toast.error(msg);
    }
  };

  if (loading) return <LoadingState />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-black text-white font-mono tracking-widest uppercase flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" /> Coordinators ({assignments.length})
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-black text-xs font-bold font-mono tracking-widest uppercase hover:bg-primary-light transition-colors"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? "CANCEL" : "ASSIGN"}
        </button>
      </div>

      {showForm && (
        <motion.form
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          onSubmit={handleAssign}
          className="p-6 bg-surface border border-primary/30 mb-8 space-y-4"
        >
          <h3 className="text-xs font-bold text-primary font-mono tracking-widest uppercase flex items-center gap-2">
            <Terminal className="w-4 h-4" /> Assign Coordinator
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField label="User ID *" value={form.userId} onChange={(v) => setForm({ ...form, userId: v })} required />
            <InputField label="Event ID *" value={form.eventId} onChange={(v) => setForm({ ...form, eventId: v })} required />
            <InputField label="Starts At *" value={form.startsAt} onChange={(v) => setForm({ ...form, startsAt: v })} type="datetime-local" required />
            <InputField label="Ends At *" value={form.endsAt} onChange={(v) => setForm({ ...form, endsAt: v })} type="datetime-local" required />
          </div>
          <button
            type="submit"
            disabled={saving || !form.userId || !form.eventId || !form.startsAt || !form.endsAt}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-black text-xs font-bold font-mono tracking-widest uppercase hover:bg-primary-light transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            ASSIGN
          </button>
        </motion.form>
      )}

      <div className="space-y-3">
        {assignments.map((a) => (
          <div key={a.id} className="p-5 bg-surface border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-white uppercase tracking-wider">
                {(a as unknown as { user?: { fullName: string } }).user?.fullName ?? "User"}
              </p>
              <p className="text-[10px] font-mono text-text-muted mt-1 tracking-widest uppercase">
                Event: {a.event?.title ?? a.eventId}
              </p>
              <p className="text-[10px] font-mono text-text-dim mt-1 tracking-widest uppercase">
                {formatDate(a.startsAt)} → {formatDate(a.endsAt)}
              </p>
              <span className={cn(
                "inline-block mt-2 px-2 py-0.5 text-[10px] font-bold font-mono tracking-widest uppercase border",
                a.isActive ? "border-success/50 text-success bg-success/10" : "border-border text-text-muted bg-background"
              )}>
                {a.isActive ? "ACTIVE" : "INACTIVE"}
              </span>
            </div>
            {a.isActive && (
              <button
                onClick={() => deactivate(a.id)}
                className="px-3 py-1.5 text-[10px] font-bold font-mono uppercase tracking-widest border border-danger/50 text-danger bg-danger/10 hover:bg-danger/20 transition-colors shrink-0"
              >
                <XCircle className="w-3 h-3 inline mr-1" />Deactivate
              </button>
            )}
          </div>
        ))}
        {assignments.length === 0 && <EmptyState label="No coordinator assignments" />}
      </div>
    </div>
  );
}

/* ========================= SHARED COMPONENTS ========================= */
function InputField({ label, value, onChange, type = "text", required = false }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-[10px] font-bold text-text-muted font-mono tracking-widest uppercase mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full px-4 py-2.5 bg-background border border-border text-text text-sm font-mono placeholder:text-text-dim focus:outline-none focus:border-primary transition-colors"
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: string[];
}) {
  return (
    <div>
      <label className="block text-[10px] font-bold text-text-muted font-mono tracking-widest uppercase mb-1">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-2.5 bg-background border border-border text-text text-sm font-mono focus:outline-none focus:border-primary transition-colors appearance-none cursor-pointer"
        >
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim pointer-events-none" />
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="py-16 border border-dashed border-border text-center">
      <p className="text-xs font-mono text-text-muted tracking-widest uppercase">{label}</p>
    </div>
  );
}
