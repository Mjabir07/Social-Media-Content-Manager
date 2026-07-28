"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { useEffect, useRef, useState } from "react";

export function AzminProfileMenu({ name, email, role }: { name: string; email: string; role: string }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function close(event: MouseEvent) {
      if (root.current && !root.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex h-10 items-center gap-2 rounded-xl border border-[#B8CCE0] bg-white px-1.5 pr-2.5 text-left shadow-sm transition hover:border-[#087CFA]"
        aria-expanded={open}
        aria-label="Open profile menu"
      >
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#031A3B] text-xs font-black text-white">A</span>
        <span className="hidden xl:block">
          <span className="block max-w-28 truncate text-xs font-extrabold text-[#173A5C]">{name}</span>
          <span className="block text-[10px] font-bold uppercase tracking-wider text-[#5E7891]">{roleLabel(role)}</span>
        </span>
        <svg className="hidden text-[#5E7891] xl:block" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="m7 10 5 5 5-5" /></svg>
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-72 overflow-hidden rounded-2xl border border-[#BFD1E3] bg-white shadow-[0_18px_50px_rgba(3,20,46,.18)]">
          <div className="border-b border-[#DCE7F2] bg-[#F6F9FD] p-4">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#031A3B] text-sm font-black text-white">A</span>
              <span className="min-w-0">
                <strong className="block truncate text-sm text-[#03142E]">{name}</strong>
                <span className="block truncate text-xs text-[#536F89]">{email}</span>
              </span>
            </div>
          </div>
          <nav className="p-2 text-sm font-bold text-[#294E6E]">
            <Link href="/account" onClick={() => setOpen(false)} className="flex items-center justify-between rounded-xl px-3 py-2.5 hover:bg-[#EDF4FB]">Account settings <span aria-hidden>-&gt;</span></Link>
            <Link href="/azmin/companies" onClick={() => setOpen(false)} className="flex items-center justify-between rounded-xl px-3 py-2.5 hover:bg-[#EDF4FB]">Company workspaces <span aria-hidden>-&gt;</span></Link>
            {role === "OWNER" && <Link href="/azmin/settings/integrations" onClick={() => setOpen(false)} className="flex items-center justify-between rounded-xl px-3 py-2.5 hover:bg-[#EDF4FB]">Integrations &amp; API Vault <span aria-hidden>-&gt;</span></Link>}
            <button onClick={() => signOut({ callbackUrl: "/login" })} className="mt-1 w-full rounded-xl px-3 py-2.5 text-left text-[#A12C2C] hover:bg-[#FFF0F0]">Sign out</button>
          </nav>
        </div>
      )}
    </div>
  );
}

function roleLabel(role: string) {
  return role.charAt(0) + role.slice(1).toLowerCase();
}
