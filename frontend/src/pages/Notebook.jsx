import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen } from 'lucide-react'
import { api } from '../api/client'
import ChatPane from '../components/ChatPane'
import GlassBox from '../components/GlassBox'
import SourcesRail from '../components/SourcesRail'
import EvalsDashboard from '../components/EvalsDashboard'

export default function Notebook() {
  const { id } = useParams()
  const [notebook, setNotebook] = useState(null)
  const [tab, setTab] = useState('chat')
  const [trace, setTrace] = useState(null)
  const [citations, setCitations] = useState([])
  const [error, setError] = useState(null)
  const [leftOpen, setLeftOpen] = useState(true)
  const [rightOpen, setRightOpen] = useState(true)

  useEffect(() => {
    api.getNotebook(id).then(setNotebook).catch(() => setError('Notebook not found'))
  }, [id])

  const isDefault = notebook?.type === 'default'

  if (error) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="text-center">
          <p className="font-display text-2xl mb-3">{error}</p>
          <Link to="/" className="font-mono text-sm text-emerald hover:underline">← Back to library</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-paper">
      <header className="shrink-0 border-b border-line bg-paper-raised/70 backdrop-blur-md">
        <div className="flex items-center gap-4 px-6 h-16">
          <Link to="/" className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-soft
                                   cursor-pointer hover:bg-emerald-soft hover:text-emerald-deep transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex-1 min-w-0">
            {isDefault ? (
              <h1 className="font-display text-xl truncate leading-tight">{notebook?.title || '…'}</h1>
            ) : (
              <input
                value={notebook?.title || ''}
                onChange={(e) => setNotebook((n) => ({ ...n, title: e.target.value }))}
                onBlur={(e) => api.renameNotebook(id, e.target.value).catch(() => {})}
                onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                className="font-display text-xl leading-tight bg-transparent w-full max-w-md
                           rounded px-1 -ml-1 hover:bg-emerald-soft/40 focus:bg-emerald-soft/40
                           focus:outline-none cursor-text transition-colors"
              />
            )}
            <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-ink-faint">
              {isDefault ? 'Knowledge base' : 'Notebook'}
            </p>
          </div>
          {isDefault && (
            <div className="flex items-center gap-1 rounded-lg border border-line bg-paper p-1">
              {['chat', 'evals'].map((t) => (
                <button key={t} onClick={() => setTab(t)}
                  className={`px-4 py-1.5 rounded-md font-mono text-xs tracking-wide capitalize cursor-pointer transition-colors
                              ${tab === t ? 'bg-emerald text-white' : 'text-ink-soft hover:text-ink'}`}>
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {tab === 'evals' && isDefault ? (
        <EvalsDashboard notebookId={id} />
      ) : (
        <div className="flex-1 grid min-h-0"
          style={{ gridTemplateColumns: `${leftOpen ? '300px' : '48px'} minmax(0,1fr) ${rightOpen ? '380px' : '48px'}` }}>
          {/* LEFT — sources */}
          {leftOpen ? (
            <aside className="border-r border-line bg-paper-raised/40 flex flex-col min-h-0">
              <div className="flex items-center justify-between px-5 h-11 border-b border-line shrink-0">
                <span className="font-mono text-[11px] tracking-[0.16em] uppercase text-ink-faint">Sources</span>
                <button onClick={() => setLeftOpen(false)} aria-label="Collapse sources"
                  className="flex h-7 w-7 items-center justify-center rounded-md text-ink-faint cursor-pointer hover:bg-emerald-soft hover:text-emerald-deep transition-colors">
                  <PanelLeftClose className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 min-h-0">
                {notebook && <SourcesRail notebook={notebook} />}
              </div>
            </aside>
          ) : (
            <div className="border-r border-line bg-paper-raised/40 flex justify-center pt-3">
              <button onClick={() => setLeftOpen(true)} aria-label="Expand sources"
                className="flex h-8 w-8 items-center justify-center rounded-md text-ink-faint cursor-pointer hover:bg-emerald-soft hover:text-emerald-deep transition-colors">
                <PanelLeftOpen className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* MIDDLE — chat */}
          <section className="min-h-0 min-w-0">
            <ChatPane notebookId={id} onTrace={(t, c) => { setTrace(t); setCitations(c || []) }} />
          </section>

          {/* RIGHT — glass box */}
          {rightOpen ? (
            <aside className="border-l border-line bg-paper-raised/40 flex flex-col min-h-0">
              <div className="flex items-center justify-between px-5 h-11 border-b border-line shrink-0">
                <button onClick={() => setRightOpen(false)} aria-label="Collapse x-ray"
                  className="flex h-7 w-7 items-center justify-center rounded-md text-ink-faint cursor-pointer hover:bg-emerald-soft hover:text-emerald-deep transition-colors">
                  <PanelRightClose className="h-4 w-4" />
                </button>
                <span className="font-mono text-[11px] tracking-[0.16em] uppercase text-ink-faint">Retrieval x-ray</span>
              </div>
              <div className="flex-1 min-h-0">
                <GlassBox trace={trace} citations={citations} />
              </div>
            </aside>
          ) : (
            <div className="border-l border-line bg-paper-raised/40 flex justify-center pt-3">
              <button onClick={() => setRightOpen(true)} aria-label="Expand x-ray"
                className="flex h-8 w-8 items-center justify-center rounded-md text-ink-faint cursor-pointer hover:bg-emerald-soft hover:text-emerald-deep transition-colors">
                <PanelRightOpen className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}