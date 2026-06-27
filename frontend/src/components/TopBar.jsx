import { Link } from 'react-router-dom'

export default function TopBar() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper/80 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-6 sm:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-baseline gap-2.5">
          <span className="font-display text-xl tracking-[-0.01em]">Marginalia</span>
          <span className="hidden sm:inline font-mono text-[10px] tracking-[0.2em] uppercase text-ink-faint border-l border-line pl-2.5">
            RAG
          </span>
        </Link>
        <a href="http://localhost:8000/docs" target="_blank" rel="noreferrer"
          className="font-mono text-xs tracking-wide text-ink-soft hover:text-emerald transition-colors">
          API ↗
        </a>
      </div>
    </header>
  )
}