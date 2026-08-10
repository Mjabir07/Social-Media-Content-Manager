/**
 * Pure (no-database) service catalogue helpers — safe to import from client
 * components. Database CRUD lives in "@/lib/services", which re-exports these.
 */

export const PRICING_MODELS = ["FIXED", "HOURLY", "RETAINER", "PROJECT", "CUSTOM"] as const;
export type PricingModel = (typeof PRICING_MODELS)[number];

export const pricingModelLabels: Record<PricingModel, string> = {
  FIXED: "Fixed price",
  HOURLY: "Hourly rate",
  RETAINER: "Monthly retainer",
  PROJECT: "Per project",
  CUSTOM: "Custom / quote",
};

export function isPricingModel(value: unknown): value is PricingModel {
  return typeof value === "string" && (PRICING_MODELS as readonly string[]).includes(value);
}

// Format a stored price for display. null cents -> a custom-quote label.
export function formatServicePrice(priceCents: number | null | undefined, currency = "AED", unit?: string | null): string {
  if (priceCents === null || priceCents === undefined) return "Custom quote";
  const amount = (priceCents / 100).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  return `${currency} ${amount}${unit ? ` ${unit}` : ""}`;
}

export type ServiceInput = {
  name: string;
  category: string;
  description?: string | null;
  pricingModel: PricingModel;
  priceCents?: number | null;
  currency?: string;
  unit?: string | null;
  companyId?: string | null;
};

export type AgencyServiceDefinition = Omit<ServiceInput, "companyId" | "priceCents" | "currency"> & {
  workflowKey: string;
};

const service = (category: string, workflowKey: string, name: string, description: string, pricingModel: PricingModel = "CUSTOM", unit: string | null = null): AgencyServiceDefinition => ({
  category, workflowKey, name, description, pricingModel, unit,
});

/** Canonical sellable catalogue. Names are stable routing keys until Service gains a code column. */
export const AGENCY_SERVICE_CATALOGUE: AgencyServiceDefinition[] = [
  service("Digital Marketing & Branding", "digital-brand-foundation", "Brand Strategy & Positioning", "Brand discovery, audience, positioning, messaging and practical brand roadmap."),
  service("Digital Marketing & Branding", "digital-brand-identity", "Brand Identity Design", "Logo system, colours, typography, visual language and brand guidelines.", "PROJECT"),
  service("Digital Marketing & Branding", "digital-brand-refresh", "Brand Refresh & Rebranding", "Audit and modernization of an existing identity, messaging and customer touchpoints.", "PROJECT"),
  service("Digital Marketing & Branding", "digital-strategy", "Digital Marketing Strategy", "Research-led channel, campaign, content, measurement and budget plan.", "PROJECT"),
  service("Digital Marketing & Branding", "digital-smm-setup", "Social Media Page Setup & Optimization", "Create or optimize profiles, bios, branding, links, access and platform settings.", "PROJECT"),
  service("Digital Marketing & Branding", "digital-smm-management", "Social Media Management", "Strategy, calendar, content, publishing, engagement, reporting and continuous optimization.", "RETAINER", "per month"),
  service("Digital Marketing & Branding", "digital-content", "Content Strategy & Content Creation", "Content pillars, editorial planning, copy, articles and channel-ready content.", "RETAINER", "per month"),
  service("Digital Marketing & Branding", "digital-creative", "Social Media Poster & Creative Design", "On-brand posters, carousels, stories, covers and campaign creative.", "RETAINER", "per month"),
  service("Digital Marketing & Branding", "digital-video", "Short-form Video & Reels Production", "Concepts, scripts, editing, captions, covers and platform variants.", "RETAINER", "per month"),
  service("Digital Marketing & Branding", "digital-seo", "Search Engine Optimization (SEO)", "Technical, on-page, content and authority optimization with performance reporting.", "RETAINER", "per month"),
  service("Digital Marketing & Branding", "digital-local-seo", "Local SEO & Google Business Profile", "Profile setup/optimization, local visibility, listings, reviews and reporting.", "RETAINER", "per month"),
  service("Digital Marketing & Branding", "digital-paid-media", "Paid Advertising Management", "Campaign planning, setup, creative coordination, optimization and reporting for Google and social ads.", "RETAINER", "per month"),
  service("Digital Marketing & Branding", "digital-email-marketing", "Email Marketing Automation", "Lists, segmentation, templates, campaigns, journeys, deliverability and reporting.", "RETAINER", "per month"),
  service("Digital Marketing & Branding", "digital-whatsapp", "WhatsApp Marketing Automation", "Consent-aware campaigns, templates, lead routing and customer journeys using official APIs.", "PROJECT"),
  service("Digital Marketing & Branding", "digital-reputation", "Online Reputation & Review Management", "Review monitoring, response workflows, escalation and reputation reporting.", "RETAINER", "per month"),
  service("Digital Marketing & Branding", "digital-analytics", "Marketing Analytics & Performance Reporting", "Tracking plan, dashboards, attribution, insights and optimization recommendations.", "RETAINER", "per month"),

  service("Web & Application Development", "web-corporate", "Corporate Website Design & Development", "Responsive, conversion-focused business website with CMS, analytics and launch support.", "PROJECT"),
  service("Web & Application Development", "web-ecommerce", "E-commerce Website Development", "Online store, catalogue, payments, shipping, analytics and operational integrations.", "PROJECT"),
  service("Web & Application Development", "web-landing", "Landing Page & Sales Funnel Development", "Campaign landing pages, forms, tracking, CRM routing and conversion optimization.", "PROJECT"),
  service("Web & Application Development", "web-portal", "Customer Portal Development", "Secure self-service portal for customers, documents, requests, billing or service status.", "PROJECT"),
  service("Web & Application Development", "app-web", "Custom Web Application Development", "Purpose-built web software from requirements through deployment and support.", "PROJECT"),
  service("Web & Application Development", "app-mobile", "Mobile Application Development", "iOS/Android or cross-platform application design, build, QA and release.", "PROJECT"),
  service("Web & Application Development", "app-saas", "SaaS Product Development", "Multi-tenant SaaS architecture, product build, billing, operations and launch.", "PROJECT"),
  service("Web & Application Development", "web-api", "API & Third-party Integration Development", "Secure APIs and integrations connecting websites, apps and business systems.", "PROJECT"),
  service("Web & Application Development", "web-maintenance", "Website & Application Maintenance", "Updates, fixes, backups, monitoring, security and improvement support.", "RETAINER", "per month"),
  service("Web & Application Development", "web-performance", "Website Audit, Speed & Security Optimization", "Technical audit and remediation for performance, SEO readiness and security.", "PROJECT"),

  service("AI & Business Automation", "automation-discovery", "Automation Discovery & Process Audit", "Map processes, identify automation opportunities and produce a prioritized implementation roadmap.", "PROJECT"),
  service("AI & Business Automation", "automation-workflow", "Business Workflow Automation", "Automate repetitive operations across forms, CRM, email, files, approvals and reporting.", "PROJECT"),
  service("AI & Business Automation", "automation-agent", "Custom AI Agent Development", "Scoped AI agents for research, sales, operations, support or delivery with approvals and evidence.", "PROJECT"),
  service("AI & Business Automation", "automation-chatbot", "AI Chatbot & Customer Assistant", "Website or messaging assistant grounded in approved business knowledge and escalation rules.", "PROJECT"),
  service("AI & Business Automation", "automation-voice", "AI Voice Agent", "Inbound/outbound voice workflow for qualification, booking, service and follow-up.", "PROJECT"),
  service("AI & Business Automation", "automation-crm", "CRM Automation & Lead Routing", "Capture, enrichment, scoring, assignment, follow-up, pipeline and reporting automation.", "PROJECT"),
  service("AI & Business Automation", "automation-documents", "Document & Data Processing Automation", "Extraction, validation, approval and system entry for documents and structured data.", "PROJECT"),
  service("AI & Business Automation", "automation-integration", "System Integration (n8n, Make, Zapier)", "Reliable cross-application workflows with monitoring, retries and documentation.", "PROJECT"),
  service("AI & Business Automation", "automation-rpa", "Robotic Process Automation (RPA)", "Controlled browser/desktop automation where direct APIs are unavailable.", "PROJECT"),
  service("AI & Business Automation", "automation-support", "Automation Monitoring & Managed Support", "Health monitoring, incident response, updates and continuous workflow optimization.", "RETAINER", "per month"),

  service("Cloud, Hosting & Infrastructure", "cloud-web-hosting", "Managed Web Hosting", "Managed website hosting with SSL, backups, monitoring and support.", "RETAINER", "per year"),
  service("Cloud, Hosting & Infrastructure", "cloud-email-hosting", "Business Email Hosting", "Professional domain email provisioning, security, migration and support.", "RETAINER", "per user/year"),
  service("Cloud, Hosting & Infrastructure", "cloud-webmail", "Webmail Setup & Management", "Browser-based mail access, mailbox configuration, security and user support.", "PROJECT"),
  service("Cloud, Hosting & Infrastructure", "cloud-google", "Google Workspace Setup & Migration", "Tenant setup, domain verification, users, migration, security and handover.", "PROJECT"),
  service("Cloud, Hosting & Infrastructure", "cloud-microsoft", "Microsoft 365 Setup & Migration", "Microsoft tenant, Exchange, users, migration, security and handover.", "PROJECT"),
  service("Cloud, Hosting & Infrastructure", "cloud-vps", "VPS Server Provisioning & Management", "Secure VPS sizing, setup, hardening, monitoring, backup and maintenance.", "RETAINER", "per month"),
  service("Cloud, Hosting & Infrastructure", "cloud-server", "Cloud Server Architecture & Management", "Design and operation of scalable cloud compute, storage, networking and monitoring.", "RETAINER", "per month"),
  service("Cloud, Hosting & Infrastructure", "cloud-migration", "Cloud Migration", "Assessment, migration plan, execution, verification and rollback protection.", "PROJECT"),
  service("Cloud, Hosting & Infrastructure", "cloud-domain", "Domain Registration & Management", "Registration, DNS, ownership records, renewals and change control.", "RETAINER", "per year"),
  service("Cloud, Hosting & Infrastructure", "cloud-dns", "DNS, SSL & CDN Management", "DNS configuration, certificates, CDN, security controls and monitoring.", "RETAINER", "per year"),
  service("Cloud, Hosting & Infrastructure", "cloud-backup", "Cloud Backup & Disaster Recovery", "Backup policy, encrypted schedules, restore testing and recovery documentation.", "RETAINER", "per month"),
  service("Cloud, Hosting & Infrastructure", "cloud-devops", "DevOps & Deployment Automation", "CI/CD, environments, secrets, observability and controlled production releases.", "PROJECT"),

  service("Managed IT & Cybersecurity", "it-support", "Managed IT Support", "Ongoing user, device, software and operational support with documented service levels.", "RETAINER", "per month"),
  service("Managed IT & Cybersecurity", "it-helpdesk", "Remote Helpdesk Support", "Ticketed remote assistance, troubleshooting, escalation and service reporting.", "RETAINER", "per month"),
  service("Managed IT & Cybersecurity", "it-network", "Network Setup & Management", "Office network, Wi-Fi, firewall, segmentation, monitoring and documentation.", "PROJECT"),
  service("Managed IT & Cybersecurity", "it-security-audit", "Cybersecurity Assessment", "Risk, access, device, network, cloud and policy assessment with remediation plan.", "PROJECT"),
  service("Managed IT & Cybersecurity", "it-endpoint", "Endpoint Security & Device Management", "Device inventory, policies, patching, protection and compliance monitoring.", "RETAINER", "per device/month"),
  service("Managed IT & Cybersecurity", "it-identity", "Identity & Access Management", "User lifecycle, MFA, least privilege, access reviews and offboarding controls.", "PROJECT"),
  service("Managed IT & Cybersecurity", "it-monitoring", "Infrastructure Monitoring & Incident Response", "Availability, performance and security alerts with managed response workflows.", "RETAINER", "per month"),
  service("Managed IT & Cybersecurity", "it-consulting", "IT Strategy & Technology Consulting", "Technology roadmap, vendor evaluation, budgeting, governance and implementation guidance.", "CUSTOM"),

  service("Business Software & CRM", "business-crm", "CRM Setup & Customization", "Pipeline, contacts, permissions, fields, reporting and operational configuration.", "PROJECT"),
  service("Business Software & CRM", "business-crm-migration", "CRM Data Migration", "Clean, map, migrate, reconcile and validate CRM records with rollback planning.", "PROJECT"),
  service("Business Software & CRM", "business-erp", "ERP & Business System Integration", "Connect finance, inventory, sales, operations and reporting systems.", "PROJECT"),
  service("Business Software & CRM", "business-dashboard", "Business Intelligence Dashboard", "Source-backed KPI dashboard with definitions, validation and action-oriented views.", "PROJECT"),
  service("Business Software & CRM", "business-booking", "Booking & Appointment System", "Scheduling, availability, reminders, payments and CRM integration.", "PROJECT"),
  service("Business Software & CRM", "business-training", "Digital Systems Training & Handover", "Role-based training, documentation, adoption support and administrator handover.", "CUSTOM"),
];

export const AGENCY_SERVICE_CATEGORIES = Array.from(new Set(AGENCY_SERVICE_CATALOGUE.map((item) => item.category)));

export function getServiceDefinition(name: string) {
  return AGENCY_SERVICE_CATALOGUE.find((item) => item.name.toLocaleLowerCase() === name.trim().toLocaleLowerCase());
}
