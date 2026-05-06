import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import {
    ArrowRight, Activity, ShieldCheck, Zap, BarChart3,
    ChevronRight, Clock, AlertTriangle, HeartPulse, Users,
    Bell, TrendingUp, CheckCircle2, ArrowUpRight, Menu, X,
    Image as ImageIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';

/* ─── Fonts & Global Styles ─────────────────────────────────────────────── */
const GlobalStyles = () => (
    <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,600;12..96,700;12..96,800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap');

    *, *::before, *::after { box-sizing: border-box; }

    .sewa-root {
      font-family: 'DM Sans', system-ui, sans-serif;
      -webkit-font-smoothing: antialiased;
      background: #ffffff;
      color: #0B1829;
      overflow-x: hidden;
    }
    .sewa-display { font-family: 'Bricolage Grotesque', system-ui, sans-serif; }

    @keyframes pulseRing {
      0%   { transform: scale(0.8); opacity: 1; }
      100% { transform: scale(2.4); opacity: 0; }
    }
    @keyframes alertBlink {
      0%, 100% { opacity: 1; }
      50%       { opacity: 0.4; }
    }
    @keyframes floatCard {
      0%, 100% { transform: translateY(0px) rotate(-1.5deg); }
      50%       { transform: translateY(-8px) rotate(-1.5deg); }
    }
    @keyframes floatCard2 {
      0%, 100% { transform: translateY(0px) rotate(1deg); }
      50%       { transform: translateY(-6px) rotate(1deg); }
    }
    @keyframes shimmer {
      0%   { background-position: 0% center; }
      100% { background-position: 300% center; }
    }
    @keyframes scanLine {
      0%   { top: 0%; }
      100% { top: 105%; }
    }

    .pulse-ring-wrap { position: relative; width: 10px; height: 10px; flex-shrink: 0; }
    .pulse-ring-wrap::before,
    .pulse-ring-wrap::after {
      content: '';
      position: absolute; inset: 0; border-radius: 50%;
      background: #EF4444;
      animation: pulseRing 2s ease-out infinite;
    }
    .pulse-ring-wrap::after { animation-delay: 1s; }
    .pulse-ring-dot {
      position: absolute; inset: 0; border-radius: 50%;
      background: #EF4444; z-index: 1;
    }

    .alert-blink { animation: alertBlink 1.8s ease-in-out infinite; }
    .float-card-1 { animation: floatCard 4s ease-in-out infinite; }
    .float-card-2 { animation: floatCard2 5s ease-in-out 0.8s infinite; }

    .scan-line {
      position: absolute; left: 0; right: 0; height: 2px;
      background: linear-gradient(90deg, transparent, rgba(14,165,233,0.6), transparent);
      animation: scanLine 3.2s ease-in-out infinite;
      z-index: 5; pointer-events: none;
    }

    .photo-slot {
      background: linear-gradient(145deg, #e8edf5 0%, #f1f5fb 100%);
      border: 2px dashed #94a3b8;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      text-align: center; gap: 10px;
      position: relative; overflow: hidden;
    }
    .photo-slot::before {
      content: '';
      position: absolute; inset: 0;
      background: linear-gradient(135deg, rgba(14,165,233,0.05) 0%, rgba(11,24,41,0.04) 100%);
      pointer-events: none;
    }

    .sewa-card {
      transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1),
                  box-shadow 0.25s ease, border-color 0.25s ease;
    }
    .sewa-card:hover {
      transform: translateY(-6px);
      box-shadow: 0 24px 60px rgba(14,165,233,0.14), 0 8px 24px rgba(0,0,0,0.06);
      border-color: rgba(14,165,233,0.28) !important;
    }

    .sewa-cta-btn {
      background: linear-gradient(90deg, #0B1829, #0EA5E9, #0284C7, #0B1829);
      background-size: 300% auto;
      animation: shimmer 6s linear infinite;
      border: none; cursor: pointer;
      transition: transform 0.15s, box-shadow 0.15s;
      font-family: 'DM Sans', sans-serif;
    }
    .sewa-cta-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 16px 48px rgba(14,165,233,0.4);
    }

    .section-label {
      display: inline-flex; align-items: center; gap: 7px;
      font-size: 11px; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.14em;
      padding: 5px 14px; border-radius: 100px;
    }

    .noise-bg {
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
      background-size: 150px;
      pointer-events: none;
    }

    /* grid dot bg */
    .dot-grid {
      background-image: radial-gradient(circle, rgba(14,165,233,0.12) 1px, transparent 1px);
      background-size: 32px 32px;
    }

    /* responsive */
    @media (max-width: 900px) {
      .hero-grid    { grid-template-columns: 1fr !important; }
      .problem-grid { grid-template-columns: 1fr !important; }
      .feat-grid    { grid-template-columns: 1fr !important; }
      .steps-grid   { grid-template-columns: 1fr 1fr !important; }
      .footer-grid  { grid-template-columns: 1fr 1fr !important; }
      .quote-grid   { grid-template-columns: 1fr !important; }
      .hero-right   { display: none !important; }
    }
    @media (max-width: 600px) {
      .steps-grid  { grid-template-columns: 1fr !important; }
      .feat-cards  { grid-template-columns: 1fr !important; }
      .stat-grid   { grid-template-columns: 1fr 1fr !important; }
    }
  `}</style>
);

/* ─── Photo Placeholder ──────────────────────────────────────────────────── */
const PhotoSlot = ({ label, suggestion, style = {}, className = '' }) => (
    <div className={`photo-slot ${className}`} style={{ ...style }}>
        <div style={{ position: 'relative', zIndex: 1, padding: '20px 24px', maxWidth: 280 }}>
            <div style={{ width: 52, height: 52, background: 'rgba(14,165,233,0.12)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <ImageIcon style={{ width: 22, height: 22, color: '#0EA5E9' }} />
            </div>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>{label}</p>
            <p style={{ fontSize: 11, color: '#64748b', lineHeight: 1.6, fontStyle: 'italic' }}>
                📷 {suggestion}
            </p>
        </div>
    </div>
);

/* ─── Live Alert Card ───────────────────────────────────────────────────── */
const LiveAlertCard = ({ style = {}, className = '' }) => (
    <div className={className} style={{
        background: 'rgba(11,24,41,0.96)', backdropFilter: 'blur(20px)',
        border: '1px solid rgba(239,68,68,0.3)', borderRadius: 16,
        padding: '14px 18px', ...style
    }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div className="pulse-ring-wrap"><div className="pulse-ring-dot" /></div>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#EF4444', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Sepsis Alert</span>
            <span className="alert-blink" style={{ fontSize: 10, fontWeight: 700, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444', padding: '2px 8px', borderRadius: 20 }}>CRITICAL</span>
        </div>
        <p style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>Patient · ICU Bed 07</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {[['SOFA', '8', '#EF4444'], ['Temp', '39.4°C', '#F59E0B'], ['HR', '118bpm', '#F59E0B'], ['Risk', '91%', '#EF4444']].map(([l, v, c]) => (
                <div key={l} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 9, padding: '7px 10px' }}>
                    <div style={{ fontSize: 9, color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{l}</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: c, fontFamily: 'Bricolage Grotesque, sans-serif' }}>{v}</div>
                </div>
            ))}
        </div>
    </div>
);

/* ─── Trend Mini Card ───────────────────────────────────────────────────── */
const TrendCard = ({ style = {}, className = '' }) => (
    <div className={className} style={{ background: 'white', borderRadius: 14, padding: '14px 16px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', border: '1px solid #e2e8f0', ...style }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Risk · 6h</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#10B981', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '2px 8px', borderRadius: 20 }}>Improving</span>
        </div>
        <svg width="138" height="42" viewBox="0 0 138 42">
            <defs>
                <linearGradient id="lg" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#EF4444" />
                    <stop offset="55%" stopColor="#F59E0B" />
                    <stop offset="100%" stopColor="#10B981" />
                </linearGradient>
            </defs>
            <path d="M0,35 L22,29 L44,33 L66,19 L88,27 L110,12 L138,6" fill="none" stroke="url(#lg)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            {[[0, 35], [66, 19], [110, 12], [138, 6]].map(([x, y], i) => (
                <circle key={i} cx={x} cy={y} r="3" fill="white" stroke={i === 3 ? '#10B981' : '#F59E0B'} strokeWidth="2" />
            ))}
        </svg>
    </div>
);

/* ─── Animated Counter ───────────────────────────────────────────────────── */
const Counter = ({ target, suffix = '', duration = 2000 }) => {
    const [count, setCount] = useState(0);
    const ref = useRef(null);
    const inView = useInView(ref, { once: true });
    useEffect(() => {
        if (!inView) return;
        let n = 0;
        const step = target / (duration / 16);
        const t = setInterval(() => {
            n += step;
            if (n >= target) { setCount(target); clearInterval(t); }
            else setCount(Math.floor(n));
        }, 16);
        return () => clearInterval(t);
    }, [inView, target, duration]);
    return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
};

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
export default function LandingPage() {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const fn = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', fn);
        return () => window.removeEventListener('scroll', fn);
    }, []);

    const fadeUp = { initial: { opacity: 0, y: 28 }, animate: { opacity: 1, y: 0 } };

    /* ── Shared colors ── */
    const C = { navy: '#0B1829', blue: '#0EA5E9', red: '#EF4444', amber: '#F59E0B', green: '#10B981' };

    return (
        <div className="sewa-root">
            <GlobalStyles />

            {/* ─────────────── NAVBAR ─────────────────────────────────────────── */}
            <nav style={{
                position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
                background: scrolled ? 'rgba(255,255,255,0.97)' : 'transparent',
                backdropFilter: scrolled ? 'blur(20px)' : 'none',
                borderBottom: scrolled ? '1px solid #e2e8f0' : '1px solid transparent',
                transition: 'all 0.3s',
            }}>
                <div style={{ maxWidth: 1320, margin: '0 auto', padding: '0 28px', height: 72, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 38, height: 38, background: 'linear-gradient(135deg, #0B1829, #0EA5E9)', borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 18px rgba(14,165,233,0.3)' }}>
                            <HeartPulse style={{ width: 20, height: 20, color: '#fff' }} />
                        </div>
                        <span className="sewa-display" style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', color: C.navy }}>
                            SEWA<span style={{ color: C.blue }}>.</span>
                        </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 36 }}>
                        {[['#features', 'Features'], ['#workflow', 'How It Works'], ['#about', 'About']].map(([h, l]) => (
                            <a key={l} href={h} style={{ fontSize: 14, fontWeight: 600, color: '#475569', textDecoration: 'none', transition: 'color 0.15s' }}
                                onMouseEnter={e => e.target.style.color = C.blue}
                                onMouseLeave={e => e.target.style.color = '#475569'}>
                                {l}
                            </a>
                        ))}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Link to="/login" style={{ textDecoration: 'none' }}>
                            <button style={{ fontSize: 14, fontWeight: 600, color: '#475569', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 18px', borderRadius: 9, fontFamily: 'DM Sans, sans-serif', transition: 'all 0.15s' }}
                                onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = C.navy; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#475569'; }}>
                                Log in
                            </button>
                        </Link>
                        <Link to="/register" style={{ textDecoration: 'none' }}>
                            <button className="sewa-cta-btn" style={{ color: '#fff', fontSize: 14, fontWeight: 700, padding: '10px 22px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                                Get Started <ArrowRight style={{ width: 15, height: 15 }} />
                            </button>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* ─────────────── HERO ───────────────────────────────────────────── */}
            <section style={{ paddingTop: 100, background: '#fff', overflow: 'hidden', position: 'relative' }}>
                {/* Grid bg */}
                <div className="dot-grid" style={{ position: 'absolute', inset: 0, opacity: 0.5, pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', top: '0%', right: '-8%', width: '55%', height: '80%', background: 'radial-gradient(circle, rgba(14,165,233,0.07) 0%, transparent 65%)', pointerEvents: 'none' }} />

                <div style={{ maxWidth: 1320, margin: '0 auto', padding: '0 28px' }}>
                    <div className="hero-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 56, alignItems: 'center' }}>

                        {/* LEFT */}
                        <motion.div initial="initial" animate="animate" style={{ paddingTop: 40, paddingBottom: 100, position: 'relative', zIndex: 1 }}>
                            {/* Badge */}
                            <motion.div variants={fadeUp} transition={{ duration: 0.5 }} style={{ marginBottom: 28 }}>
                                <span className="section-label" style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.16)', color: C.red }}>
                                    <div className="pulse-ring-wrap"><div className="pulse-ring-dot" /></div>
                                    Clinical Protocol v2.0 · Live System
                                </span>
                            </motion.div>

                            <motion.h1 variants={fadeUp} transition={{ duration: 0.55, delay: 0.08 }} className="sewa-display"
                                style={{ fontSize: 'clamp(40px, 5vw, 68px)', fontWeight: 800, lineHeight: 1.04, letterSpacing: '-0.03em', color: C.navy, marginBottom: 22 }}>
                                Detect Sepsis<br />
                                <span style={{ position: 'relative', display: 'inline-block' }}>
                                    <span style={{ background: `linear-gradient(135deg, ${C.blue} 0%, #0284C7 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                                        Hours Earlier.
                                    </span>
                                    <svg style={{ position: 'absolute', bottom: -6, left: 0, width: '100%', height: 8 }} viewBox="0 0 200 8" preserveAspectRatio="none">
                                        <path d="M0,5 Q50,1 100,5 Q150,9 200,5" stroke={C.blue} strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.45" />
                                    </svg>
                                </span><br />
                                Save More Lives.
                            </motion.h1>

                            <motion.p variants={fadeUp} transition={{ duration: 0.55, delay: 0.18 }}
                                style={{ fontSize: 17, lineHeight: 1.8, color: '#64748b', maxWidth: 500, marginBottom: 38 }}>
                                SEWA's AI-powered early warning system analyzes real-time vitals and flags physiological deterioration — before sepsis becomes irreversible.
                            </motion.p>

                            <motion.div variants={fadeUp} transition={{ duration: 0.5, delay: 0.28 }} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 44 }}>
                                <Link to="/login" style={{ textDecoration: 'none' }}>
                                    <button className="sewa-cta-btn" style={{ color: '#fff', fontSize: 15, fontWeight: 700, padding: '14px 32px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                                        Access Dashboard <ArrowRight style={{ width: 17, height: 17 }} />
                                    </button>
                                </Link>
                                <Link to="/register" style={{ textDecoration: 'none' }}>
                                    <button style={{ fontSize: 15, fontWeight: 600, padding: '14px 28px', borderRadius: 12, border: '1.5px solid #e2e8f0', background: '#fff', color: C.navy, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, transition: 'all 0.18s', fontFamily: 'DM Sans, sans-serif' }}
                                        onMouseEnter={e => { e.currentTarget.style.borderColor = C.blue; e.currentTarget.style.background = 'rgba(14,165,233,0.04)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#fff'; }}>
                                        Register Institution <ChevronRight style={{ width: 16, height: 16 }} />
                                    </button>
                                </Link>
                            </motion.div>

                            <motion.div variants={fadeUp} transition={{ duration: 0.5, delay: 0.36 }} style={{ display: 'flex', gap: 22, flexWrap: 'wrap' }}>
                                {[
                                    [<ShieldCheck style={{ width: 14, height: 14 }} />, 'HIPAA Compliant'],
                                    [<CheckCircle2 style={{ width: 14, height: 14 }} />, 'CE & FDA Cleared'],
                                    [<Users style={{ width: 14, height: 14 }} />, '50+ ICU Institutions'],
                                ].map(([icon, text], i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: '#64748b', fontWeight: 500 }}>
                                        <span style={{ color: C.blue }}>{icon}</span>{text}
                                    </div>
                                ))}
                            </motion.div>
                        </motion.div>

                        {/* RIGHT — visual area */}
                        <motion.div className="hero-right"
                            initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.2 }}
                            style={{ position: 'relative', height: 660, flexShrink: 0 }}
                        >
                            {/*
               ╔══════════════════════════════════════════════════════════════╗
               ║  PHOTO PLACEMENT 1 — MAIN HERO                              ║
               ║  Replace this PhotoSlot with an <img> tag                   ║
               ║  Recommended photo:                                          ║
               ║    • ICU doctor reviewing vitals monitor                     ║
               ║    • OR nurse attending to ICU patient                       ║
               ║    • Orientation: tall portrait (3:4 ratio)                  ║
               ║    • Lighting: clean, clinical, soft warm tone               ║
               ║  Search terms: "doctor ICU monitor patient vitals"           ║
               ║                "nurse intensive care hospital"               ║
               ╚══════════════════════════════════════════════════════════════╝
              */}
                            <PhotoSlot
                                label="PLACE PHOTO HERE — Hero Image"
                                suggestion="ICU doctor/nurse monitoring patient vitals — portrait orientation, clinical lighting&#10;Search: 'doctor ICU vitals monitor hospital'"
                                style={{ position: 'absolute', top: 30, left: 16, right: 0, bottom: 0, height: 560, borderRadius: 28, boxShadow: '0 28px 80px rgba(11,24,41,0.16)' }}
                            />
                            {/* Bottom gradient fade */}
                            <div style={{ position: 'absolute', bottom: 0, left: 16, right: 0, height: 180, background: 'linear-gradient(to top, #fff 10%, transparent)', borderRadius: '0 0 28px 28px', zIndex: 2 }} />

                            {/* Floating alert — top right */}
                            <LiveAlertCard
                                className="float-card-1"
                                style={{ position: 'absolute', top: 18, right: -28, zIndex: 10, width: 248, boxShadow: '0 16px 48px rgba(0,0,0,0.28)' }}
                            />
                            {/* Floating trend — bottom left */}
                            <TrendCard
                                className="float-card-2"
                                style={{ position: 'absolute', bottom: 44, left: -14, zIndex: 10, width: 210 }}
                            />
                            {/* Patients pill */}
                            <div style={{
                                position: 'absolute', bottom: 22, right: 12, zIndex: 10,
                                background: 'rgba(11,24,41,0.93)', backdropFilter: 'blur(16px)',
                                border: '1px solid rgba(255,255,255,0.1)', borderRadius: 30,
                                padding: '9px 16px', display: 'flex', alignItems: 'center', gap: 9,
                            }}>
                                <div style={{ display: 'flex' }}>
                                    {[C.blue, C.green, C.amber].map((c, i) => (
                                        <div key={i} style={{ width: 24, height: 24, borderRadius: '50%', background: c, border: '2px solid rgba(11,24,41,0.9)', marginLeft: i > 0 ? -6 : 0, boxShadow: `0 0 8px ${c}88` }} />
                                    ))}
                                </div>
                                <span style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0' }}>
                                    <span className="sewa-display" style={{ color: C.blue, fontWeight: 800 }}>2,840</span> patients live
                                </span>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ─────────────── STATS BAR ──────────────────────────────────────── */}
            <section style={{ background: C.navy, padding: '60px 28px', position: 'relative', overflow: 'hidden' }}>
                <div className="noise-bg" style={{ position: 'absolute', inset: 0 }} />
                <div style={{ maxWidth: 1320, margin: '0 auto', position: 'relative', zIndex: 1 }}>
                    <div style={{ textAlign: 'center', marginBottom: 44 }}>
                        <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.16em', color: C.blue, marginBottom: 8 }}>Global Sepsis Reality</p>
                        <h2 className="sewa-display" style={{ fontSize: 'clamp(24px, 3vw, 40px)', fontWeight: 800, color: '#fff', lineHeight: 1.1 }}>
                            Every second counts. Here's why.
                        </h2>
                    </div>
                    <div className="stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2, borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)' }}>
                        {[
                            { v: 49, s: 'M', label: 'Cases annually worldwide', sub: 'WHO Global Estimate', col: C.red },
                            { v: 11, s: 'M', label: 'Deaths every year', sub: '1 death every 3 seconds', col: C.amber },
                            { v: 7, s: 'hr', label: 'Average detection delay', sub: 'Without AI monitoring', col: '#94a3b8' },
                            { v: 79, s: '%', label: 'Mortality reduction', sub: 'With early detection', col: C.green },
                        ].map((s, i) => (
                            <motion.div key={i}
                                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.5 }}
                                style={{ padding: '36px 28px', background: 'rgba(255,255,255,0.025)', borderRight: i < 3 ? '1px solid rgba(255,255,255,0.06)' : 'none', textAlign: 'center' }}
                            >
                                <div className="sewa-display" style={{ fontSize: 'clamp(44px, 4vw, 66px)', fontWeight: 800, color: s.col, lineHeight: 1, marginBottom: 10 }}>
                                    <Counter target={s.v} suffix={s.s} />
                                </div>
                                <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', marginBottom: 5 }}>{s.label}</div>
                                <div style={{ fontSize: 12, color: '#334155', fontStyle: 'italic' }}>{s.sub}</div>
                            </motion.div>
                        ))}
                    </div>
                    <p style={{ textAlign: 'center', fontSize: 12, color: '#1e293b', marginTop: 16 }}>
                        Sources: WHO, Sepsis Alliance, The Lancet (2024)
                    </p>
                </div>
            </section>

            {/* ─────────────── THE PROBLEM ────────────────────────────────────── */}
            <section id="about" style={{ padding: '104px 28px', background: '#f8fafc' }}>
                <div style={{ maxWidth: 1320, margin: '0 auto' }}>
                    <div className="problem-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 72, alignItems: 'center' }}>

                        {/* Left: stacked photos */}
                        <motion.div initial={{ opacity: 0, x: -28 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}
                            style={{ position: 'relative', paddingBottom: 44 }}
                        >
                            {/*
               ╔══════════════════════════════════════════════════════════════╗
               ║  PHOTO PLACEMENT 2 — ICU WARD OVERVIEW                      ║
               ║  Replace PhotoSlot with <img>                                ║
               ║  Recommended photo:                                          ║
               ║    • Wide shot of ICU ward with monitoring equipment         ║
               ║    • Rows of beds + monitors, clinical environment           ║
               ║    • Aspect: 4:3 landscape                                   ║
               ║  Search: "ICU intensive care unit hospital ward monitors"    ║
               ╚══════════════════════════════════════════════════════════════╝
              */}
                            <PhotoSlot
                                label="PLACE PHOTO HERE — ICU Ward"
                                suggestion="Wide shot of ICU hospital ward with monitoring equipment&#10;Search: 'ICU ward hospital beds monitors critical care'"
                                style={{ width: '88%', aspectRatio: '4/3', borderRadius: 20, boxShadow: '0 20px 60px rgba(0,0,0,0.1)' }}
                            />
                            {/*
               ╔══════════════════════════════════════════════════════════════╗
               ║  PHOTO PLACEMENT 3 — BEDSIDE CLOSEUP                        ║
               ║  Replace PhotoSlot with <img>                                ║
               ║  Recommended photo:                                          ║
               ║    • Doctor/nurse at patient bedside examining chart/tablet  ║
               ║    • Close, intimate, warm clinical lighting                 ║
               ║    • Aspect: 4:3 landscape                                   ║
               ║  Search: "doctor bedside patient hospital chart tablet"      ║
               ╚══════════════════════════════════════════════════════════════╝
              */}
                            <PhotoSlot
                                label="PLACE PHOTO HERE — Bedside Care"
                                suggestion="Doctor/nurse at patient bedside, reviewing chart or tablet&#10;Search: 'doctor nurse bedside patient hospital chart'"
                                style={{ position: 'absolute', bottom: 0, right: -12, width: '52%', aspectRatio: '4/3', borderRadius: 16, border: '4px solid white', boxShadow: '0 12px 40px rgba(0,0,0,0.15)' }}
                            />
                            {/* Urgency pill */}
                            <div style={{ position: 'absolute', top: 20, right: '14%', background: C.red, borderRadius: 30, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 7, boxShadow: `0 8px 24px rgba(239,68,68,0.35)`, zIndex: 5 }}>
                                <Clock style={{ width: 13, height: 13, color: '#fff' }} />
                                <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>Every hour costs 7% survival</span>
                            </div>
                        </motion.div>

                        {/* Right: editorial text */}
                        <motion.div initial={{ opacity: 0, x: 28 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.15 }}>
                            <span className="section-label" style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.15)', color: C.red, marginBottom: 20, display: 'inline-flex' }}>
                                <AlertTriangle style={{ width: 11, height: 11 }} /> The Silent Emergency
                            </span>
                            <h2 className="sewa-display" style={{ fontSize: 'clamp(28px, 3.5vw, 50px)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.025em', color: C.navy, marginBottom: 22, marginTop: 16 }}>
                                Sepsis is the #1 cause<br />
                                <span style={{ color: C.red }}>of preventable ICU death</span> —<br />
                                yet it's consistently missed.
                            </h2>
                            <p style={{ fontSize: 16, lineHeight: 1.85, color: '#64748b', marginBottom: 22 }}>
                                In most ICUs, sepsis is identified only after a patient visibly deteriorates. By then, organ failure has already begun. Standard monitoring generates data — but no predictive intelligence.
                            </p>
                            <p style={{ fontSize: 16, lineHeight: 1.85, color: '#64748b', marginBottom: 36 }}>
                                <strong style={{ color: C.navy }}>SEWA changes that.</strong> By continuously analyzing 18+ physiological parameters against validated sepsis algorithms, SEWA flags at-risk patients 4–8 hours before clinical deterioration — giving care teams the window to act.
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {[
                                    ['Detects early sepsis 4–8 hours before conventional signs', C.red],
                                    ['Automated SOFA & qSOFA scoring updated every 15 minutes', C.amber],
                                    ['Real-time alerts escalated to attending physicians instantly', C.blue],
                                    ['Integrates with existing hospital EMR and monitoring systems', C.green],
                                ].map(([text, col], i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: col, marginTop: 9, flexShrink: 0 }} />
                                        <span style={{ fontSize: 14, fontWeight: 500, color: '#334155', lineHeight: 1.7 }}>{text}</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ─────────────── HOW IT WORKS ───────────────────────────────────── */}
            <section id="workflow" style={{ padding: '104px 28px', background: '#fff' }}>
                <div style={{ maxWidth: 1320, margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: 70 }}>
                        <span className="section-label" style={{ background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.15)', color: C.blue, marginBottom: 18, display: 'inline-flex' }}>
                            <Zap style={{ width: 11, height: 11 }} /> Clinical Workflow
                        </span>
                        <h2 className="sewa-display" style={{ fontSize: 'clamp(28px, 3.5vw, 52px)', fontWeight: 800, letterSpacing: '-0.025em', color: C.navy, marginTop: 14, marginBottom: 14 }}>
                            How SEWA works
                        </h2>
                        <p style={{ fontSize: 16, color: '#64748b', maxWidth: 480, margin: '0 auto', lineHeight: 1.75 }}>
                            From patient data to clinical intervention — in minutes, not hours.
                        </p>
                    </div>

                    <div className="steps-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 22, position: 'relative' }}>
                        {[
                            { n: '01', icon: <Activity style={{ width: 22, height: 22 }} />, title: 'Continuous Ingestion', desc: 'Vitals, labs, and waveform data stream in real-time from bedside monitors and EMR.', col: C.blue, bg: 'rgba(14,165,233,0.1)' },
                            { n: '02', icon: <BarChart3 style={{ width: 22, height: 22 }} />, title: 'AI Risk Scoring', desc: 'Validated sepsis algorithms score each patient every 15 minutes across 18+ parameters.', col: '#8B5CF6', bg: 'rgba(139,92,246,0.1)' },
                            { n: '03', icon: <Bell style={{ width: 22, height: 22 }} />, title: 'Smart Alerting', desc: 'Graded alerts — yellow advisory, red critical — delivered to the right clinician instantly.', col: C.amber, bg: 'rgba(245,158,11,0.1)' },
                            { n: '04', icon: <ShieldCheck style={{ width: 22, height: 22 }} />, title: 'Protocol Activation', desc: 'Sepsis-3 bundle checklists guide intervention and log compliance for full audit trails.', col: C.green, bg: 'rgba(16,185,129,0.1)' },
                        ].map((step, i) => (
                            <motion.div key={i}
                                initial={{ opacity: 0, y: 26 }} whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }} transition={{ delay: i * 0.12, duration: 0.55 }}
                                style={{ position: 'relative' }}
                            >
                                {i < 3 && (
                                    <div style={{ position: 'absolute', top: 27, left: 'calc(50% + 30px)', width: 'calc(100% - 22px)', height: 1, background: `linear-gradient(90deg, ${step.col}55, transparent)`, zIndex: 0 }} />
                                )}
                                <div className="sewa-card" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 22, padding: '28px 22px', position: 'relative', zIndex: 1 }}>
                                    <div style={{ position: 'absolute', top: 10, right: 16, fontSize: 64, fontWeight: 900, opacity: 0.035, color: step.col, fontFamily: 'Bricolage Grotesque, sans-serif', lineHeight: 1 }}>{step.n}</div>
                                    <div style={{ width: 54, height: 54, borderRadius: 16, background: step.bg, color: step.col, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                                        {step.icon}
                                    </div>
                                    <h3 className="sewa-display" style={{ fontSize: 17, fontWeight: 700, color: C.navy, marginBottom: 10 }}>{step.title}</h3>
                                    <p style={{ fontSize: 13, lineHeight: 1.72, color: '#64748b' }}>{step.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─────────────── FEATURES ───────────────────────────────────────── */}
            <section id="features" style={{ padding: '104px 28px', background: '#f8fafc' }}>
                <div style={{ maxWidth: 1320, margin: '0 auto' }}>
                    <div className="feat-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 64, alignItems: 'center' }}>
                        <div>
                            <span className="section-label" style={{ background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.15)', color: C.blue, marginBottom: 20, display: 'inline-flex' }}>
                                <HeartPulse style={{ width: 11, height: 11 }} /> Platform Features
                            </span>
                            <h2 className="sewa-display" style={{ fontSize: 'clamp(28px, 3vw, 50px)', fontWeight: 800, letterSpacing: '-0.025em', color: C.navy, lineHeight: 1.1, marginBottom: 20, marginTop: 14 }}>
                                Precision monitoring,<br />
                                <span style={{ color: C.blue }}>built for the ICU.</span>
                            </h2>
                            <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.82, marginBottom: 36 }}>
                                Every feature in SEWA is designed with intensivists, clinical informaticists, and bedside nurses — people who live in the ICU — to fit real workflows.
                            </p>
                            <Link to="/register" style={{ textDecoration: 'none' }}>
                                <button className="sewa-cta-btn" style={{ color: '#fff', fontSize: 15, fontWeight: 700, padding: '13px 28px', borderRadius: 12, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                                    Request a Demo <ArrowUpRight style={{ width: 17, height: 17 }} />
                                </button>
                            </Link>
                        </div>

                        <div className="feat-cards" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            {[
                                [<HeartPulse style={{ width: 19, height: 19 }} />, 'Real-Time Vitals', 'Continuous multi-parameter streaming from any bedside device or EMR.', C.red, 'rgba(239,68,68,0.09)'],
                                [<TrendingUp style={{ width: 19, height: 19 }} />, 'Trend Prediction', 'ML models identify deterioration patterns hours before they become critical.', C.blue, 'rgba(14,165,233,0.09)'],
                                [<Bell style={{ width: 19, height: 19 }} />, 'Graded Alerts', 'Risk-stratified notifications that reduce alarm fatigue while keeping clinicians informed.', C.amber, 'rgba(245,158,11,0.09)'],
                                [<ShieldCheck style={{ width: 19, height: 19 }} />, 'Audit Compliance', 'Full event logging, intervention tracking, and automated protocol checklists.', '#8B5CF6', 'rgba(139,92,246,0.09)'],
                                [<BarChart3 style={{ width: 19, height: 19 }} />, 'Unit Analytics', 'Outcomes dashboards with bundle compliance rates and response time metrics.', C.green, 'rgba(16,185,129,0.09)'],
                                [<Zap style={{ width: 19, height: 19 }} />, 'EMR Integration', 'HL7 FHIR-compatible. Deploys alongside Epic, Cerner, and others in hours.', '#0284C7', 'rgba(2,132,199,0.09)'],
                            ].map(([icon, title, desc, col, bg], i) => (
                                <motion.div key={i}
                                    initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }} transition={{ delay: i * 0.08, duration: 0.5 }}
                                    className="sewa-card"
                                    style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 18, padding: '22px 20px' }}
                                >
                                    <div style={{ width: 42, height: 42, borderRadius: 12, background: bg, color: col, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>{icon}</div>
                                    <h3 className="sewa-display" style={{ fontSize: 15, fontWeight: 700, color: C.navy, marginBottom: 7 }}>{title}</h3>
                                    <p style={{ fontSize: 12.5, color: '#64748b', lineHeight: 1.65 }}>{desc}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ─────────────── TESTIMONIAL ────────────────────────────────────── */}
            <section style={{ padding: '104px 28px', background: '#fff' }}>
                <div style={{ maxWidth: 1320, margin: '0 auto' }}>

                    <motion.div initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.65 }}
                        className="quote-grid"
                        style={{ background: C.navy, borderRadius: 28, overflow: 'hidden', display: 'grid', gridTemplateColumns: '1fr 1.7fr', marginBottom: 72, boxShadow: '0 32px 80px rgba(11,24,41,0.2)' }}
                    >
                        {/*
             ╔══════════════════════════════════════════════════════════════╗
             ║  PHOTO PLACEMENT 4 — DOCTOR TESTIMONIAL                     ║
             ║  Replace PhotoSlot with <img style={{objectFit:'cover'}}/>  ║
             ║  Recommended photo:                                          ║
             ║    • Professional portrait of doctor (half-body/face)        ║
             ║    • Confident, clinical setting or white background         ║
             ║    • Orientation: portrait                                   ║
             ║  Search: "Indian doctor hospital portrait professional"      ║
             ╚══════════════════════════════════════════════════════════════╝
            */}
                        <PhotoSlot
                            label="PLACE PHOTO HERE — Doctor Portrait"
                            suggestion="Professional portrait of doctor or intensivist&#10;Search: 'doctor hospital professional portrait confident'"
                            style={{ minHeight: 400, borderRadius: 0, border: 'none', background: 'linear-gradient(145deg, #132035, #0B1829)' }}
                        />

                        <div style={{ padding: '52px 52px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <div style={{ fontSize: 80, color: C.blue, lineHeight: 0.6, marginBottom: 28, fontFamily: 'Georgia, serif', opacity: 0.4 }}>"</div>
                            <p className="sewa-display" style={{ fontSize: 'clamp(17px, 1.8vw, 25px)', fontWeight: 600, color: '#f0f4ff', lineHeight: 1.55, marginBottom: 34, fontStyle: 'italic' }}>
                                Before SEWA, we were reacting to sepsis. Now we're anticipating it. The system flagged three patients last week that our team wouldn't have escalated for another four hours. One of them didn't make it the last time this happened.
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(14,165,233,0.15)', border: '2px solid rgba(14,165,233,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: C.blue, fontFamily: 'Bricolage Grotesque, sans-serif', fontWeight: 800 }}>DR</div>
                                <div>
                                    <div style={{ fontSize: 15, fontWeight: 700, color: '#f0f4ff' }}>Dr. Rajesh Menon, MD</div>
                                    <div style={{ fontSize: 13, color: '#475569' }}>Head of Intensive Care · Apollo Hospitals, Hyderabad</div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Institution trust */}
                    <div style={{ textAlign: 'center', marginBottom: 32 }}>
                        <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#94a3b8' }}>
                            Deployed across 50+ leading healthcare institutions
                        </p>
                    </div>
                    {/*
           ╔══════════════════════════════════════════════════════════════════╗
           ║  LOGO PLACEMENT — HOSPITAL/INSTITUTION LOGOS                    ║
           ║  Replace each placeholder div with an <img> of the logo        ║
           ║  Format: PNG/SVG with transparent background, ~180×56px each   ║
           ║  Institutions to consider: Apollo, AIIMS, Fortis, Manipal,     ║
           ║  Narayana Health, Aster DM, Medanta, KIMS, Rainbow             ║
           ╚══════════════════════════════════════════════════════════════════╝
          */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center', alignItems: 'center' }}>
                        {['Apollo Hospitals', 'AIIMS New Delhi', 'Fortis Healthcare', 'Manipal Hospitals', 'Narayana Health', 'Aster DM Healthcare'].map((name, i) => (
                            <div key={i} style={{ background: '#f8fafc', border: '1.5px dashed #cbd5e1', borderRadius: 12, padding: '13px 22px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'default' }}>
                                <ImageIcon style={{ width: 13, height: 13, color: '#94a3b8' }} />
                                <span style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8' }}>{name} Logo</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─────────────── CTA ────────────────────────────────────────────── */}
            <section style={{ position: 'relative', overflow: 'hidden', minHeight: 520 }}>
                {/*
         ╔═══════════════════════════════════════════════════════════════════╗
         ║  PHOTO PLACEMENT 5 — CTA BACKGROUND                             ║
         ║  Replace the inner div with:                                     ║
         ║  <img src="..." style={{position:'absolute',inset:0,           ║
         ║    width:'100%',height:'100%',objectFit:'cover',opacity:0.22}}/>║
         ║  Recommended photo:                                              ║
         ║    • Hospital exterior or aerial view at night/dusk              ║
         ║    • Modern hospital architecture, dramatic lighting             ║
         ║  Search: "modern hospital building exterior night India aerial"  ║
         ╚═══════════════════════════════════════════════════════════════════╝
        */}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #071018 0%, #0d2040 50%, #071018 100%)' }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(0deg, transparent, transparent 60px, rgba(14,165,233,0.025) 60px, rgba(14,165,233,0.025) 61px), repeating-linear-gradient(90deg, transparent, transparent 60px, rgba(14,165,233,0.025) 60px, rgba(14,165,233,0.025) 61px)' }} />
                </div>
                <div style={{ position: 'absolute', top: '-20%', right: '8%', width: '44%', height: '140%', background: `radial-gradient(circle, rgba(14,165,233,0.11) 0%, transparent 62%)`, zIndex: 1, pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', bottom: '-10%', left: '5%', width: '30%', height: '80%', background: `radial-gradient(circle, rgba(239,68,68,0.07) 0%, transparent 60%)`, zIndex: 1, pointerEvents: 'none' }} />

                <div style={{ position: 'relative', zIndex: 2, maxWidth: 900, margin: '0 auto', padding: '104px 28px', textAlign: 'center' }}>
                    <motion.div initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.65 }}>
                        <span className="section-label" style={{ background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.2)', color: C.blue, marginBottom: 24, display: 'inline-flex' }}>
                            <ShieldCheck style={{ width: 11, height: 11 }} /> Start protecting patients today
                        </span>
                        <h2 className="sewa-display" style={{ fontSize: 'clamp(34px, 5vw, 66px)', fontWeight: 800, letterSpacing: '-0.03em', color: '#fff', lineHeight: 1.04, marginBottom: 20, marginTop: 18 }}>
                            Advance your ICU's<br />
                            <span style={{ color: C.blue }}>sepsis survival rate.</span>
                        </h2>
                        <p style={{ fontSize: 17, color: '#64748b', lineHeight: 1.78, maxWidth: 540, margin: '0 auto 46px' }}>
                            Join 50+ leading healthcare institutions using SEWA to detect sepsis earlier, respond faster, and improve patient outcomes — starting in under a week.
                        </p>
                        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 42 }}>
                            <Link to="/register" style={{ textDecoration: 'none' }}>
                                <button className="sewa-cta-btn" style={{ color: '#fff', fontSize: 16, fontWeight: 700, padding: '16px 42px', borderRadius: 14, display: 'flex', alignItems: 'center', gap: 9 }}>
                                    Create Professional Account <ArrowRight style={{ width: 18, height: 18 }} />
                                </button>
                            </Link>
                            <Link to="/login" style={{ textDecoration: 'none' }}>
                                <button style={{ fontSize: 16, fontWeight: 600, padding: '16px 34px', borderRadius: 14, border: '1.5px solid rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.05)', color: '#e2e8f0', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', transition: 'all 0.18s' }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(14,165,233,0.5)'; e.currentTarget.style.background = 'rgba(14,165,233,0.1)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}>
                                    Log into Dashboard
                                </button>
                            </Link>
                        </div>
                        <div style={{ display: 'flex', gap: 28, justifyContent: 'center', flexWrap: 'wrap' }}>
                            {[[<ShieldCheck style={{ width: 13, height: 13 }} />, 'HIPAA Compliant'], [<CheckCircle2 style={{ width: 13, height: 13 }} />, 'CE & FDA Cleared'], [<Zap style={{ width: 13, height: 13 }} />, 'Deploy in < 1 week'], [<Users style={{ width: 13, height: 13 }} />, '24/7 Clinical Support']].map(([icon, text], i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: '#475569', fontWeight: 500 }}>
                                    <span style={{ color: C.blue }}>{icon}</span>{text}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ─────────────── FOOTER ─────────────────────────────────────────── */}
            <footer style={{ background: '#050d1a', borderTop: '1px solid rgba(255,255,255,0.05)', padding: '58px 28px 32px' }}>
                <div style={{ maxWidth: 1320, margin: '0 auto' }}>
                    <div className="footer-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 48, marginBottom: 52 }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                                <div style={{ width: 34, height: 34, background: 'linear-gradient(135deg, #0B1829, #0EA5E9)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <HeartPulse style={{ width: 17, height: 17, color: '#fff' }} />
                                </div>
                                <span className="sewa-display" style={{ fontSize: 19, fontWeight: 800, color: '#f0f4ff', letterSpacing: '-0.02em' }}>
                                    SEWA<span style={{ color: C.blue }}>.</span>
                                </span>
                            </div>
                            <p style={{ fontSize: 14, lineHeight: 1.8, color: '#334155', maxWidth: 300, marginBottom: 14 }}>
                                Sepsis Early Warning & Analysis — empowering clinicians with real-time AI intelligence to save more lives in critical care.
                            </p>
                            <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.green }}>
                                HIPAA · GDPR · ISO 13485
                            </p>
                        </div>
                        {['Product', 'Company', 'Legal'].map((cat, ci) => (
                            <div key={cat}>
                                <h4 className="sewa-display" style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#f0f4ff', marginBottom: 18 }}>{cat}</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                                    {[['Features', 'Integrations', 'Security', 'Changelog'], ['About', 'Clinical Team', 'Research', 'Careers'], ['Privacy', 'Terms', 'HIPAA', 'Contact']][ci].map(link => (
                                        <a key={link} href="#" style={{ fontSize: 14, color: '#334155', textDecoration: 'none', transition: 'color 0.15s' }}
                                            onMouseEnter={e => e.target.style.color = C.blue}
                                            onMouseLeave={e => e.target.style.color = '#334155'}>
                                            {link}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 26, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                        <span style={{ fontSize: 13, color: '#1e293b' }}>© {new Date().getFullYear()} SEWA Medical Technologies. All rights reserved.</span>
                        <div style={{ display: 'flex', gap: 20 }}>
                            {['Twitter', 'LinkedIn', 'ResearchGate'].map(l => (
                                <a key={l} href="#" style={{ fontSize: 13, fontWeight: 500, color: '#1e293b', textDecoration: 'none', transition: 'color 0.15s' }}
                                    onMouseEnter={e => e.target.style.color = C.blue}
                                    onMouseLeave={e => e.target.style.color = '#1e293b'}>
                                    {l}
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}