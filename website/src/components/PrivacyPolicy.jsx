import AnimatedSection from './AnimatedSection'

const SECTIONS = [
  {
    title: 'What Data We Collect',
    content: `None. LinkedIn Resume Tailor does not collect, transmit, or store any user data on external servers. All data — your base resume, tailored resumes, tailoring instructions, LLM configuration, and API key — is stored exclusively in chrome.storage.local on your device.`,
  },
  {
    title: 'Data That Stays on Your Device',
    items: [
      'Base resume (LaTeX source you paste into the Base tab)',
      'Tailored resumes and generation history (last 10)',
      'Tailoring instructions (the system prompt for the LLM)',
      'LLM settings: endpoint URL, model name, API key',
      'Last detected job metadata (title, company, job ID)',
    ],
  },
  {
    title: 'Network Requests the Extension Makes',
    items: [
      'LinkedIn voyager API (linkedin.com) — to extract job descriptions from the page you are viewing, using your existing LinkedIn session cookies. Only triggered when you open a job posting.',
      'Your configured LLM endpoint — to generate a tailored resume. Only triggered when you click the Generate button. Your base resume + the job description are sent to the endpoint you configured with the API key you provided.',
      'LaTeX-on-HTTP (latex.ytotech.com) — to compile your LaTeX resume into a PDF. Only triggered when you click the PDF button or open the Rendered tab. Only your LaTeX resume content is sent; no personal metadata.',
    ],
  },
  {
    title: 'What We Do NOT Do',
    items: [
      'We do not run analytics or tracking of any kind',
      'We do not use cookies (the LinkedIn session cookie is used by the browser, not by us)',
      'We do not collect usage metrics, crash reports, or telemetry',
      'We do not have a backend, database, or server',
      'We do not sell, share, or transmit any user data',
      'We do not store any data outside your browser',
    ],
  },
  {
    title: 'Third-Party Services',
    content: `The extension communicates with third-party services only when you explicitly trigger an action:

• Your LLM provider (OpenAI, OpenRouter, Anthropic, Blackbox, or any custom endpoint) — governed by that provider's privacy policy. You choose the provider and supply your own API key.

• LaTeX-on-HTTP (latex.ytotech.com) — an open-source LaTeX compilation service. Only your LaTeX document content is sent for compilation. See their repository at github.com/YtoTech/latex-on-http.

We have no affiliation with any of these services.`,
  },
  {
    title: 'Permissions Explained',
    items: [
      'storage — Save your resume, instructions, and settings locally in chrome.storage.local',
      'sidePanel — Display the extension UI as a Chrome side panel',
      'activeTab — Identify the active LinkedIn tab for job re-scanning',
      'scripting — Declared for compatibility; all scripts run via static manifest declarations',
      'Host permissions (linkedin.com) — Extract job descriptions from LinkedIn pages you visit',
      'Host permissions (LLM endpoints) — Send generation requests to your configured provider',
      'Host permissions (latex.ytotech.com) — Compile LaTeX to PDF',
    ],
  },
  {
    title: 'Data Retention',
    content: `All data persists in chrome.storage.local until you explicitly clear it (by clearing extension data in Chrome settings, uninstalling the extension, or overwriting it in the app). Generation history is capped at 10 entries — older entries are automatically removed.`,
  },
  {
    title: 'Children\'s Privacy',
    content: `This extension is not directed at children under 13. We do not knowingly collect any data from anyone, including children.`,
  },
  {
    title: 'Changes to This Policy',
    content: `If this privacy policy changes, the updated version will be published on this page and in the extension's Chrome Web Store listing. Since we collect no data, meaningful policy changes are unlikely.`,
  },
  {
    title: 'Contact',
    html: true,
    content: `For questions about this privacy policy, reach out to <a href="mailto:rlrahulkanojia@gmail.com" class="text-accent hover:underline">rlrahulkanojia@gmail.com</a> or open an issue on <a href="https://github.com/rlrahulkanojia/linkedin-resume-tailor" target="_blank" rel="noopener" class="text-accent hover:underline">GitHub</a>.`,
  },
]

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-bg pt-32 pb-20">
      <div className="max-w-[760px] mx-auto px-6">
        <AnimatedSection>
          <a href="/" className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-accent transition-colors mb-8">
            ← Back to home
          </a>
          <h1 className="text-[clamp(30px,5vw,48px)] font-extrabold tracking-tight mb-2">Privacy Policy</h1>
          <p className="text-text-secondary text-sm mb-12">Last updated: June 2025</p>

          <div className="glass rounded-2xl p-8 mb-8">
            <p className="text-text-secondary leading-relaxed">
              <strong className="text-text-primary">TL;DR</strong> — LinkedIn Resume Tailor stores everything locally on your device. We have no backend, no analytics, no tracking. The only network requests are ones you explicitly trigger: to your LLM provider (your key, your choice) and to a LaTeX compiler for PDF generation.
            </p>
          </div>
        </AnimatedSection>

        <div className="space-y-10">
          {SECTIONS.map((section, i) => (
            <AnimatedSection key={section.title} delay={i * 0.05}>
              <div>
                <h2 className="text-xl font-bold mb-3">{section.title}</h2>
                {section.content && !section.html && (
                  <p className="text-text-secondary leading-relaxed whitespace-pre-line">{section.content}</p>
                )}
                {section.content && section.html && (
                  <p className="text-text-secondary leading-relaxed" dangerouslySetInnerHTML={{ __html: section.content }} />
                )}
                {section.items && (
                  <ul className="space-y-2 mt-1">
                    {section.items.map((item, j) => (
                      <li key={j} className="flex gap-3 text-text-secondary leading-relaxed">
                        <span className="text-accent mt-1 shrink-0">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </div>
  )
}
