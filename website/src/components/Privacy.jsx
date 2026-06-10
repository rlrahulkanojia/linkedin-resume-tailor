import AnimatedSection from './AnimatedSection'

const BADGES = ['No Backend', 'No Analytics', 'No Tracking', 'Local Only']

export default function Privacy() {
  return (
    <section id="privacy" className="py-24 bg-bg-2">
      <div className="max-w-[1120px] mx-auto px-6">
        <AnimatedSection>
          <div className="glass rounded-3xl p-14 text-center max-w-[700px] mx-auto shadow-[0_12px_48px_rgba(0,0,0,0.3)] relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(91,156,255,0.06)_0%,transparent_60%)] pointer-events-none" />
            <div className="relative z-10">
              <div className="text-5xl mb-5">🛡️</div>
              <h2 className="text-[32px] font-extrabold mb-4 tracking-tight">
                Privacy first. <em className="gradient-text">Always.</em>
              </h2>
              <p className="text-[15px] text-text-secondary leading-relaxed max-w-[540px] mx-auto">
                Your resume, API key, and instructions are stored in <code className="text-xs bg-[rgba(255,255,255,0.06)] px-2 py-0.5 rounded">chrome.storage.local</code> — never sent to any server. The only network requests are to the LLM endpoint <em>you</em> configure and the LaTeX compiler for PDF preview. No analytics. No tracking. No backend. Period.
              </p>
              <div className="flex gap-2 justify-center mt-7 flex-wrap">
                {BADGES.map((b) => (
                  <span key={b} className="px-4 py-1.5 rounded-full text-xs font-semibold border border-border text-text-secondary">{b}</span>
                ))}
              </div>
              <a href="/privacy-policy" className="inline-block mt-6 text-sm text-accent hover:text-accent-dark transition-colors font-medium">
                Read full Privacy Policy →
              </a>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  )
}
