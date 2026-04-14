export type UserRole = "STUDENT" | "ADMIN";

export type UniversityBadgeStatus = "NONE" | "PENDING" | "VERIFIED" | "REJECTED";

export type ParticipationType = "SOLO" | "TEAM";
export type AudienceScope = "OPEN" | "UNIVERSITY_ONLY";
export type EventStatus = "DRAFT" | "PUBLISHED" | "CANCELLED" | "COMPLETED";
export type RegistrationStatus = "PENDING" | "CONFIRMED" | "REJECTED" | "CANCELLED" | "CHECKED_IN";
export type PaymentStatus = "NOT_REQUIRED" | "PENDING" | "PAID" | "FAILED" | "REFUNDED";

export interface User {
  id: string;
  email: string;
  phone?: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  isEmailVerified?: boolean;
  emailVerifiedAt?: string;
  universityName?: string;
  universityEmail?: string;
  universityStudentId?: string;
  department?: string;
  course?: string;
  year?: number;
  universityBadgeStatus: UniversityBadgeStatus;
  universityBadgeApprovedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EventGroupSummary {
  id: string;
  title: string;
  slug: string;
  subtitle?: string;
  description?: string;
  bannerImageUrl?: string;
  venue?: string;
  startsAt?: string;
  endsAt?: string;
  audienceScope: AudienceScope;
  status: EventStatus;
  metadata?: Record<string, unknown>;
  events?: Event[];
}

export interface CoordinatorAssignmentSummary {
  id: string;
  startsAt: string;
  endsAt: string;
  isActive?: boolean;
  event: {
    id: string;
    title: string;
    slug: string;
    bannerImageUrl?: string;
    status?: EventStatus;
    startsAt?: string;
    endsAt?: string;
    venue?: string;
    group?: EventGroupSummary;
    _count?: {
      registrations: number;
    };
  };
}

export interface AuthUser {
  id: string;
  email: string;
  phone?: string;
  fullName: string;
  role: UserRole;
  effectiveRoles: string[];
  isEmailVerified?: boolean;
  emailVerifiedAt?: string;
  universityBadgeStatus: UniversityBadgeStatus;
  isUniversityVerified: boolean;
  isCoordinator?: boolean;
  hasActiveRegistration?: boolean;
  activeRegistrationEventId?: string;
  coordinatorAssignments?: CoordinatorAssignmentSummary[];
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: "CAPTAIN" | "MEMBER";
  user?: { id: string; fullName: string; email?: string };
}

export interface Team {
  id: string;
  eventId: string;
  name: string;
  captainId: string;
  captain?: { id: string; fullName: string; email: string };
  members?: TeamMember[];
}

export interface Event {
  id: string;
  title: string;
  slug: string;
  description?: string;
  bannerImageUrl?: string;
  backgroundImageUrl?: string;
  participationType: ParticipationType;
  audienceScope: AudienceScope;
  status: EventStatus;
  requiresApproval?: boolean;
  requiresPayment: boolean;
  entryFee?: number;
  venue?: string;
  startsAt?: string;
  endsAt?: string;
  registrationOpensAt?: string;
  registrationClosesAt?: string;
  maxParticipants?: number;
  teamSizeMin?: number;
  teamSizeMax?: number;
  metadata?: Record<string, unknown>;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  group?: EventGroupSummary;
  createdBy?: { id: string; fullName: string; email?: string };
  registrations?: EventRegistration[];
  myRegistration?: EventRegistration | null;
  registrationCount?: number;
  canManageRegistrations?: boolean;
  coordinatorAssignments?: Array<{
    id: string;
    startsAt: string;
    endsAt: string;
    user: { id: string; fullName: string; email?: string; role?: UserRole };
  }>;
  _count?: {
    registrations: number;
  };
}

export interface EventRegistration {
  id: string;
  eventId: string;
  userId?: string;
  teamId?: string;
  status: RegistrationStatus;
  paymentStatus: PaymentStatus;
  amountDue?: number;
  checkedInAt?: string;
  reviewedAt?: string;
  reviewNote?: string;
  createdAt: string;
  event?: Event;
  user?: { id: string; fullName: string; email?: string; universityBadgeStatus?: UniversityBadgeStatus };
  team?: Team;
  reviewedBy?: { id: string; fullName: string; email?: string };
}

export interface ActivitySummary {
  totalRegistrations: number;
  pastEvents: number;
  totalCreatedEvents?: number;
  publishedCreatedEvents?: number;
  activeCoordinatorAssignments?: number;
}

export interface RegistrationActivities {
  upcoming: EventRegistration[];
  ongoingOrRecent: EventRegistration[];
  past: EventRegistration[];
}

export interface CoordinatorActivities {
  upcoming: CoordinatorAssignmentSummary[];
  active: CoordinatorAssignmentSummary[];
  past: CoordinatorAssignmentSummary[];
}

export interface BadgeHistoryEntry {
  id: string;
  status: UniversityBadgeStatus;
  notes?: string;
  createdAt: string;
  reviewer?: {
    id: string;
    fullName: string;
    email: string;
  };
}

export interface UserProfile extends User {
  registrations: EventRegistration[];
  createdEvents?: Event[];
  activitySummary?: ActivitySummary;
  activities?: {
    registrations: RegistrationActivities;
    createdEvents?: Event[];
    coordinatorAssignments?: CoordinatorActivities;
    badgeHistory: BadgeHistoryEntry[];
  };
}

export interface SiteContent {
  id: string;
  collegeName: string;
  campusName?: string;
  festivalName: string;
  tagline?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  heroImageUrl?: string;
  aboutTitle?: string;
  aboutDescription?: string;
  contactEmail?: string;
  contactPhone?: string;
}
