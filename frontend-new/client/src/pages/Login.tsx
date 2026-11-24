// SEWA style reminder: the sign-in flow should be reassuring, uncluttered, and explicit about the clinical workspace being accessed.

import { FormEvent, useState } from "react";
import { Link, useLocation } from "wouter";
import { Activity, ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { apiErrorMessage } from "@/lib/api";

export default function Login() {
  const [, navigate] = useLocation();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault(); setError(""); setBusy(true);
    try { await signIn(email.trim(), password); navigate("/dashboard"); } catch (err) { setError(apiErrorMessage(err)); } finally { setBusy(false); }
  }

  return <AuthLayout title="Return to the ward view" description="Sign in to continue monitoring your assigned patients and review the latest clinical signals."><form onSubmit={submit} className="space-y-5"><Field label="Work email" icon={Mail}><Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="doctor@hospital.org" required autoComplete="email" /></Field><Field label="Password" icon={LockKeyhole}><div className="relative"><Input value={password} onChange={(e) => setPassword(e.target.value)} type={showPassword ? "text" : "password"} placeholder="Enter your password" required autoComplete="current-password" className="pr-11" /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#82959d] hover:text-[#1c5260]" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button></div></Field>{error && <div role="alert" className="rounded-xl border border-[#f1c7c1] bg-[#fff3f0] px-4 py-3 text-sm text-[#9d4f48]">{error}</div>}<Button type="submit" disabled={busy} className="h-12 w-full rounded-xl bg-[#14334a] text-sm font-semibold hover:bg-[#1e4c67]">{busy ? "Authenticating…" : "Open clinical workspace"}<ArrowRight className="ml-2 size-4" /></Button><p className="text-center text-sm text-[#7d9098]">New to SEWA? <Link href="/register" className="font-semibold text-[#158f81] hover:underline">Create an account</Link></p></form></AuthLayout>;
}

function Field({ label, icon: Icon, children }: { label: string; icon: typeof Mail; children: React.ReactNode }) { return <label className="block"><span className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#637b87]"><Icon className="size-3.5 text-[#159889]" />{label}</span>{children}</label>; }

function AuthLayout({ title, description, children }: { title: string; description: string; children: React.ReactNode }) { return <div className="grid min-h-screen bg-[#f3f7f7] lg:grid-cols-[.9fr_1.1fr]"><div className="relative hidden overflow-hidden bg-[#12334a] p-12 text-white lg:flex lg:flex-col lg:justify-between"><div className="absolute -right-24 -top-24 size-96 rounded-full bg-[#1ec6b3]/20 blur-3xl" /><Link href="/" className="relative flex items-center gap-3"><div className="grid size-11 place-items-center rounded-2xl bg-[#1ec6b3] text-[#092132]"><Activity className="size-6" /></div><div><div className="font-display text-lg font-semibold">SEWA</div><div className="text-[10px] uppercase tracking-[0.22em] text-white/50">Clinical signal</div></div></Link><div className="relative max-w-md"><div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#73e1d5]">Clinician workspace</div><h2 className="mt-5 font-display text-5xl font-semibold leading-[1.03] tracking-[-0.05em]">Signal before noise. Context before action.</h2><p className="mt-6 text-sm leading-7 text-white/55">SEWA is designed around the rhythm of care: observe, understand, coordinate, and follow through.</p></div><div className="relative flex items-center gap-3 text-xs text-white/55"><ShieldCheck className="size-4 text-[#67e0d3]" /> Built for clinician-led review</div></div><div className="flex items-center justify-center px-5 py-12 sm:px-10"><div className="w-full max-w-md"><Link href="/" className="mb-12 flex items-center gap-3 lg:hidden"><div className="grid size-10 place-items-center rounded-2xl bg-[#12334a] text-[#68e0d3]"><Activity className="size-5" /></div><span className="font-display text-lg font-bold">SEWA</span></Link><div className="mb-8"><div className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#159889]">Secure access</div><h1 className="mt-3 font-display text-3xl font-semibold tracking-[-0.04em] text-[#14334a]">{title}</h1><p className="mt-3 text-sm leading-6 text-[#78909a]">{description}</p></div>{children}</div></div></div>; }
