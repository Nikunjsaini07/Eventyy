export type UserRole = "STUDENT" | "ADMIN";

export type UniversityBadgeStatus = "NONE" | "PENDING" | "VERIFIED" | "REJECTED";

export type EventType = "VISITING" | "PVP" | "RANKED";
export type ParticipationType = "SOLO" | "TEAM";
export type AudienceScope = "OPEN" | "UNIVERSITY_ONLY";
export type EventStatus = "DRAFT" | "PUBLISHED" | "CANCELLED" | "COMPLETED";
export type RegistrationStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "CHECKED_IN";
export type PaymentStatus = "NOT_REQUIRED" | "PENDING" | "PAID" | "FAILED" | "REFUNDED";
export type MatchStatus = "DRAFT" | "SCHEDULED" | "COMPLETED";

export interface User {
  id: string;
  email: string;
  phone?: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
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

export interface AuthUser {
  id: string;
  email: string;
  phone?: string;
  fullName: string;
  role: UserRole;
  effectiveRoles: string[];
  universityBadgeStatus: UniversityBadgeStatus;
  isUniversityVerified: boolean;
  coordinatorAssignments: CoordinatorAssignment[];
}

export interface CoordinatorAssignment {
  id: string;
  userId: string;
  eventId: string;
  assignedById: string;
  permissions?: string[];
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  event?: {
    id: string;
    title: string;
    slug: string;
  };
}

export interface Event {
  id: string;
  title: string;
  slug: string;
  description?: string;
  type: EventType;
  participationType: ParticipationType;
  audienceScope: AudienceScope;
  status: EventStatus;
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
  roundsEnabled: boolean;
  roundCount?: number;
  winnerCount?: number;
  metadata?: Record<string, unknown>;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: { id: string; fullName: string };
  coordinatorAssignments?: CoordinatorAssignment[];
  rounds?: EventRound[];
  registrations?: EventRegistration[];
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
  createdAt: string;
  event?: Event;
  user?: { id: string; fullName: string; email?: string; universityBadgeStatus?: UniversityBadgeStatus };
  team?: Team;
}

export interface Team {
  id: string;
  eventId: string;
  name: string;
  captainId: string;
  captain?: { id: string; fullName: string; email: string };
  members?: TeamMember[];
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: "CAPTAIN" | "MEMBER";
  user?: { id: string; fullName: string; email?: string };
}

export interface EventRound {
  id: string;
  eventId: string;
  roundNumber: number;
  name: string;
  isOptional: boolean;
}

export interface PvpMatch {
  id: string;
  eventId: string;
  roundId?: string;
  roundNumber: number;
  slotLabel?: string;
  participantARegistrationId?: string;
  participantBRegistrationId?: string;
  winnerRegistrationId?: string;
  nextMatchId?: string;
  nextMatchSlot?: number;
  status: MatchStatus;
  notes?: string;
  scheduledAt?: string;
  completedAt?: string;
  participantA?: EventRegistration;
  participantB?: EventRegistration;
  winner?: EventRegistration;
}

export interface LeaderboardEntry {
  id: string;
  eventId: string;
  registrationId: string;
  score: number;
  wins: number;
  losses: number;
  draws: number;
  position?: number;
  qualified: boolean;
  notes?: string;
  registration?: EventRegistration;
}

export interface EventResult {
  id: string;
  eventId: string;
  registrationId: string;
  rank: number;
  title?: string;
  isWinner: boolean;
  registration?: EventRegistration;
}

export interface UserProfile extends User {
  coordinatorAssignments: CoordinatorAssignment[];
  registrations: EventRegistration[];
}
