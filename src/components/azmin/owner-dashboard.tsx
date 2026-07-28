import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { AzminProfileMenu } from "@/components/azmin/profile-menu";
import { CompanySwitcher, type SwitcherCompany } from "@/components/azmin/company-switcher";
import type { DashboardData } from "@/lib/data";

type Props = {
  user: { name: string; email: string; role: string };
  workspaceName: string;
  companies: SwitcherCompany[];
  activeCompany?: SwitcherCompany & {
    description?: string | null;
    brain?: { knowledgeStatus: string } | null;
  };
  data: DashboardData;
  from: string;
  to: string;
};

const statusMeta = {
  PENDING: { label: "Pending review", color: "#F4B942", href: "/azmin" },
  REWORK: { label: "Needs rework", color: "#FF746C", href: "/azmin" },
  APPROVED: { label: "Approved", color: "#22D3EE", href: "/azmin" },
  PUBLISHED: { label: "Published", color: "#6EA8FF", href: "/azmin" },
} as const;

export function AzminOwnerDashboard({ user, workspaceName, companies, activeCompany, data, from, to }: Props) {
  const totalActionable = data.statusCounts.PENDING + data.statusCounts.REWORK;
  const publishedRate = data.totalAssets
    ? Math.round((data.statusCounts.PUBLISHED / data.totalAssets) * 100)
    : 0;
  const firstName = user.name.split(" ")[0] || user.name;
  const activeCompanyName = activeCompany?.name ?? "AZMIN Digital";
  const isHeadquarters = activeCompany?.isHeadquarters ?? true;

  return (
    <div data-azmin-ui className="min-h-screen bg-[#F5F8FC] text-[#0A2233]">
      <div className="grid min-h-screen lg:grid-cols-[248px_minmax(0,1fr)]">
        <aside className="relative hidden overflow-hidden bg-[#03142E] text-white lg:flex lg:flex-col">
          <div className="pointer-events-none absolute -left-20 top-16 h-64 w-64 rounded-full bg-[#22D3EE]/10 blur-3xl" />
          <div className="relative flex h-full flex-col px-4 py-4">
            <Brand />

            <CompanySwitcher companies={companies} activeCompanyId={activeCompany?.id} />

            <nav className="mt-4 space-y-1" aria-label="AZMIN navigation">
              <NavItem icon="home" label="Command center" active />
              <NavItem icon="companies" label="Companies" badge="Live" href="/azmin/companies" />
              <NavItem icon="sales" label="Leads & sales" href="/azmin/leads" />
              <NavItem icon="companies" label="Partners" href="/azmin/partners" />
              <NavItem icon="projects" label="Projects" badge="Soon" />
              <NavItem icon="services" label="Services" href="/azmin/services" />
              <NavItem icon="spark" label="Automations" href="/azmin/automations" />
              <NavItem icon="finance" label="Finance" badge="Soon" />
            </nav>

            <div className="my-5 h-px bg-white/10" />
            <p className="px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#91AEC2]">Workspaces</p>
            <nav className="mt-2 space-y-1.5">
              <NavItem icon="marketing" label="Marketing studio" href="/azmin" />
              <NavItem icon="development" label="Development studio" badge="Soon" />
              <NavItem icon="infrastructure" label="Infrastructure" badge="Soon" />
              <NavItem icon="agents" label="AI agents" badge="Soon" />
              {user.role === "OWNER" && <NavItem icon="integrations" label="API Vault" href="/azmin/settings/integrations" badge="Secure" />}
            </nav>

            <div className="mt-auto rounded-2xl border border-white/10 bg-white/[0.045] p-3.5">
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#22D3EE] text-sm font-black text-[#03142E]">
                  A
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{user.name}</div>
                  <div className="truncate text-[11px] text-[#AFC9DD]">{roleLabel(user.role)} · Owner workspace</div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <main className="min-w-0">
          <header className="sticky top-0 z-20 border-b border-[#C8D8EA] bg-white/95 px-4 py-3 shadow-[0_1px_8px_rgba(3,20,46,.06)] backdrop-blur-xl sm:px-7 lg:px-9">
            <div className="mx-auto flex max-w-[1320px] items-center gap-3">
              <div className="lg:hidden"><Brand compact /></div>
              <div className="hidden lg:block">
                <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#0758C9]">AZMIN Digital OS</p>
                <p className="mt-0.5 text-sm font-bold text-[#234B70]">{activeCompanyName} command center</p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <details className="group relative hidden sm:block">
                  <summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl bg-[#087CFA] px-4 py-2.5 text-xs font-extrabold text-white shadow-[0_8px_22px_rgba(8,124,250,.22)] [&::-webkit-details-marker]:hidden">
                    <span className="text-base leading-none">+</span> Create
                  </summary>
                  <div className="absolute right-0 top-12 z-40 w-60 rounded-2xl border border-[#BFD1E3] bg-white p-2 shadow-[0_18px_45px_rgba(3,20,46,.16)]">
                    <Link href="/azmin/companies?create=1" className="block rounded-xl px-3 py-2.5 text-sm font-bold text-[#173A5C] hover:bg-[#EDF4FB]">New company</Link>
                    <div className="rounded-xl px-3 py-2 text-xs font-semibold leading-5 text-[#526F8A]">Projects, leads, and content actions will appear here as those modules go live.</div>
                  </div>
                </details>
                <button className="grid h-10 w-10 place-items-center rounded-xl border border-[#B8CCE0] bg-white text-[#234B70] shadow-sm transition hover:border-[#087CFA]" aria-label="Notifications">
                  <Glyph name="bell" />
                </button>
                <AzminProfileMenu name={user.name} email={user.email} role={user.role} />
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-[1320px] px-4 pb-14 pt-5 sm:px-7 lg:px-9 lg:pt-6">
            <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[.2em] text-[#3B668E]">
                  <span className="h-2 w-2 rounded-full bg-[#21C6DB] shadow-[0_0_0_5px_rgba(33,198,219,.11)]" />
                  {activeCompanyName} workspace
                </div>
                <h1 className="mt-2 font-display text-3xl font-extrabold tracking-[-.045em] text-[#061A33] sm:text-[34px]">
                  Good morning, {firstName}.
                </h1>
                <p className="mt-1.5 max-w-3xl text-sm font-medium text-[#526F8A]">
                  {isHeadquarters
                    ? "Here’s what needs your attention across the business today."
                    : `A protected company view for ${activeCompanyName}. AZMIN HQ content stays private.`}
                </p>
              </div>
              <div className="flex items-center rounded-xl border border-[#C5D6E6] bg-white p-1 shadow-sm">
                <Link href={"/azmin?from=" + to + "&to=" + to} className="rounded-lg px-3 py-2 text-xs font-extrabold text-[#526F8A] transition hover:bg-[#EAF4FF] hover:text-[#087DFA]">Today</Link>
                <Link href="/azmin" className="rounded-lg bg-[#EAF4FF] px-3 py-2 text-xs font-extrabold text-[#087DFA]">Last 30 days</Link>
                <Link href="/azmin/companies" className="rounded-lg px-3 py-2 text-xs font-extrabold text-[#526F8A] transition hover:bg-[#EAF4FF] hover:text-[#087DFA]">Companies</Link>
              </div>
            </section>

            {!isHeadquarters && (
              <div className="mt-5 flex flex-col gap-2 rounded-2xl border border-[#A8D9EE] bg-[#EAF9FF] px-4 py-3 text-sm text-[#174F72] sm:flex-row sm:items-center sm:justify-between">
                <span><strong>{activeCompanyName} context is active.</strong> Legacy AZMIN content is hidden until company-owned content is added.</span>
                <Link href={`/azmin/companies/${activeCompany?.id}`} className="shrink-0 font-extrabold text-[#0758C9] hover:underline">Edit company and AI context</Link>
              </div>
            )}

            <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Metric label="Total assets" value={data.totalAssets} helper="In the selected period" icon="assets" tone="navy" href="/azmin" />
              <Metric label="Needs attention" value={totalActionable} helper="Pending or in rework" icon="alert" tone="amber" href="/azmin" />
              <Metric label="Scheduled ahead" value={data.scheduledAhead} helper="Approved and ready" icon="calendar" tone="teal" href="/azmin" />
              <Metric label="Published rate" value={`${publishedRate}%`} helper={`${data.statusCounts.PUBLISHED} published items`} icon="trend" tone="blue" href="/azmin" />
            </section>

            <section className="mt-5 grid gap-5 xl:grid-cols-[1.4fr_0.8fr]">
              <div className="rounded-[16px] border border-[#C5D6E6] bg-white p-5 shadow-[0_16px_50px_rgba(7,27,43,0.06)] sm:p-6">
                <div className="flex flex-wrap items-center gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#45647F]">Operations pulse</p>
                    <h2 className="mt-1 font-display text-xl font-bold tracking-[-0.03em]">Content workflow</h2>
                  </div>
                  <form className="ml-auto flex items-center gap-2" method="get">
                    <input aria-label="From date" type="date" name="from" defaultValue={from} max={to} className="rounded-xl border border-[#C8D8EA] bg-[#F7FAFE] px-2.5 py-2 text-sm font-semibold text-[#294E6E]" />
                    <input aria-label="To date" type="date" name="to" defaultValue={to} min={from} className="rounded-xl border border-[#C8D8EA] bg-[#F7FAFE] px-2.5 py-2 text-sm font-semibold text-[#294E6E]" />
                    <button className="rounded-xl bg-[#087CFA] px-4 py-2 text-sm font-bold text-white">Apply</button>
                  </form>
                </div>

                <div className="mt-7 grid gap-5 lg:grid-cols-[170px_1fr] lg:items-center">
                  <Donut data={data} />
                  <div className="space-y-4">
                    {(Object.keys(statusMeta) as Array<keyof typeof statusMeta>).map((key) => {
                      const meta = statusMeta[key];
                      const value = data.statusCounts[key];
                      const width = data.totalAssets ? Math.max(3, (value / data.totalAssets) * 100) : 0;
                      return (
                        <Link key={key} href={meta.href} className="group block">
                          <div className="mb-1.5 flex items-center justify-between text-xs">
                            <span className="font-semibold text-[#385A78]">{meta.label}</span>
                            <span className="font-bold tabular-nums text-[#03142E]">{value}</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-[#EAF1F8]">
                            <div className="h-full rounded-full transition-all group-hover:brightness-90" style={{ width: `${width}%`, background: meta.color }} />
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="rounded-[24px] bg-gradient-to-br from-[#061B35] via-[#08294B] to-[#073660] p-5 text-white shadow-[0_20px_50px_rgba(7,27,43,0.18)] sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#9ECCE5]">AI briefing</p>
                    <h2 className="mt-1 font-display text-xl font-bold tracking-[-0.03em]">{activeCompanyName} focus</h2>
                  </div>
                  <span className="rounded-full bg-[#168BFF] px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-[#03142E]">Preview</span>
                </div>
                <div className="mt-5 space-y-3">
                  <BriefItem number="01" title={totalActionable ? `Review ${totalActionable} content item${totalActionable === 1 ? "" : "s"}` : "Content queue is clear"} detail={totalActionable ? "Pending and rework items are your highest priority." : "No content needs immediate review."} />
                  <BriefItem number="02" title={`${data.scheduledAhead} approved post${data.scheduledAhead === 1 ? "" : "s"} scheduled`} detail="Confirm final assets before their publishing date." />
                  <BriefItem
                    number="03"
                    title={activeCompany?.brain?.knowledgeStatus === "CONFIGURED" ? `${activeCompanyName} Company Brain is ready` : `Configure ${activeCompanyName} Company Brain`}
                    detail="The active company’s approved profile and private AI instructions control future agent work."
                  />
                </div>
                <div className="mt-5 rounded-2xl border border-white/15 bg-white/[0.07] p-3.5 text-xs leading-5 text-[#AFC1C9]">
                  AI recommendations are informative in this preview. External actions will always follow AZMIN approval rules.
                </div>
              </div>
            </section>

            <section className="mt-5 grid gap-5 lg:grid-cols-2">
              <Panel title="Upcoming schedule" eyebrow="Next actions" action={{ label: "Schedule module next", href: "/azmin" }}>
                {data.upcoming.length ? (
                  <div className="divide-y divide-[#E4ECF5]">
                    {data.upcoming.slice(0, 5).map((item, index) => (
                      <div key={`${item.id}-${index}`} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-sm font-black text-white" style={{ background: item.platformColor }}>{item.platformName.slice(0, 1)}</div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-semibold text-[#173A5C]">{item.title}</div>
                          <div className="mt-0.5 text-xs text-[#70869B]">{item.platformName}</div>
                        </div>
                        <time className="rounded-lg bg-[#E9F2FB] px-2.5 py-1.5 text-[11px] font-bold text-[#385A78]">{formatDate(item.date)}</time>
                      </div>
                    ))}
                  </div>
                ) : <Empty text="Nothing is scheduled yet." action="Add a post date from the content studio." />}
              </Panel>

              <Panel title="Channel footprint" eyebrow="Live workspace data" action={{ label: "Marketing module next", href: "/azmin" }}>
                {data.perPlatform.some((platform) => platform.total > 0) ? (
                  <div className="space-y-3.5">
                    {data.perPlatform.filter((platform) => platform.total > 0).slice(0, 6).map((platform) => {
                      const max = Math.max(1, ...data.perPlatform.map((item) => item.total));
                      return (
                        <div key={platform.id} className="grid grid-cols-[110px_1fr_30px] items-center gap-3">
                          <span className="truncate text-xs font-semibold text-[#385A78]">{platform.name}</span>
                          <div className="h-2 rounded-full bg-[#EAF1F8]"><div className="h-full rounded-full" style={{ width: `${Math.max(5, (platform.total / max) * 100)}%`, background: platform.color }} /></div>
                          <span className="text-right text-xs font-bold tabular-nums">{platform.total}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : <Empty text="No platform activity yet." action="Tag content with social channels to see the breakdown." />}
              </Panel>
            </section>

            <footer className="mt-8 flex flex-col gap-2 border-t border-[#C8D8EA] pt-5 text-[11px] text-[#72899E] sm:flex-row sm:items-center sm:justify-between">
              <span>AZMIN Digital OS · Phase 1 design preview</span>
              <span>Tenant: {workspaceName} · Active company: {activeCompanyName}</span>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className={`${compact ? "h-9 w-9" : "h-10 w-10"} relative shrink-0`}>
        <Image src="/brand/azmin-c1-mark.png" alt="AZMIN" fill priority sizes={compact ? "36px" : "40px"} className="object-contain" />
      </div>
      {!compact && (
        <div className="min-w-0">
          <div className="font-display text-[19px] font-extrabold leading-none tracking-[-0.03em] text-white">AZMIN</div>
          <div className="mt-1.5 text-[9px] font-bold uppercase tracking-[0.22em] text-[#72DFEF]">Digital OS</div>
        </div>
      )}
    </div>
  );
}

function NavItem({ icon, label, active, badge, href }: { icon: GlyphName; label: string; active?: boolean; badge?: string; href?: string }) {
  const content = <><Glyph name={icon} /><span>{label}</span>{badge && <span className="ml-auto rounded-full border border-white/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#AFC9DD]">{badge}</span>}</>;
  const cls = `flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${active ? "border border-[#1B5B91] bg-[#0A3767] font-extrabold text-white shadow-[0_8px_20px_rgba(3,20,46,0.2)]" : "text-[#D0E0EC] hover:bg-white/[0.08] hover:text-white"}`;
  return href ? <Link href={href} className={cls}>{content}</Link> : <div className={cls}>{content}</div>;
}

function Metric({ label, value, helper, icon, tone, href }: { label: string; value: string | number; helper: string; icon: GlyphName; tone: "navy" | "amber" | "teal" | "blue"; href: string }) {
  const tones = { navy: "bg-[#E7EEF0] text-[#03142E]", amber: "bg-[#FFF1D5] text-[#9A6711]", teal: "bg-[#DDF5FF] text-[#087CFA]", blue: "bg-[#E5EEFF] text-[#3564A7]" };
  return <Link href={href} className="group rounded-[15px] border border-[#C5D6E6] bg-white p-4 shadow-[0_12px_32px_rgba(3,20,46,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(7,27,43,0.08)]"><div className="flex items-start justify-between"><div className={`grid h-10 w-10 place-items-center rounded-xl ${tones[tone]}`}><Glyph name={icon} /></div><ArrowRight size={16} className="text-[#45647F] transition group-hover:translate-x-0.5 group-hover:text-[#03142E]" aria-hidden /></div><div className="mt-3 text-3xl font-black tracking-[-0.045em] tabular-nums text-[#03142E]">{value}</div><div className="mt-1 text-xs font-extrabold uppercase tracking-[0.08em] text-[#234B70]">{label}</div><div className="mt-1 text-xs font-medium text-[#45647F]">{helper}</div></Link>;
}

function Donut({ data }: { data: DashboardData }) {
  const values = [data.statusCounts.PENDING, data.statusCounts.REWORK, data.statusCounts.APPROVED, data.statusCounts.PUBLISHED];
  const colors = [statusMeta.PENDING.color, statusMeta.REWORK.color, statusMeta.APPROVED.color, statusMeta.PUBLISHED.color];
  const total = Math.max(1, values.reduce((sum, value) => sum + value, 0));
  let progress = 0;
  const stops = values.map((value, index) => { const start = progress; progress += (value / total) * 100; return `${colors[index]} ${start}% ${progress}%`; }).join(", ");
  return <div className="mx-auto grid h-36 w-36 place-items-center rounded-full" style={{ background: values.some(Boolean) ? `conic-gradient(${stops})` : "#EAF1F8" }}><div className="grid h-[104px] w-[104px] place-items-center rounded-full bg-white text-center shadow-[inset_0_0_0_1px_#E4ECF5]"><div><div className="text-3xl font-black tracking-[-0.05em] tabular-nums">{data.totalAssets}</div><div className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#526F8A]">Assets</div></div></div></div>;
}

function BriefItem({ number, title, detail }: { number: string; title: string; detail: string }) {
  return <div className="flex gap-3 rounded-2xl border border-white/15 bg-white/[0.07] p-3.5"><span className="text-[10px] font-black tracking-wider text-[#168BFF]">{number}</span><div><div className="text-sm font-semibold">{title}</div><div className="mt-1 text-xs leading-5 text-[#BDD1E0]">{detail}</div></div></div>;
}

function Panel({ title, eyebrow, action, children }: { title: string; eyebrow: string; action: { label: string; href: string }; children: React.ReactNode }) {
  return <section className="rounded-[16px] border border-[#C5D6E6] bg-white p-5 shadow-[0_12px_40px_rgba(7,27,43,0.045)] sm:p-6"><div className="mb-5 flex items-end justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#526F8A]">{eyebrow}</p><h2 className="mt-1 font-display text-lg font-bold tracking-[-0.03em]">{title}</h2></div><Link href={action.href} className="text-xs font-bold text-[#087CFA] hover:underline">{action.label} →</Link></div>{children}</section>;
}

function Empty({ text, action }: { text: string; action: string }) { return <div className="rounded-2xl border border-dashed border-[#CEDBE9] bg-[#F8FAFD] px-4 py-8 text-center"><div className="text-sm font-semibold text-[#385A78]">{text}</div><div className="mt-1 text-xs text-[#536F89]">{action}</div></div>; }
function roleLabel(role: string) { return role.charAt(0) + role.slice(1).toLowerCase(); }
function formatDate(value: string) { return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" }); }

type GlyphName = "integrations" | "home" | "companies" | "sales" | "projects" | "services" | "finance" | "marketing" | "development" | "infrastructure" | "agents" | "bell" | "spark" | "assets" | "alert" | "calendar" | "trend";
const paths: Record<GlyphName, string> = {
  integrations: "M8 12h8m-4-4v8M5 4h14v16H5z", home: "M3 10.5 12 3l9 7.5M5.5 9.5V21h13V9.5M9 21v-7h6v7", companies: "M4 21V7l8-4v18M12 9h8v12M7 10h2m-2 4h2m-2 4h2m8-5h1m-1 4h1", sales: "M4 18V8m0 10h16M7 14l3-3 3 2 5-6m0 0h-4m4 0v4", projects: "M4 6h6l2 2h8v11H4z", services: "M12 3v4m0 10v4M3 12h4m10 0h4M5.6 5.6l2.8 2.8m7.2 7.2 2.8 2.8m0-12.8-2.8 2.8m-7.2 7.2-2.8 2.8M15.5 12a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z", finance: "M4 7h16v12H4zM4 10h16M8 15h3", marketing: "M4 13V8l12-4v13L4 13Zm0 0 2 6h4l-2-5", development: "m8 9-4 3 4 3m8-6 4 3-4 3m-2-9-4 12", infrastructure: "M5 5h14v5H5zM5 14h14v5H5zM8 7.5h.01M8 16.5h.01", agents: "M12 3v3m-6 5H3m18 0h-3m-6 7v3M7 8h10v9H7zM10 12h.01M14 12h.01", bell: "M6 9a6 6 0 0 1 12 0c0 7 3 7 3 7H3s3 0 3-7m4 10h4", spark: "m12 3 1.2 4.2L17 9l-3.8 1.8L12 15l-1.2-4.2L7 9l3.8-1.8L12 3Z", assets: "M4 5h16v14H4zM4 15l4-4 4 4 3-3 5 5", alert: "M12 4 3 20h18L12 4Zm0 5v5m0 3h.01", calendar: "M5 5h14v15H5zM8 3v4m8-4v4M5 9h14", trend: "M4 17l5-5 4 3 7-8m0 0h-5m5 0v5",
};
function Glyph({ name }: { name: GlyphName }) { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={paths[name]} /></svg>; }

