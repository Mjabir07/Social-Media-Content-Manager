import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

type Step = { title: string; body: string; href?: string; hrefLabel?: string };
type Section = { eyebrow: string; title: string; intro: string; steps: Step[] };

// Static in-portal getting-started guide. Plain content so any team member can
// follow the workflow end to end without external docs.
const SECTIONS: Section[] = [
  {
    eyebrow: "Start here",
    title: "1 · Add the client",
    intro: "Every client begins as a company or a won lead. Pick whichever fits.",
    steps: [
      { title: "New social client", body: "Add the client under Clients, then open Social Media to onboard them into the SMM delivery agent.", href: "/azmin/clients", hrefLabel: "Open Clients" },
      { title: "From a sales lead", body: "Work the lead through the pipeline. When it reaches WON, a client, work order and invoice are created automatically — and an SMM service auto-onboards.", href: "/azmin/leads", hrefLabel: "Open Leads" },
    ],
  },
  {
    eyebrow: "Client profile",
    title: "2 · Fill the company profile and Brain",
    intro: "The AI writes on-brand content only when it knows the brand. Do this once per client.",
    steps: [
      { title: "Company overview", body: "Open the company, add industry, website and a full business description, then Save company. No field length limits — add as much as helps.", href: "/azmin/companies", hrefLabel: "Open Companies" },
      { title: "Brand profile + Company Brain", body: "Fill brand voice, audiences, offerings, content rules and AI instructions. Or paste the website and click 'Analyze website with AI' to draft it, then review and save." },
    ],
  },
  {
    eyebrow: "Delivery agent",
    title: "3 · Run the SMM onboarding",
    intro: "Open the client in Social Media. The delivery agent works as one window with tabs on the left.",
    steps: [
      { title: "Setup steps", body: "Follow the 10 steps. Step 4 uses a package dropdown (Essential / Growth / Professional / Elite) that fills a professional scope. Approve the plan to create tasks.", href: "/azmin/smm", hrefLabel: "Open Social Media" },
      { title: "Watch the next-step banner", body: "The blue 'Your next step' banner always shows the single most important action and jumps you to the right tab. Follow it until 100%." },
    ],
  },
  {
    eyebrow: "Content engine",
    title: "4 · Pillars → Automation → Content",
    intro: "This is the recurring delivery loop, all inside the client window.",
    steps: [
      { title: "Pillars", body: "In the Pillars tab, add the themes the agent writes from (e.g. Prevention tips, Offers, Testimonials). Pause or delete any." },
      { title: "Automation", body: "In the Automation tab, enable it and pick a mode: Draft only (you review), or Autonomous (auto-schedules). Press 'Run now' to generate immediately." },
      { title: "Content", body: "In the Content tab, edit captions, set a schedule, publish now, or delete — no need to leave the window." },
    ],
  },
  {
    eyebrow: "Go live",
    title: "5 · Connect a channel and reply",
    intro: "Content is drafted without any keys, but publishing to real profiles needs a connected channel.",
    steps: [
      { title: "Connect a channel", body: "Until a social channel is connected, publishing is safely simulated. Connect one in the setup steps to publish for real. Email works via SMTP once configured." },
      { title: "Inbox", body: "In the Inbox tab, the client's messages arrive with unread badges. Reply inline. Enable the AI auto-reply automation to answer inside the 24h window." },
    ],
  },
  {
    eyebrow: "Money",
    title: "6 · Quotes, invoices, renewals",
    intro: "The sales-to-cash side runs automatically from the pipeline.",
    steps: [
      { title: "Quotes", body: "Qualifying a lead drafts a quote; add line items and send a professional PDF.", href: "/azmin/quotes", hrefLabel: "Open Quotations" },
      { title: "Finance & renewals", body: "Winning a deal posts an invoice to Finance and sends it on connected channels. Renewals track recurring services.", href: "/azmin/finance", hrefLabel: "Open Finance" },
    ],
  },
];

export default async function GuidePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/azmin/guide");

  return <main data-azmin-ui className="min-h-screen bg-[#EAF1F9] text-[#03142E]">
    <header className="border-b border-[#C8D8EA] bg-white px-5 py-4 sm:px-8"><div className="mx-auto flex max-w-[1100px] items-center gap-3"><Link href="/azmin" className="grid h-10 w-10 place-items-center rounded-xl border border-[#C8D8EA] text-[#405E78]">←</Link><span className="relative h-10 w-10"><Image src="/brand/azmin-c1-mark.png" alt="AZMIN" fill priority sizes="40px" className="object-contain" /></span><div className="min-w-0"><strong className="block truncate font-display text-[15px]">How AZMIN works</strong><span className="block text-[10px] font-black uppercase tracking-[.15em] text-[#456784]">Step-by-step guide</span></div></div></header>

    <div className="mx-auto max-w-[1100px] px-5 py-8 sm:px-8">
      <section className="overflow-hidden rounded-[28px] bg-[#03142E] p-7 text-white sm:p-9">
        <p className="text-[11px] font-black uppercase tracking-[.16em] text-[#72E4F6]">Getting started</p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-[-.04em]">From new client to running delivery — in order.</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#AFC5D7]">Follow these six stages top to bottom. Inside each client, the blue &quot;Your next step&quot; banner always tells you the exact next action, so you never have to guess.</p>
      </section>

      <div className="mt-6 space-y-5">
        {SECTIONS.map((section) => <section key={section.title} className="rounded-2xl border border-[#C8D8EA] bg-white p-6 shadow-[0_8px_26px_rgba(3,20,46,.05)] sm:p-7">
          <p className="text-[10px] font-black uppercase tracking-[.15em] text-[#087CFA]">{section.eyebrow}</p>
          <h2 className="mt-1 font-display text-xl font-bold">{section.title}</h2>
          <p className="mt-1 text-sm text-[#4C6A86]">{section.intro}</p>
          <div className="mt-4 space-y-3">
            {section.steps.map((step, index) => <div key={step.title} className="flex gap-3 rounded-2xl border border-[#E1E9F2] bg-[#F8FBFE] p-4">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[#EAF4FF] text-xs font-black text-[#0758C9]">{index + 1}</span>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-[#03142E]">{step.title}</h3>
                <p className="mt-0.5 text-sm leading-6 text-[#4C6A86]">{step.body}</p>
                {step.href && <Link href={step.href} className="mt-1.5 inline-flex items-center gap-1 text-xs font-extrabold text-[#0758C9] hover:underline">{step.hrefLabel} →</Link>}
              </div>
            </div>)}
          </div>
        </section>)}
      </div>

      <p className="mt-6 rounded-2xl border border-[#B9E9FA] bg-[#ECFAFF] px-5 py-4 text-sm leading-6 text-[#17577A]"><strong>Tip:</strong> content generation and simulation work with zero setup. You only need external keys for real publishing (a connected social channel) and richer AI captions (a Gemini key). Everything else is ready now.</p>
    </div>
  </main>;
}
