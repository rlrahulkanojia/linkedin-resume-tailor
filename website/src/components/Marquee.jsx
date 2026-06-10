const ITEMS = [
  'LaTeX-Native Pipeline', 'Voyager API Extraction', 'SSE Streaming',
  'Live PDF Preview', 'Syntax Highlighting', 'Generation History',
  'BYO LLM', 'Zero Analytics',
]

export default function Marquee() {
  const doubled = [...ITEMS, ...ITEMS]

  return (
    <section className="bg-bg-2 py-5 overflow-hidden border-b border-[rgba(255,255,255,0.04)]">
      <div className="overflow-hidden">
        <div className="flex items-center gap-7 whitespace-nowrap animate-marquee w-max">
          {doubled.map((item, i) => (
            <span key={i} className="contents">
              <span className="text-sm font-semibold text-text-secondary uppercase tracking-wide">{item}</span>
              <span className="text-accent text-[10px]">✦</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
