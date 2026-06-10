import AnimatedSection from './AnimatedSection'

const STEPS = [
  { num: '1', title: 'Open a LinkedIn job', desc: 'Navigate to any job posting on LinkedIn. The extension auto-detects it and extracts the full job description — even for external-apply listings.' },
  { num: '2', title: 'Click Generate', desc: 'One click sends your base resume + the JD to your configured LLM. Watch tokens stream in real-time as your tailored resume takes shape.' },
  { num: '3', title: 'Download your PDF', desc: 'Preview the compiled PDF inline, edit the LaTeX if needed, and download. Your formatting is preserved exactly as you designed it.' },
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-28 bg-bg-2">
      <div className="max-w-[1120px] mx-auto px-6">
        <AnimatedSection className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full text-[13px] font-semibold bg-accent-glow text-accent mb-4">How It Works</span>
          <h2 className="text-[clamp(30px,4.5vw,48px)] font-extrabold leading-[1.12] tracking-tight">
            Three steps. <em className="gradient-text">One-page resume.</em>
          </h2>
        </AnimatedSection>

        <div className="max-w-[640px] mx-auto flex flex-col items-center">
          {STEPS.map((s, i) => (
            <div key={s.num} className="contents">
              {i > 0 && (
                <AnimatedSection delay={i * 0.1 + 0.05}>
                  <div className="w-0.5 h-8 rounded-full bg-gradient-to-b from-accent to-transparent" />
                </AnimatedSection>
              )}
              <AnimatedSection delay={i * 0.1} className="w-full">
                <div className="glass rounded-2xl p-7 flex gap-5 items-start transition-all duration-300 hover:border-[rgba(91,156,255,0.15)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.3)] hover:-translate-y-0.5">
                  <div className="shrink-0 w-[50px] h-[50px] rounded-[14px] bg-gradient-to-br from-accent via-purple-500 to-pink-500 text-white flex items-center justify-center text-[22px] font-black">
                    {s.num}
                  </div>
                  <div>
                    <h3 className="text-[17px] font-bold mb-1.5">{s.title}</h3>
                    <p className="text-sm text-text-secondary leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              </AnimatedSection>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
