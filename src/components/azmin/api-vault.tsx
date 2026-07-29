"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import type { ProviderId } from "@/lib/integrations/providers";

type ProviderMetadata = {
  provider: ProviderId;
  name: string;
  description: string;
  keyLabel: string;
  placeholder: string;
  credentialHint?: string;
  category: string;
  configured: boolean;
  maskedValue: string | null;
  status: string;
  lastTestedAt: string | null;
  lastTestStatus: string | null;
  lastTestMessage: string | null;
  updatedAt: string | null;
};

type EnvStatus = {
  encryptionKey: boolean;
  gemini: boolean;
  database: boolean;
  authSecret: boolean;
  authUrlSet: boolean;
  authUrlIsLocalhost: boolean;
  metaVerifyToken: boolean;
  metaAppSecret: boolean;
  cronSecret: boolean;
};

type VaultResponse = {
  vaultReady: boolean;
  env?: EnvStatus;
  providers: ProviderMetadata[];
};

export function ApiVault({
  user,
  workspaceName,
}: {
  user: { name: string; email: string };
  workspaceName: string;
}) {
  const [data, setData] = useState<VaultResponse | null>(null);
  const [editing, setEditing] = useState<ProviderMetadata | null>(null);
  const [secret, setSecret] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    const response = await fetch("/api/integrations", { cache: "no-store" });
    if (!response.ok) {
      setMessage("The API Vault could not be loaded.");
      return;
    }
    setData((await response.json()) as VaultResponse);
  }

  useEffect(() => {
    let cancelled = false;
    fetch("/api/integrations", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("load failed");
        return (await response.json()) as VaultResponse;
      })
      .then((payload) => { if (!cancelled) setData(payload); })
      .catch(() => { if (!cancelled) setMessage("The API Vault could not be loaded."); });
    return () => { cancelled = true; };
  }, []);

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!editing || !secret.trim()) return;
    setBusy(`save:${editing.provider}`);
    setMessage(null);
    const response = await fetch("/api/integrations", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider: editing.provider, secret }),
    });
    const payload = (await response.json().catch(() => ({}))) as {
      error?: string;
    };
    setSecret("");
    setBusy(null);
    if (!response.ok) {
      setMessage(payload.error ?? "The credential could not be saved.");
      return;
    }
    setEditing(null);
    setMessage(`${editing.name} credential saved securely.`);
    await load();
  }

  async function toggle(provider: ProviderMetadata) {
    const status = provider.status === "ACTIVE" ? "DISABLED" : "ACTIVE";
    setBusy(`toggle:${provider.provider}`);
    setMessage(null);
    const response = await fetch("/api/integrations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider: provider.provider, status }),
    });
    setBusy(null);
    if (!response.ok) {
      setMessage("The provider status could not be changed.");
      return;
    }
    setMessage(`${provider.name} is now ${status === "ACTIVE" ? "enabled" : "disabled"}.`);
    await load();
  }

  async function test(provider: ProviderMetadata) {
    setBusy(`test:${provider.provider}`);
    setMessage(null);
    const response = await fetch(
      `/api/integrations/${provider.provider}/test`,
      { method: "POST" },
    );
    const payload = (await response.json().catch(() => ({}))) as {
      message?: string;
      error?: string;
    };
    setBusy(null);
    setMessage(payload.message ?? payload.error ?? "Connection test finished.");
    await load();
  }

  const configured = data?.providers.filter((provider) => provider.configured).length ?? 0;
  const active = data?.providers.filter((provider) => provider.status === "ACTIVE").length ?? 0;

  return (
    <div data-azmin-ui className="min-h-screen bg-[#F5F6F8] text-[#0F172A]">
      <header className="border-b border-[#1E293B] bg-[#0B172A] shadow-[0_4px_18px_rgba(3,20,46,.18)] text-white">
        <div className="mx-auto flex max-w-[1240px] items-center gap-3 px-5 py-4 sm:px-8">
          <Image
            src="/brand/azmin-c1-mark.png"
            alt="AZMIN"
            width={40}
            height={40}
            className="h-10 w-10 shrink-0 object-contain"
            priority
          />
          <div>
            <p className="flex items-center gap-1.5 font-display text-lg font-extrabold leading-none tracking-[-.02em]"><span>AZMIN</span><span className="text-[#93C5FD]">Digital OS</span></p>
            <p className="mt-1 text-[11px] font-extrabold uppercase tracking-[.2em] text-[#BFDBFE]">Owner security</p>
          </div>
          <Link href="/azmin" className="ml-auto rounded-xl border border-white/35 bg-white/[0.05] px-4 py-2.5 text-sm font-extrabold text-white transition hover:bg-white/10">
            Back to command center
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[1240px] px-5 py-9 sm:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.17em] text-[#155EAA]">Settings / Integrations</p>
            <h1 className="mt-2 font-display text-[34px] font-extrabold leading-tight tracking-[-.04em] sm:text-[42px]">Integrations &amp; API Vault</h1>
            <p className="mt-3 max-w-3xl text-base font-medium leading-7 text-[#475569]">
              Manage AI, research, and automation providers for {workspaceName}. Saved secrets are encrypted server-side and never displayed again.
            </p>
          </div>
          <div className="rounded-2xl border border-[#CBD5E1] bg-white px-5 py-3.5 text-sm font-medium text-[#475569] shadow-[0_6px_18px_rgba(15,23,42,.05)]">
            Signed in as <strong className="text-[#1E3A5F]">{user.name}</strong>
            <span className="mx-2 text-[#94A3B8]" aria-hidden="true">&bull;</span>
            Owner only
          </div>
        </div>

        {!data?.vaultReady && (
          <section className="mt-6 rounded-2xl border border-[#F0C36A] bg-[#FFF7E5] p-5">
            <div className="flex gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#FFDF9B] text-[#754600]"><AlertTriangle size={18} aria-hidden /></span>
              <div>
                <h2 className="font-display text-base font-extrabold text-[#5E3B00]">Vault setup required</h2>
                <p className="mt-1 text-sm leading-6 text-[#765A27]">
                  Add a 32-byte base64 <code className="rounded bg-white/70 px-1.5 py-0.5 font-mono text-xs">AZMIN_CREDENTIAL_ENCRYPTION_KEY</code> to local and Vercel environment settings. This master key must stay outside the database; without it, provider keys cannot be saved or decrypted.
                </p>
              </div>
            </div>
          </section>
        )}

        <section className="mt-7 grid gap-4 sm:grid-cols-3">
          <Summary label="Supported providers" value={data?.providers.length ?? 8} />
          <Summary label="Credentials configured" value={configured} />
          <Summary label="Active connections" value={active} />
        </section>

        {data?.env && <EnvPanel env={data.env} />}

        {message && (
          <div role="status" className="mt-5 rounded-2xl border border-[#93C5FD] bg-[#EFF6FF] px-5 py-4 text-base font-bold text-[#1E3A5F] shadow-sm">
            {message}
          </div>
        )}

        <section className="mt-6 grid gap-5 lg:grid-cols-2">
          {(data?.providers ?? []).map((provider) => (
            <article key={provider.provider} className="rounded-[20px] border border-[#CBD5E1] bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,.055)]">
              <div className="flex items-start gap-4">
                <ProviderIcon provider={provider.provider} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-xl font-extrabold tracking-[-.025em]">{provider.name}</h2>
                    <Status provider={provider} />
                  </div>
                  <p className="mt-1.5 text-[15px] font-medium leading-6 text-[#3F4C5E]">{provider.description}</p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-[#D3DAE3] bg-[#F8FAFC] p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] font-extrabold uppercase tracking-[.14em] text-[#475569]">Stored credential</span>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#475569]">{provider.category}</span>
                </div>
                <div className="mt-2.5 font-mono text-[15px] font-extrabold tracking-wide text-[#172033]">
                  {provider.maskedValue ?? "Not configured"}
                </div>
                {provider.lastTestMessage && (
                  <p className="mt-2.5 text-sm font-semibold text-[#45647F]">
                    Last test: {provider.lastTestMessage}
                  </p>
                )}
              </div>

              <div className="mt-5 flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={() => { setSecret(""); setEditing(provider); setMessage(null); }}
                  disabled={!data?.vaultReady}
                  className="rounded-xl bg-[#0B63CE] min-h-11 px-5 py-2.5 text-sm font-extrabold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {provider.configured ? "Replace key" : "Add key"}
                </button>
                {provider.configured && (
                  <>
                    <button
                      type="button"
                      onClick={() => void test(provider)}
                      disabled={busy !== null || provider.status !== "ACTIVE"}
                      className="rounded-xl border border-[#C5CED8] bg-white min-h-11 px-5 py-2.5 text-sm font-extrabold text-[#1E3A5F] disabled:opacity-45"
                    >
                      {busy === `test:${provider.provider}` ? "Testing..." : "Test connection"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void toggle(provider)}
                      disabled={busy !== null}
                      className="rounded-xl min-h-11 px-4 py-2.5 text-sm font-extrabold text-[#475569] hover:bg-[#F1F3F6] disabled:opacity-45"
                    >
                      {provider.status === "ACTIVE" ? "Disable" : "Enable"}
                    </button>
                  </>
                )}
              </div>
            </article>
          ))}
        </section>

        {!data && (
          <div className="mt-8 rounded-2xl border border-[#D1D8E0] bg-white p-10 text-center text-sm font-semibold text-[#526F8A]">
            Loading secure provider metadata...</div>
        )}

        <section className="mt-6 rounded-[18px] bg-[#101C2E] p-5 text-white sm:p-6">
          <h2 className="font-display text-xl font-extrabold tracking-[-.025em]">Security rules built into this vault</h2>
          <div className="mt-4 grid gap-3 text-sm leading-6 text-[#D7E0EA] md:grid-cols-3">
            <p><strong className="block text-white">No reveal button</strong>Only a masked suffix returns to the browser.</p>
            <p><strong className="block text-white">Tenant isolation</strong>Every credential is bound cryptographically to this workspace and provider.</p>
            <p><strong className="block text-white">Safe lifecycle</strong>Replace, test, enable, or disable without exposing the saved value.</p>
          </div>
        </section>
      </main>

      {editing && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#021126]/65 p-4 backdrop-blur-sm">
          <form onSubmit={save} className="w-full max-w-lg rounded-[20px] border border-[#CBD5E1] bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-3">
              <ProviderIcon provider={editing.provider} />
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[.15em] text-[#155EAA]">Encrypted credential</p>
                <h2 className="mt-1 font-display text-xl font-extrabold">{editing.name}</h2>
              </div>
            </div>
            <label className="mt-6 block text-xs font-extrabold text-[#294E6E]">
              {editing.keyLabel}
              <input
                type="password"
                value={secret}
                onChange={(event) => setSecret(event.target.value)}
                placeholder={editing.placeholder}
                autoComplete="new-password"
                autoFocus
                required
                minLength={8}
                className="mt-2 w-full rounded-xl border border-[#C5CED8] bg-[#FAFBFC] px-4 py-3.5 font-mono text-sm text-[#061A33] outline-none transition focus:border-[#0B63CE] focus:ring-4 focus:ring-[#0B63CE]/10"
              />
            </label>
            {editing.credentialHint && (
              <p className="mt-2 rounded-xl border border-[#D5DBE3] bg-[#F7F8FA] px-3.5 py-3 text-xs font-semibold leading-5 text-[#294E6E]">
                {editing.credentialHint}
              </p>
            )}
            <p className="mt-3 text-xs leading-5 text-[#45647F]">
              After saving, this value is cleared from the form and cannot be viewed or copied from AZMIN.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => { setEditing(null); setSecret(""); }} className="rounded-xl px-4 py-2.5 text-sm font-bold text-[#526F8A] hover:bg-[#F1F3F6]">Cancel</button>
              <button disabled={busy !== null || secret.trim().length < 8} className="rounded-xl bg-[#0B63CE] px-5 py-2.5 text-sm font-extrabold text-white disabled:opacity-45">
                {busy === `save:${editing.provider}` ? "Encrypting..." : "Save securely"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function EnvPanel({ env }: { env: EnvStatus }) {
  const items = [
    { ok: env.encryptionKey, label: "Vault master key", hint: "AZMIN_CREDENTIAL_ENCRYPTION_KEY — encrypts every key you save here" },
    { ok: env.gemini, label: "Gemini AI key", hint: "GEMINI_API_KEY — powers AI captions and lead qualify (or add Gemini below)" },
    { ok: env.database, label: "Database", hint: "DATABASE_URL — your Neon connection" },
    { ok: env.authSecret, label: "Login secret", hint: "NEXTAUTH_SECRET — keeps sign-in sessions safe" },
    { ok: env.authUrlSet && !env.authUrlIsLocalhost, label: "App URL", hint: env.authUrlIsLocalhost ? "NEXTAUTH_URL still points to localhost — set it to your live Vercel URL" : "NEXTAUTH_URL — your public address" },
    { ok: env.metaVerifyToken, label: "Meta verify token", hint: "META_VERIFY_TOKEN — any secret word; paste the same one in the Meta webhook setup" },
    { ok: env.metaAppSecret, label: "Meta app secret", hint: "META_APP_SECRET — verifies incoming Meta webhooks are genuine" },
    { ok: env.cronSecret, label: "Cron secret", hint: "CRON_SECRET — protects the auto-publish scheduler; add the same value in Vercel Cron" },
  ];
  const missing = items.filter((i) => !i.ok).length;
  return (
    <section className="mt-6 rounded-2xl border border-[#CBD5E1] bg-white p-5 shadow-[0_6px_18px_rgba(15,23,42,.05)]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-lg font-extrabold">Hosting keys (set on Vercel)</h2>
        <span className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wider ${missing === 0 ? "bg-[#DDF8EF] text-[#086B52]" : "bg-[#FFF1D5] text-[#855A0D]"}`}>{missing === 0 ? "All set" : `${missing} to set`}</span>
      </div>
      <p className="mt-1 text-sm font-medium text-[#475569]">These live in Vercel → Settings → Environment Variables (redeploy after changing). Everything else below is stored right here in the vault — no redeploy.</p>
      <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
        {items.map((i) => (
          <div key={i.label} className={`flex items-start gap-2.5 rounded-xl border px-3 py-2.5 ${i.ok ? "border-[#BEE7D6] bg-[#F3FBF7]" : "border-[#F0C36A] bg-[#FFFBF0]"}`}>
            {i.ok ? <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-[#0E9F6E]" aria-hidden /> : <XCircle size={18} className="mt-0.5 shrink-0 text-[#D97706]" aria-hidden />}
            <div className="min-w-0">
              <div className="text-sm font-bold text-[#172033]">{i.label} <span className={i.ok ? "text-[#0E9F6E]" : "text-[#B45309]"}>· {i.ok ? "Set" : "Missing"}</span></div>
              <div className="mt-0.5 text-xs font-medium leading-5 text-[#475569]">{i.hint}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Summary({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-[#CBD5E1] bg-white p-5 shadow-[0_6px_18px_rgba(15,23,42,.05)]">
      <div className="text-3xl font-black tabular-nums text-[#03142E]">{value}</div>
      <div className="mt-1.5 text-xs font-extrabold uppercase tracking-[.08em] text-[#475569]">{label}</div>
    </div>
  );
}

function Status({ provider }: { provider: ProviderMetadata }) {
  const style =
    provider.status === "ACTIVE"
      ? "bg-[#DDF8EF] text-[#086B52]"
      : provider.status === "DISABLED"
        ? "bg-[#EEF1F5] text-[#526F8A]"
        : "bg-[#FFF1D5] text-[#855A0D]";
  const label =
    provider.status === "ACTIVE"
      ? "Active"
      : provider.status === "DISABLED"
        ? "Disabled"
        : "Setup needed";
  return <span className={`rounded-full border border-current/15 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider ${style}`}>{label}</span>;
}

function ProviderIcon({ provider }: { provider: ProviderId }) {
  const icons: Partial<Record<ProviderId, string>> = {
    GEMINI: "/providers/gemini.svg",
    GROQ: "/providers/groq.ico",
    CLOUDFLARE: "/providers/cloudflare.svg",
    OPENROUTER: "/providers/openrouter.svg",
    ANTHROPIC: "/providers/anthropic.svg",
    TAVILY: "/providers/tavily.ico",
    FIRECRAWL: "/providers/firecrawl.ico",
    APIFY: "/providers/apify.ico",
  };
  const icon = icons[provider];
  return (
    <span
      aria-hidden="true"
      className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-[#D4DAE2] bg-white text-sm font-black text-[#0758C9] shadow-[0_3px_10px_rgba(15,23,42,.07)]"
    >
      {icon ? (
        <span className="h-7 w-7 bg-contain bg-center bg-no-repeat" style={{ backgroundImage: `url(${icon})` }} />
      ) : (
        provider.slice(0, 2)
      )}
    </span>
  );
}
