import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, Menu, X } from 'lucide-react'

const GitHubIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
  </svg>
)

export default function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[rgba(5,7,9,0.7)] backdrop-blur-xl border-b border-[rgba(255,255,255,0.05)]">
      <div className="max-w-[1120px] mx-auto px-6 h-16 flex items-center justify-between">
        <a href="#" className="flex items-center gap-2.5 font-bold text-[15px]">
          <img src="/icon48.png" alt="Logo" className="w-[30px] h-[30px] rounded-lg" />
          <span>Resume Tailor</span>
        </a>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium">
          <a href="#features" className="text-text-secondary hover:text-text-primary transition-colors">Features</a>
          <a href="#how-it-works" className="text-text-secondary hover:text-text-primary transition-colors">How It Works</a>
          <a href="#gallery" className="text-text-secondary hover:text-text-primary transition-colors">Gallery</a>
          <a href="#privacy" className="text-text-secondary hover:text-text-primary transition-colors">Privacy</a>
          <a href="https://github.com/rlrahulkanojia/linkedin-resume-tailor" target="_blank" rel="noopener" className="text-text-secondary hover:text-text-primary transition-colors" title="GitHub">
            <GitHubIcon />
          </a>
          <a href="#install" className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-accent text-white text-[13px] font-semibold border border-accent shadow-[0_2px_20px_rgba(91,156,255,0.2)] hover:bg-accent-dark hover:shadow-[0_4px_30px_rgba(91,156,255,0.35)] transition-all hover:-translate-y-0.5">
            Install Free <ChevronRight size={14} />
          </a>
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden text-text-primary" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden bg-[rgba(5,7,9,0.95)] backdrop-blur-xl border-b border-border px-6 py-6 flex flex-col gap-5"
          >
            <a href="#features" className="text-text-secondary hover:text-text-primary" onClick={() => setOpen(false)}>Features</a>
            <a href="#how-it-works" className="text-text-secondary hover:text-text-primary" onClick={() => setOpen(false)}>How It Works</a>
            <a href="#gallery" className="text-text-secondary hover:text-text-primary" onClick={() => setOpen(false)}>Gallery</a>
            <a href="#privacy" className="text-text-secondary hover:text-text-primary" onClick={() => setOpen(false)}>Privacy</a>
            <a href="https://github.com/rlrahulkanojia/linkedin-resume-tailor" target="_blank" rel="noopener" className="flex items-center gap-2 text-text-secondary hover:text-text-primary" onClick={() => setOpen(false)}>
              <GitHubIcon size={18} /> GitHub
            </a>
            <a href="#install" className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-accent text-white font-semibold" onClick={() => setOpen(false)}>
              Install Free <ChevronRight size={14} />
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
