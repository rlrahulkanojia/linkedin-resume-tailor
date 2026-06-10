import AnimatedSection from './AnimatedSection'

const ITEMS = [
  { src: '/screenshots/b.png', alt: 'Job detection', label: 'Job detection & extraction' },
  { src: '/screenshots/c.png', alt: 'LaTeX editor', label: 'Syntax-highlighted LaTeX editor' },
  { src: '/screenshots/d.png', alt: 'PDF preview', label: 'Live compiled PDF preview' },
  { src: '/screenshots/e.png', alt: 'Settings', label: 'BYO LLM settings' },
]

export default function Gallery() {
  return (
    <section id="gallery" className="py-28">
      <div className="max-w-[1120px] mx-auto px-6">
        <AnimatedSection className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full text-[13px] font-semibold bg-accent-glow text-accent mb-4">Gallery</span>
          <h2 className="text-[clamp(30px,4.5vw,48px)] font-extrabold leading-[1.12] tracking-tight">
            See it <em className="gradient-text">in action</em>
          </h2>
        </AnimatedSection>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ITEMS.map((item, i) => (
            <AnimatedSection key={item.alt} delay={i * 0.1}>
              <div className="glass rounded-2xl overflow-hidden transition-all duration-300 hover:border-[rgba(91,156,255,0.15)] hover:-translate-y-1.5 hover:shadow-[0_16px_48px_rgba(0,0,0,0.35)]">
                <img src={item.src} alt={item.alt} loading="lazy" className="w-full block" />
                <div className="px-5 py-4 text-[13px] text-text-secondary font-semibold">{item.label}</div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  )
}
