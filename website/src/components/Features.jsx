import AnimatedSection from './AnimatedSection'

const FEATURES = [
  { emoji: '📄', title: 'LaTeX-Native Pipeline', desc: 'Your base resume is LaTeX. The output is LaTeX. Same preamble, same packages, same formatting. Zero conversion loss.' },
  { emoji: '⚡', title: 'Streaming Generation', desc: 'Watch tokens stream into the editor in real-time. Cancel anytime with the abort button. 120-second timeout keeps things snappy.' },
  { emoji: '📊', title: 'Live PDF Preview', desc: 'The Rendered tab compiles your LaTeX via xelatex in the cloud and shows the PDF inline. Download with one click.' },
  { emoji: '🔍', title: 'Smart JD Extraction', desc: "Three-tier detection: LinkedIn's voyager API first, DOM heading fallback, then heuristic text block. Works on every job type." },
  { emoji: '🛡️', title: 'Your Data, Your Machine', desc: 'Resume, API key, and instructions live in chrome.storage.local. No backend, no analytics, no tracking whatsoever.' },
  { emoji: '🔧', title: 'Bring Your Own LLM', desc: 'Any OpenAI-compatible endpoint: OpenAI, Anthropic via OpenRouter, Blackbox, or self-hosted. You choose the model.' },
]

export default function Features() {
  return (
    <section id="features" className="py-28">
      <div className="max-w-[1120px] mx-auto px-6">
        <AnimatedSection className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full text-[13px] font-semibold bg-accent-glow text-accent mb-4">Features</span>
          <h2 className="text-[clamp(30px,4.5vw,48px)] font-extrabold leading-[1.12] tracking-tight mb-3.5">
            Everything you need.<br /><em className="gradient-text">Nothing you don't.</em>
          </h2>
          <p className="text-[17px] text-text-secondary max-w-[520px] mx-auto">A focused tool that does one thing exceptionally well.</p>
        </AnimatedSection>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <AnimatedSection key={f.title} delay={(i % 3) * 0.1}>
              <div className="glass rounded-2xl p-8 transition-all duration-300 relative overflow-hidden group hover:border-[rgba(91,156,255,0.15)] hover:-translate-y-1.5 hover:shadow-[0_16px_48px_rgba(0,0,0,0.3)] h-full">
                <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(91,156,255,0.15)_0%,rgba(168,85,247,0.08)_100%)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10">
                  <div className="w-[52px] h-[52px] rounded-[14px] bg-accent-glow flex items-center justify-center mb-5 text-2xl">{f.emoji}</div>
                  <h3 className="text-[17px] font-bold mb-2">{f.title}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{f.desc}</p>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  )
}
