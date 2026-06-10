import { motion } from 'framer-motion'
import { CheckCircle, ChevronRight, Shield, Zap, Sun } from 'lucide-react'
import AnimatedSection from './AnimatedSection'

export default function Hero() {
  return (
    <section className="relative pt-40 pb-24 text-center overflow-hidden">
      {/* Glow orbs */}
      <div className="absolute -top-[300px] left-1/2 -translate-x-1/2 w-[900px] h-[700px] bg-[radial-gradient(ellipse,rgba(91,156,255,0.12)_0%,rgba(168,85,247,0.06)_35%,transparent_65%)] pointer-events-none" />
      <div className="absolute -top-[100px] -right-[200px] w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(236,72,153,0.06)_0%,transparent_60%)] pointer-events-none" />

      <div className="relative z-10 max-w-[1120px] mx-auto px-6">
        {/* Pills */}
        <AnimatedSection delay={0.05} direction="down">
          <div className="flex gap-2 justify-center mb-8 flex-wrap">
            <span className="px-4 py-1.5 rounded-full text-xs font-semibold bg-accent-glow text-accent">Chrome Extension</span>
            <span className="px-4 py-1.5 rounded-full text-xs font-semibold border border-border text-text-secondary">v1.0 — Free</span>
            <span className="px-4 py-1.5 rounded-full text-xs font-semibold bg-[rgba(74,222,128,0.1)] text-green">4.8 ★ Rating</span>
          </div>
        </AnimatedSection>

        {/* Headline */}
        <AnimatedSection delay={0.15}>
          <h1 className="text-[clamp(40px,7vw,72px)] font-black leading-[1.05] tracking-[-2px] mb-6">
            Tailor your resume to<br />
            <em className="gradient-text">any LinkedIn job</em><br />
            in seconds.
          </h1>
        </AnimatedSection>

        {/* Subheadline */}
        <AnimatedSection delay={0.25}>
          <p className="text-lg text-text-secondary max-w-[600px] mx-auto mb-10 leading-relaxed">
            Open a LinkedIn job, click Generate, and get a perfectly tailored LaTeX resume
            using your own LLM. <strong className="text-text-primary">Your data never leaves your machine.</strong>
          </p>
        </AnimatedSection>

        {/* CTAs */}
        <AnimatedSection delay={0.35}>
          <div className="flex gap-3.5 justify-center flex-wrap">
            <a href="#install" className="inline-flex items-center gap-2 px-9 py-4 rounded-full bg-accent text-white text-base font-semibold border border-accent shadow-[0_0_30px_rgba(91,156,255,0.25),0_0_60px_rgba(91,156,255,0.10)] hover:bg-accent-dark hover:shadow-[0_0_40px_rgba(91,156,255,0.35),0_0_80px_rgba(91,156,255,0.15)] transition-all hover:-translate-y-0.5">
              <CheckCircle size={20} /> Add to Chrome — Free <ChevronRight size={16} />
            </a>
            <a href="#how-it-works" className="inline-flex items-center gap-2 px-9 py-4 rounded-full text-base font-semibold border border-border bg-transparent text-text-primary hover:bg-surface-hover hover:border-border-hover transition-all hover:-translate-y-0.5">
              See how it works
            </a>
          </div>
        </AnimatedSection>

        {/* Trust */}
        <AnimatedSection delay={0.45}>
          <div className="flex gap-6 justify-center mt-9 flex-wrap">
            {[
              { icon: <Shield size={16} />, label: '100% Local Storage' },
              { icon: <Zap size={16} />, label: 'Real-time Streaming' },
              { icon: <Sun size={16} />, label: 'BYO LLM' },
            ].map((t) => (
              <div key={t.label} className="flex items-center gap-1.5 text-[13px] text-text-muted font-medium">
                <span className="text-accent">{t.icon}</span> {t.label}
              </div>
            ))}
          </div>
        </AnimatedSection>

        {/* Browser mockup */}
        <AnimatedSection delay={0.5} className="mt-[72px] relative max-w-[900px] mx-auto">
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.9, delay: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <div className="rounded-[18px] overflow-hidden border border-[rgba(255,255,255,0.08)] bg-bg-2 shadow-[0_25px_80px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.03)_inset,0_0_60px_rgba(91,156,255,0.06)]">
              <div className="flex items-center gap-3.5 px-5 py-3.5 bg-[rgba(255,255,255,0.03)] border-b border-[rgba(255,255,255,0.06)]">
                <div className="flex gap-[7px]">
                  <span className="w-[11px] h-[11px] rounded-full bg-[#ef6f6c]" />
                  <span className="w-[11px] h-[11px] rounded-full bg-[#f4a261]" />
                  <span className="w-[11px] h-[11px] rounded-full bg-[#4ade80]" />
                </div>
                <div className="flex-1 px-3.5 py-1.5 bg-[rgba(255,255,255,0.04)] rounded-lg text-xs text-text-muted">
                  chrome-extension://resume-tailor
                </div>
              </div>
              <img src="/screenshots/a.png" alt="Extension screenshot" className="w-full block" />
            </div>
          </motion.div>

          {/* Floating cards */}
          <div className="absolute top-[20%] -right-10 animate-float hidden lg:flex items-center gap-2.5 px-[18px] py-3.5 rounded-xl bg-[rgba(14,18,25,0.80)] backdrop-blur-xl border border-[rgba(255,255,255,0.08)] shadow-[0_8px_32px_rgba(0,0,0,0.4)] text-[13px] z-10">
            <span className="text-[22px]">⚡</span>
            <div><strong>Streaming</strong><br /><span className="text-text-muted text-[11px]">Real-time tokens</span></div>
          </div>
          <div className="absolute bottom-[25%] -left-10 animate-float-delayed hidden lg:flex items-center gap-2.5 px-[18px] py-3.5 rounded-xl bg-[rgba(14,18,25,0.80)] backdrop-blur-xl border border-[rgba(255,255,255,0.08)] shadow-[0_8px_32px_rgba(0,0,0,0.4)] text-[13px] z-10">
            <span className="text-[22px]">🛡️</span>
            <div><strong>Private</strong><br /><span className="text-text-muted text-[11px]">Local storage only</span></div>
          </div>
        </AnimatedSection>
      </div>

      {/* Wave divider */}
      <div className="absolute -bottom-px left-0 right-0 z-[1] leading-[0]">
        <svg viewBox="0 0 1440 120" preserveAspectRatio="none" className="w-full h-20">
          <path fill="var(--color-bg-2)" d="M0,64 C360,120 720,0 1080,64 C1260,96 1380,80 1440,64 L1440,120 L0,120 Z" />
        </svg>
      </div>
    </section>
  )
}
