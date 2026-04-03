import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function timeAgo(date: string | Date) {
  const now = new Date();
  const d = new Date(date);
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return formatDate(date);
}

export function getEventTypeColor(type: string) {
  switch (type) {
    case "PVP":
      return "from-red-500/20 to-orange-500/20 text-orange-400 border-orange-500/30";
    case "RANKED":
      return "from-purple-500/20 to-blue-500/20 text-purple-400 border-purple-500/30";
    case "VISITING":
      return "from-green-500/20 to-emerald-500/20 text-emerald-400 border-emerald-500/30";
    default:
      return "from-gray-500/20 to-gray-400/20 text-gray-400 border-gray-500/30";
  }
}

export function getStatusColor(status: string) {
  switch (status) {
    case "PUBLISHED":
      return "text-success";
    case "DRAFT":
      return "text-warning";
    case "CANCELLED":
      return "text-danger";
    case "COMPLETED":
      return "text-secondary";
    default:
      return "text-text-muted";
  }
}
