import AnimatedSection from './AnimatedSection'

const STATS = [
  { num: '0', label: 'Data sent to servers' },
  { num: '100%', label: 'Local storage' },
  { num: 'BYO', label: 'Bring your own LLM' },
  { num: 'LaTeX', label: 'Native formatting' },
]

export default function Stats() {
  return (
    <section className="py-20 bg-bg-2">
      <div className="max-w-[1120px] mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        {STATS.map((s, i) => (
          <AnimatedSection key={s.num} delay={i * 0.1}>
            <div className="glass rounded-2xl text-center py-8 px-5 transition-all hover:border-border-hover hover:-translate-y-1">
              <span className="block text-4xl font-black tracking-tight gradient-text">{s.num}</span>
              <span className="block text-[13px] text-text-muted mt-1.5 font-medium">{s.label}</span>
            </div>
          </AnimatedSection>
        ))}
      </div>
    </section>
  )
}
