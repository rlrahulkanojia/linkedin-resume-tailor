export default function Footer() {
  return (
    <footer className="py-9 border-t border-[rgba(255,255,255,0.05)] bg-bg-2">
      <div className="max-w-[1120px] mx-auto px-6 flex items-center justify-between flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2.5 font-semibold">
          <img src="/icon48.png" alt="Logo" width="24" height="24" />
          <span>LinkedIn Resume Tailor</span>
        </div>
        <div className="flex gap-7 text-[13px]">
          <a href="https://github.com/rlrahulkanojia/linkedin-resume-tailor" target="_blank" rel="noopener" className="text-text-muted hover:text-text-primary transition-colors">GitHub</a>
          <a href="/privacy-policy" className="text-text-muted hover:text-text-primary transition-colors">Privacy Policy</a>
          <a href="#features" className="text-text-muted hover:text-text-primary transition-colors">Features</a>
        </div>
        <p className="text-xs text-text-muted">&copy; 2025 Rahul Kanojia. MIT License.</p>
      </div>
    </footer>
  )
}
