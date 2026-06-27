import { useState } from 'react'
import { ChevronDown, FileText, Sparkles, RefreshCw, MessageCircle } from 'lucide-react'

export default function GlassBox({ trace, citations = [] }) {
  if (!trace) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-8">
        <Sparkles className="h-5 w-5 text-ink-faint mb-3" />
        <p className="text-sm text-ink-soft leading-relaxed max-w-50">
          Ask a question to see how the answer was found — step by step.
        </p>
      </div>
    )
  }

  if (trace.blocked) {
    return (
      <div className="px-6 py-7">
        <SectionTitle>Blocked</SectionTitle>
        <p className="text-sm text-ink-soft">The question was flagged as a possible prompt-injection attempt and was not run through retrieval.</p>
      </div>
    )
  }

  if (trace.no_retrieval) {
    return (
      <div className="px-6 py-7">
        <SectionTitle>Query</SectionTitle>
        <p className="text-sm text-ink leading-relaxed mb-6">{trace.original_query}</p>
        <div className="flex items-start gap-2 rounded-lg bg-emerald-soft/50 px-3 py-3">
          <MessageCircle className="h-4 w-4 text-emerald shrink-0 mt-0.5" />
          <p className="text-[13px] text-ink-soft leading-relaxed">
            Answered directly — this was a conversational message, so no document retrieval was needed.
          </p>
        </div>
      </div>
    )
  }

  const rewritten = trace.resolved_query && trace.resolved_query !== trace.original_query
  const citedSet = new Set(citations.map((c) => c.n))

  return (
    <div className="h-full overflow-y-auto px-6 py-7 space-y-7">
      <div>
        <SectionTitle>Query</SectionTitle>
        <p className="text-sm text-ink leading-relaxed">{trace.original_query}</p>
        {rewritten && (
          <div className="mt-3 flex items-start gap-2 rounded-lg bg-emerald-soft/60 px-3 py-2">
            <RefreshCw className="h-3.5 w-3.5 text-emerald shrink-0 mt-0.5" />
            <div>
              <p className="font-mono text-[10px] tracking-wide uppercase text-emerald mb-0.5">Resolved follow-up</p>
              <p className="text-sm text-ink leading-snug">{trace.resolved_query}</p>
            </div>
          </div>
        )}
      </div>

      {trace.hyde_text && (
        <div>
          <SectionTitle>Hypothetical answer · HyDE</SectionTitle>
          <p className="text-[13px] text-ink-soft leading-relaxed italic border-l-2 border-line pl-3">
            {trace.hyde_text}
          </p>
        </div>
      )}

      <div>
        <SectionTitle>
          Chunks · {citedSet.size} cited of {trace.final_chunks?.length || 0} retrieved
        </SectionTitle>
        <div className="space-y-2">
          {(trace.final_chunks || []).map((c, i) => (
            <ChunkRow key={i} n={i + 1} chunk={c} cited={citedSet.has(i + 1)} />
          ))}
        </div>
      </div>
    </div>
  )
}

function SectionTitle({ children }) {
  return <h3 className="font-mono text-[11px] tracking-[0.16em] uppercase text-ink-faint mb-2.5">{children}</h3>
}

function ChunkRow({ n, chunk, cited }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`rounded-lg border overflow-hidden transition-colors
                     ${cited ? 'border-emerald/40 bg-emerald-soft/25' : 'border-line bg-paper-raised'}`}>
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left cursor-pointer hover:bg-emerald-soft/30 transition-colors">
        <span className={`font-mono text-[11px] font-medium rounded px-1
                          ${cited ? 'bg-emerald text-white' : 'text-ink-faint'}`}>[{n}]</span>
        <FileText className="h-3.5 w-3.5 text-ink-faint shrink-0" />
        <span className="flex-1 text-[12px] text-ink truncate">{chunk.source}{chunk.page ? ` · p.${chunk.page}` : ''}</span>
        {cited && <span className="font-mono text-[9px] tracking-wide uppercase text-emerald">cited</span>}
        <span className="font-mono text-[10px] text-ink-faint">{chunk.score?.toFixed(2)}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-ink-faint transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <p className="px-3 pb-3 pt-1 text-[12px] leading-relaxed text-ink-soft border-t border-line/60">
          {chunk.text}
        </p>
      )}
    </div>
  )
}