import { prisma } from "../config/prisma";

type UpdateSiteContentInput = {
  collegeName?: string;
  campusName?: string;
  festivalName?: string;
  tagline?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  heroImageUrl?: string;
  aboutTitle?: string;
  aboutDescription?: string;
  contactEmail?: string;
  contactPhone?: string;
};

const defaultSiteContent = {
  id: "main",
  collegeName: "Shobhit University",
  campusName: "Gangoh",
  festivalName: "Shobhit Events",
  tagline: "Celebrate talent, culture, and campus energy in one place.",
  heroTitle: "Shobhit University Gangoh presents unforgettable campus events.",
  heroSubtitle:
    "Discover fest collections, explore featured competitions, and register as a solo participant or team.",
  heroImageUrl: undefined,
  aboutTitle: "About the platform",
  aboutDescription:
    "A single home for Shobhit University Gangoh event groups, registrations, university badge verification, and coordinator-driven participation approvals.",
  contactEmail: undefined,
  contactPhone: undefined
};

export const getSiteContent = async () =>
  prisma.siteContent.upsert({
    where: {
      id: "main"
    },
    update: {},
    create: defaultSiteContent
  });

export const updateSiteContent = async (input: UpdateSiteContentInput) =>
  prisma.siteContent.upsert({
    where: {
      id: "main"
    },
    update: {
      ...input
    },
    create: {
      ...defaultSiteContent,
      ...input
    }
  });
