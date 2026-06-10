import { motion } from 'framer-motion'
import { CheckCircle, ChevronRight } from 'lucide-react'
import AnimatedSection from './AnimatedSection'

export default function CTA() {
  return (
    <section id="install" className="relative py-28 text-center overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-[radial-gradient(ellipse,rgba(91,156,255,0.08)_0%,rgba(168,85,247,0.04)_40%,transparent_65%)] pointer-events-none" />
      <div className="relative z-10 max-w-[1120px] mx-auto px-6">
        <AnimatedSection>
          <h2 className="text-[clamp(30px,4.5vw,46px)] font-extrabold leading-[1.15] tracking-tight mb-4">
            Ready to stop rewriting<br />your resume <em className="gradient-text">from scratch?</em>
          </h2>
          <p className="text-[17px] text-text-secondary mb-8">
            Install the extension, paste your LaTeX resume, and tailor it to any job in seconds.
          </p>
          <a href="#" className="inline-flex items-center gap-2 px-9 py-4 rounded-full bg-accent text-white text-base font-semibold border border-accent shadow-[0_0_30px_rgba(91,156,255,0.25),0_0_60px_rgba(91,156,255,0.10)] hover:bg-accent-dark hover:shadow-[0_0_40px_rgba(91,156,255,0.35),0_0_80px_rgba(91,156,255,0.15)] transition-all hover:-translate-y-0.5">
            <CheckCircle size={20} /> Add to Chrome — Free <ChevronRight size={16} />
          </a>
          <p className="text-[13px] text-text-muted mt-5">Works with Chrome, Edge, Brave, and any Chromium browser.</p>
        </AnimatedSection>
      </div>
    </section>
  )
}
