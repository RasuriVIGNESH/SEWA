// SEWA style reminder: the shell is a calm clinical command surface—dense enough for operations, never noisy; coral is reserved for risk.

import { Link, useLocation } from "wouter";
import { Activity, Bell, ChevronRight, CircleUserRound, ClipboardList, LogOut, Menu, Network, Plus, Stethoscope, Users, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const links = [
  { href: "/dashboard", label: "Command center", icon: Activity },
  { href: "/patients", label: "Patient census", icon: Users },
  { href: "/alerts", label: "Alert queue", icon: Bell },
  { href: "/doctors", label: "Care team", icon: Stethoscope },
];

export function AppShell({ children, alertCount = 0, eyebrow = "SEWA / ICU OPERATIONS" }: { children: ReactNode; alertCount?: number; eyebrow?: string }) {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const { session, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-[#eef3f5] text-[#142536]">
      <aside className={cn("fixed inset-y-0 left-0 z-50 flex w-[276px] -translate-x-full flex-col bg-[#112b3f] px-5 py-6 text-white shadow-2xl transition-transform duration-200 lg:translate-x-0", open && "translate-x-0")}>
        <div className="flex items-center justify-between px-2">
          <Link href="/dashboard" className="flex items-center gap-3" onClick={() => setOpen(false)}>
            <div className="grid size-11 place-items-center rounded-2xl bg-[#1ec6b3] text-[#092132] shadow-[0_10px_30px_rgba(30,198,179,0.25)]"><Activity className="size-6" /></div>
            <div>
              <div className="font-display text-lg font-semibold tracking-tight">SEWA</div>
              <div className="text-[10px] uppercase tracking-[0.22em] text-white/55">Clinical signal</div>
            </div>
          </Link>
          <button className="rounded-lg p-2 text-white/60 hover:bg-white/10 lg:hidden" onClick={() => setOpen(false)} aria-label="Close navigation"><X className="size-5" /></button>
        </div>
        <div className="mt-10 px-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">{eyebrow}</div>
        <nav className="mt-3 space-y-1">
          {links.map(({ href, label, icon: Icon }) => {
            const active = location === href || (href !== "/dashboard" && location.startsWith(href));
            return <Link key={href} href={href} onClick={() => setOpen(false)} className={cn("group flex items-center justify-between rounded-2xl px-3 py-3 text-sm transition", active ? "bg-white/11 text-white shadow-inner" : "text-white/62 hover:bg-white/7 hover:text-white")}>
              <span className="flex items-center gap-3"><Icon className={cn("size-[18px]", active ? "text-[#67e0d2]" : "text-white/45")} />{label}</span>
              {label === "Alert queue" && alertCount > 0 && <Badge className="border-0 bg-[#ef806d] px-2 text-[10px] text-[#351b1a]">{alertCount}</Badge>}
            </Link>;
          })}
        </nav>
        <div className="mt-auto space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
            <div className="flex items-center gap-2 text-xs font-medium text-white/80"><Network className="size-4 text-[#67e0d2]" /> System status</div>
            <div className="mt-3 flex items-center justify-between text-xs"><span className="text-white/45">FHIR + Kafka pipeline</span><span className="flex items-center gap-1.5 text-[#8be9de]"><span className="size-1.5 rounded-full bg-[#36d2bd]" />Ready</span></div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 p-3">
            <div className="grid size-9 place-items-center rounded-xl bg-white/10 text-[#a3f1e8]"><CircleUserRound className="size-5" /></div>
            <div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold">{session?.name || "Clinician"}</div><div className="truncate text-[11px] text-white/45">{session?.email || "Signed-in care team"}</div></div>
            <button onClick={signOut} className="rounded-lg p-2 text-white/45 transition hover:bg-white/10 hover:text-white" aria-label="Sign out"><LogOut className="size-4" /></button>
          </div>
        </div>
      </aside>
      {open && <button className="fixed inset-0 z-40 bg-[#0c1d2b]/55 lg:hidden" onClick={() => setOpen(false)} aria-label="Close navigation overlay" />}
      <div className="lg:pl-[276px]">
        <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-[#dce6e8] bg-[#f5f8f8]/92 px-5 backdrop-blur-xl sm:px-8">
          <div className="flex items-center gap-3"><button onClick={() => setOpen(true)} className="rounded-xl p-2 text-[#365166] hover:bg-white lg:hidden" aria-label="Open navigation"><Menu className="size-5" /></button><div><div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#7b919a]">Wednesday · 16 August 2026</div><div className="mt-1 font-display text-base font-semibold text-[#19354a]">Ward 03 / Sepsis surveillance</div></div></div>
          <div className="flex items-center gap-2 sm:gap-3"><div className="hidden items-center gap-2 rounded-full border border-[#cbe7e2] bg-[#edfbf8] px-3 py-2 text-xs font-semibold text-[#168d80] sm:flex"><span className="size-1.5 rounded-full bg-[#1ec6b3]" />Live clinical channel</div><Link href="/patients/new"><Button size="sm" className="gap-2 rounded-xl bg-[#142f43] shadow-[0_8px_18px_rgba(20,47,67,0.16)] hover:bg-[#1b425a]"><Plus className="size-4" /><span className="hidden sm:inline">Admit patient</span></Button></Link></div>
        </header>
        <main className="mx-auto min-h-[calc(100vh-76px)] max-w-[1600px] px-5 py-6 sm:px-8 lg:px-10">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description?: string; action?: ReactNode }) {
  return <div className="mb-7 flex flex-col gap-5 border-b border-[#dce6e8] pb-6 sm:flex-row sm:items-end sm:justify-between"><div><div className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#159889]">{eyebrow}</div><h1 className="mt-2 font-display text-3xl font-semibold tracking-[-0.04em] text-[#142f43] sm:text-4xl">{title}</h1>{description && <p className="mt-2 max-w-2xl text-sm leading-6 text-[#70838e]">{description}</p>}</div>{action}</div>;
}

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return <div className="mb-5 flex items-center gap-1.5 text-xs text-[#8b9aa1]"><Link href="/dashboard" className="hover:text-[#158f81]">Command center</Link>{items.map((item) => <span key={item.label} className="flex items-center gap-1.5"><ChevronRight className="size-3" />{item.href ? <Link href={item.href} className="hover:text-[#158f81]">{item.label}</Link> : <span className="text-[#4c6572]">{item.label}</span>}</span>)}</div>;
}
