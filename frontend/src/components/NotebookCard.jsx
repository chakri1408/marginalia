import { Plus, FileText, Loader2, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { api } from '../api/client'
import { removeMyNotebookId } from '../lib/storage'

export function CreateNotebookTile({ onClick, busy }) {
  return (
    <button onClick={onClick} disabled={busy}
      className="group flex flex-col items-center justify-center gap-3 h-44 rounded-xl border border-dashed border-line
                 cursor-pointer transition-all duration-300 hover:border-emerald/50 hover:bg-emerald-soft/40
                 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald/40 disabled:opacity-60 disabled:cursor-default">
      <span className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-paper-raised text-emerald
                       transition-all duration-300 group-hover:border-emerald/40 group-hover:scale-105">
        {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
      </span>
      <span className="font-display text-lg">New notebook</span>
      <span className="font-mono text-[11px] text-ink-faint">Upload PDFs, Markdown, or text</span>
    </button>
  )
}

export default function NotebookCard({ notebook, onOpen, onDeleted }) {
  const [deleting, setDeleting] = useState(false)
  const created = new Date(notebook.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

  async function handleDelete(e) {
    e.stopPropagation()
    if (!window.confirm('Delete this notebook and everything in it?')) return
    setDeleting(true)
    try {
      await api.wipeNotebook(notebook.id)
      removeMyNotebookId(notebook.id)
      onDeleted?.(notebook.id)
    } catch {
      setDeleting(false)
    }
  }

  return (
    <div onClick={onDeleted ? onOpen : undefined}
      className="group relative flex flex-col h-44 text-left rounded-xl border border-line bg-paper-raised p-6
                 cursor-pointer transition-all duration-300 hover:-translate-y-0.5
                 hover:shadow-[0_12px_40px_-12px_rgba(26,29,26,0.12)]">
      <button onClick={handleDelete} aria-label="Delete notebook"
        className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-lg text-ink-faint
                   opacity-0 group-hover:opacity-100 cursor-pointer transition-all duration-200
                   hover:bg-emerald-soft hover:text-emerald-deep focus:outline-none focus-visible:opacity-100">
        {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
      </button>
      <FileText className="h-5 w-5 text-emerald mb-auto" />
      <h3 className="font-display text-xl leading-snug truncate pr-8">{notebook.title}</h3>
      <span className="mt-1 font-mono text-[11px] text-ink-faint">Created {created}</span>
    </div>
  )
}