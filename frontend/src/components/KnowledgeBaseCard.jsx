import { ArrowUpRight, BadgeCheck } from 'lucide-react'

const BLURB = {
  'default-kb-1': 'Employee files, contracts, product specs, and company records for Insurellm — a fictional insurance-technology firm.',
  'default-kb-2': 'A parallel corpus for Nivara Assurance Technologies — the same document classes organized differently, for comparing retrieval across sources.',
}

export default function KnowledgeBaseCard({ notebook, count, onOpen }) {
  return (
    <button onClick={onOpen}
      className="group relative flex h-full flex-col w-full text-left rounded-xl border border-line bg-paper-raised p-7
                 transition-all duration-300 hover:-translate-y-0.5 cursor-pointer
                 hover:shadow-[0_12px_40px_-12px_rgba(10,92,70,0.16)]
                 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald/40">
      <span className="absolute left-0 top-7 bottom-7 w-0.75 rounded-full bg-emerald/70 transition-colors duration-300 group-hover:bg-emerald" />
      <div className="flex items-center justify-between mb-5">
        <span className="font-mono text-[11px] tracking-[0.18em] uppercase text-emerald">Knowledge base</span>
        <ArrowUpRight className="h-4 w-4 text-ink-faint transition-all duration-300 group-hover:text-emerald group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      </div>
      <h3 className="font-display text-2xl leading-snug tracking-[-0.01em] mb-2">{notebook.title}</h3>
      <p className="text-sm text-ink-soft leading-relaxed mb-6 flex-1 line-clamp-3">
        {BLURB[notebook.id] || 'A curated knowledge base, pre-indexed and ready to query.'}
      </p>
      <div className="flex items-center gap-4 font-mono text-[11px] text-ink-faint">
        <span>{count != null ? `${count} documents` : '— documents'}</span>
        <span className="h-1 w-1 rounded-full bg-line" />
        <span className="inline-flex items-center gap-1 text-emerald">
          <BadgeCheck className="h-3.5 w-3.5" /> evaluated
        </span>
      </div>
    </button>
  )
}