/**
 * Preset SMM service packages. Selecting a package in the delivery-agent step
 * "Confirm service package and deliverables" auto-fills a professional,
 * structured scope of work so the owner never hand-types deliverables. The
 * rendered scope becomes the step's verification evidence and the record the
 * strategy step + agent read from. Pure module (no Prisma) so it is safe to
 * import into client components.
 */

export type SmmPackage = {
  id: string;
  name: string;
  tagline: string;
  priceHint: string; // indicative only — editable per client
  bestFor: string;
  platforms: string[]; // suggested channels for this tier
  monthlyPosts: number;
  monthlyReels: number;
  monthlyStories: number;
  deliverables: string[];
  responsibilities: string[];
  turnaround: string;
  reporting: string;
  exclusions: string[];
  primaryCta: string;
};

export const SMM_PACKAGES: SmmPackage[] = [
  {
    id: "ESSENTIAL",
    name: "Essential — Brand Presence",
    tagline: "Consistent, on-brand presence for a new or small business.",
    priceHint: "AED 1,500 / month",
    bestFor: "Startups and single-location businesses building first presence.",
    platforms: ["INSTAGRAM", "FACEBOOK"],
    monthlyPosts: 8,
    monthlyReels: 2,
    monthlyStories: 4,
    deliverables: [
      "8 static or carousel posts per month",
      "2 short-form Reels per month",
      "4 Story sets per month",
      "Monthly content calendar prepared in advance",
      "Basic page optimisation (bio, highlights, links)",
      "Captions, hashtags, and scheduling",
    ],
    responsibilities: [
      "Content strategy, calendar, and creative preparation by AZMIN",
      "Client provides approvals, brand assets, and genuine service footage where available",
    ],
    turnaround: "Monthly calendar delivered in advance; client approval before publishing.",
    reporting: "One performance summary per month.",
    exclusions: ["Paid ad spend", "Website / SEO", "Professional on-site videography", "Influencer marketing"],
    primaryCta: "Call / WhatsApp",
  },
  {
    id: "GROWTH",
    name: "Growth — Leads & Engagement",
    tagline: "Higher output plus lead-focused content and light engagement.",
    priceHint: "AED 3,000 / month",
    bestFor: "Established SMBs wanting steady enquiries and reach.",
    platforms: ["INSTAGRAM", "FACEBOOK", "GOOGLE_BUSINESS"],
    monthlyPosts: 12,
    monthlyReels: 4,
    monthlyStories: 8,
    deliverables: [
      "12 posts per month (mixed formats)",
      "4 short-form Reels per month",
      "8 Story sets per month",
      "Google Business profile posts and updates",
      "Monthly content calendar + theme planning",
      "Lead-focused CTAs and enquiry responses within business hours",
      "Monthly performance review",
    ],
    responsibilities: [
      "AZMIN handles strategy, content, scheduling, and reporting",
      "Client provides approvals, offers/pricing when approved, and timely responses to enquiries",
    ],
    turnaround: "Content calendar prepared in advance; urgent corrections by operational priority.",
    reporting: "Monthly report with reach, engagement, and enquiry summary.",
    exclusions: ["Paid ad budget (managed separately if approved)", "Website / SEO", "CRM implementation"],
    primaryCta: "Call / WhatsApp",
  },
  {
    id: "PROFESSIONAL",
    name: "Professional — Full Management",
    tagline: "Complete multi-platform management with campaigns and video.",
    priceHint: "AED 5,500 / month",
    bestFor: "Growing brands wanting full-service delivery across platforms.",
    platforms: ["INSTAGRAM", "FACEBOOK", "LINKEDIN", "GOOGLE_BUSINESS", "TIKTOK"],
    monthlyPosts: 20,
    monthlyReels: 8,
    monthlyStories: 12,
    deliverables: [
      "20 posts per month across selected platforms",
      "8 short-form Reels / video edits per month",
      "12 Story sets per month",
      "Monthly campaign concept + execution",
      "Full page optimisation and maintenance",
      "Community management within business hours",
      "Competitor and hashtag monitoring",
      "Detailed monthly performance report",
    ],
    responsibilities: [
      "AZMIN leads strategy, creative, campaigns, publishing, and reporting",
      "Client provides approvals, brand access, and product/service information",
    ],
    turnaround: "Calendar in advance; campaign assets on agreed schedule.",
    reporting: "Monthly report + one strategy review call.",
    exclusions: ["Paid ad budget", "Full website build", "Professional on-site shoot days (quoted separately)"],
    primaryCta: "Call / WhatsApp / Enquiry form",
  },
  {
    id: "ELITE",
    name: "Elite — Growth Partner",
    tagline: "Aggressive growth with paid-ready content and priority support.",
    priceHint: "AED 9,000 / month",
    bestFor: "Brands scaling fast and running paid campaigns.",
    platforms: ["INSTAGRAM", "FACEBOOK", "LINKEDIN", "YOUTUBE", "TIKTOK", "GOOGLE_BUSINESS"],
    monthlyPosts: 30,
    monthlyReels: 12,
    monthlyStories: 20,
    deliverables: [
      "30 posts per month across all selected platforms",
      "12 Reels / short videos per month",
      "20 Story sets per month",
      "2 lead-generation campaigns per month (creative + copy ready for ads)",
      "Advanced page and profile optimisation",
      "Priority community management and enquiry handling",
      "Monthly strategy call + mid-month check-in",
      "Full analytics dashboard and reporting",
    ],
    responsibilities: [
      "AZMIN owns end-to-end strategy, creative, campaigns, and optimisation",
      "Client provides approvals, ad budget when approved, and fast decision turnaround",
    ],
    turnaround: "Rolling calendar; priority corrections same business day.",
    reporting: "Bi-monthly reporting + monthly strategy call.",
    exclusions: ["Ad spend billed separately", "Website build", "Third-party licence/certification fees"],
    primaryCta: "Call / WhatsApp / Landing page",
  },
];

export function getSmmPackage(id: string | null | undefined): SmmPackage | null {
  return SMM_PACKAGES.find((pkg) => pkg.id === id) ?? null;
}

// Compose a professional, human-readable scope-of-work from a package. This is
// what lands as the step's evidence note and what the agent/strategy step read.
export function renderPackageScope(pkg: SmmPackage, companyName: string): string {
  const bullets = (items: string[]) => items.map((item) => `- ${item}`).join("\n");
  return [
    `${pkg.name} — Social Media Management for ${companyName}`,
    pkg.tagline,
    `Indicative price: ${pkg.priceHint} (confirm per client).`,
    "",
    `Monthly output: ${pkg.monthlyPosts} posts · ${pkg.monthlyReels} reels · ${pkg.monthlyStories} story sets.`,
    `Platforms: ${pkg.platforms.map((p) => p.replaceAll("_", " ")).join(", ")}.`,
    "",
    "Deliverables:",
    bullets(pkg.deliverables),
    "",
    "Responsibilities:",
    bullets(pkg.responsibilities),
    "",
    `Turnaround: ${pkg.turnaround}`,
    `Reporting: ${pkg.reporting}`,
    `Primary CTA: ${pkg.primaryCta}`,
    "",
    "Exclusions:",
    bullets(pkg.exclusions),
    "",
    "Status: package selected for confirmation. Not finally approved until management/client confirms.",
  ].join("\n");
}
