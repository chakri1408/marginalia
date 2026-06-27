import { useState, useRef, useEffect } from 'react'
import { ArrowUp, Loader2, ShieldAlert } from 'lucide-react'
import { api } from '../api/client'

function renderWithCitations(text) {
  // turn [1], [2] into styled superscripts
  const parts = text.split(/(\[\d+\])/g)
  return parts.map((p, i) => {
    const m = p.match(/^\[(\d+)\]$/)
    return m
      ? <sup key={i} className="font-mono text-[10px] text-emerald font-medium px-0.5">[{m[1]}]</sup>
      : <span key={i}>{p}</span>
  })
}

export default function ChatPane({ notebookId, onTrace }) {
  const [messages, setMessages] = useState([]) // {role, content, blocked?}
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, busy])

  async function send() {
    const q = input.trim()
    if (!q || busy) return
    setInput('')
    const history = messages.map((m) => ({ role: m.role, content: m.content }))
    setMessages((prev) => [...prev, { role: 'user', content: q }])
    setBusy(true)
    try {
      const res = await api.chat(notebookId, q, history)
      setMessages((prev) => [...prev, {
        role: 'assistant', content: res.answer,
        blocked: res.trace?.blocked, citations: res.citations,
      }])
      onTrace?.(res.trace, res.citations || [])
    } catch (e) {
      setMessages((prev) => [...prev, { role: 'assistant', content: `Something went wrong: ${e.message}`, error: true }])
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-paper">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-8 py-8">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto">
            <p className="font-mono text-[11px] tracking-[0.18em] uppercase text-emerald mb-4">Ask the archive</p>
            <p className="font-display text-2xl leading-snug mb-3">What would you like to know?</p>
            <p className="text-sm text-ink-soft leading-relaxed">
              Ask a question about the documents. Every answer comes back with the exact sources it drew from.
            </p>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-7">
            {messages.map((m, i) => (
              <Message key={i} m={m} />
            ))}
            {busy && (
              <div className="flex items-center gap-2 text-ink-faint">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="font-mono text-xs">retrieving · reranking · answering</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-line bg-paper-raised/60 px-8 py-5">
        <div className="max-w-2xl mx-auto flex items-end gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            placeholder="Ask a question…"
            rows={1}
            className="flex-1 resize-none bg-transparent text-ink placeholder:text-ink-faint
                       text-[15px] leading-relaxed py-2 focus:outline-none max-h-32"
          />
          <button onClick={send} disabled={busy || !input.trim()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald text-white
                       cursor-pointer transition-all hover:bg-emerald-deep disabled:opacity-30 disabled:cursor-default">
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

function Message({ m }) {
  if (m.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-emerald-soft px-4 py-2.5 text-[15px] text-ink">
          {m.content}
        </div>
      </div>
    )
  }
  if (m.blocked) {
    return (
      <div className="flex items-start gap-3 text-ink-soft">
        <ShieldAlert className="h-5 w-5 text-emerald-deep shrink-0 mt-0.5" />
        <p className="text-[15px] leading-relaxed">{m.content}</p>
      </div>
    )
  }
  return (
    <div className="text-[15px] leading-[1.7] text-ink">{renderWithCitations(m.content)}</div>
  )
}