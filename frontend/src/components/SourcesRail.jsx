import { useEffect, useRef, useState, useCallback } from 'react'
import { Upload, FileText, Loader2, AlertCircle, Lock, Trash2, Search } from 'lucide-react'
import { api } from '../api/client'

const MAX_FILES = 10
const MAX_MB = 20
const ALLOWED = ['.pdf', '.md', '.txt']

export default function SourcesRail({ notebook }) {
  const isDefault = notebook.type === 'default'
  const [sources, setSources] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [clearing, setClearing] = useState(false)
  const fileRef = useRef(null)

  const load = useCallback(async () => {
    try {
      const s = await api.listSources(notebook.id)
      setSources(s)
      return s
    } catch {
      return []
    } finally {
      setLoading(false)
    }
  }, [notebook.id])

  useEffect(() => { load() }, [load])

  // poll while anything is still ingesting (user notebooks only)
  useEffect(() => {
    if (isDefault) return
    const pending = sources.some((s) => s.status === 'pending' || s.status === 'ingesting')
    if (!pending) return
    const t = setInterval(load, 2000)
    return () => clearInterval(t)
  }, [sources, isDefault, load])

  async function handleFiles(fileList) {
    setError('')
    const files = Array.from(fileList)
    if (files.length === 0) return

    const bad = files.find((f) => !ALLOWED.some((e) => f.name.toLowerCase().endsWith(e)))
    if (bad) { setError(`Unsupported file: ${bad.name}. Use PDF, Markdown, or text.`); return }
    if (sources.length + files.length > MAX_FILES) {
      setError(`Up to ${MAX_FILES} files per notebook (${sources.length} already added).`); return
    }
    const totalMB = files.reduce((a, f) => a + f.size, 0) / (1024 * 1024)
    if (totalMB > MAX_MB) {
      setError(`Combined size must be under ${MAX_MB} MB (selected ${totalMB.toFixed(1)} MB).`); return
    }

    setUploading(true)
    try {
      await api.uploadSources(notebook.id, files)
      await load()
    } catch {
      setError('Upload failed. Please try again.')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function handleClear() {
    if (!window.confirm('Remove all documents from this notebook? This cannot be undone.')) return
    setClearing(true)
    try {
      await api.clearSources(notebook.id)
      setSources([])
    } catch {
      setError('Could not clear the notebook.')
    } finally {
      setClearing(false)
    }
  }

  const filtered = isDefault && query
    ? sources.filter((s) => s.filename.toLowerCase().includes(query.toLowerCase()))
    : sources

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 pt-4 pb-3 shrink-0">
        {isDefault ? (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-soft px-2 py-0.5 font-mono text-[10px] tracking-wide uppercase text-emerald-deep">
              <Lock className="h-3 w-3" /> Read only
            </span>
            <span className="font-mono text-[11px] text-ink-faint">{sources.length} documents</span>
          </div>
        ) : (
          <>
            <input ref={fileRef} type="file" multiple accept=".pdf,.md,.txt" className="hidden"
              onChange={(e) => handleFiles(e.target.files)} />
            <button onClick={() => fileRef.current?.click()} disabled={uploading || sources.length >= MAX_FILES}
              className="w-full flex items-center justify-center gap-2 rounded-lg border border-dashed border-line py-3
                         text-sm text-ink-soft cursor-pointer transition-colors hover:border-emerald/50
                         hover:bg-emerald-soft/30 disabled:opacity-50 disabled:cursor-default">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploading ? 'Uploading…' : 'Add sources'}
            </button>
            <p className="mt-2 font-mono text-[10px] text-ink-faint">
              {sources.length}/{MAX_FILES} files · PDF, MD, TXT · 20 MB total
            </p>
            {error && (
              <p className="mt-2 flex items-start gap-1.5 text-[12px] text-emerald-deep">
                <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" /> {error}
              </p>
            )}
          </>
        )}
      </div>

      {isDefault && sources.length > 8 && (
        <div className="px-5 pb-3 shrink-0">
          <div className="flex items-center gap-2 rounded-lg border border-line bg-paper px-3 py-2">
            <Search className="h-3.5 w-3.5 text-ink-faint" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search documents…"
              className="flex-1 bg-transparent text-[13px] text-ink placeholder:text-ink-faint focus:outline-none" />
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {loading ? (
          <p className="px-2 font-mono text-[11px] text-ink-faint">Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-ink-soft">
            {isDefault ? 'No documents.' : 'No sources yet. Add files to begin.'}
          </p>
        ) : (
          <ul className="space-y-0.5">
            {filtered.map((s) => (
              <li key={s.id} className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 hover:bg-emerald-soft/30 transition-colors">
                <FileText className="h-3.5 w-3.5 text-ink-faint shrink-0" />
                <span className="flex-1 text-[13px] text-ink truncate">{s.filename}</span>
                <StatusBadge status={s.status} chunks={s.num_chunks} isDefault={isDefault} />
              </li>
            ))}
          </ul>
        )}
      </div>

      {!isDefault && (
        <div className="shrink-0 border-t border-line p-3">
          <button onClick={handleClear} disabled={clearing || sources.length === 0}
            className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-[13px] text-ink-soft
                       cursor-pointer transition-colors hover:bg-emerald-soft hover:text-emerald-deep
                       disabled:opacity-40 disabled:cursor-default">
            {clearing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Clean database
          </button>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status, chunks, isDefault }) {
  if (isDefault || status === 'ready') {
    return <span className="font-mono text-[10px] text-ink-faint shrink-0">{chunks} ch</span>
  }
  if (status === 'error') {
    return <AlertCircle className="h-3.5 w-3.5 text-emerald-deep shrink-0" title="Failed to ingest" />
  }
  return <Loader2 className="h-3.5 w-3.5 text-emerald animate-spin shrink-0" />
}