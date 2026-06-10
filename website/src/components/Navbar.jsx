import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, Menu, X } from 'lucide-react'

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
            <a href="#install" className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-accent text-white font-semibold" onClick={() => setOpen(false)}>
              Install Free <ChevronRight size={14} />
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
