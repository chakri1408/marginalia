import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { api } from '../api/client'
import { getMyNotebookIds, addMyNotebookId } from '../lib/storage'
import TopBar from '../components/TopBar'
import KnowledgeBaseCard from '../components/KnowledgeBaseCard'
import NotebookCard, { CreateNotebookTile } from '../components/NotebookCard'

const fade = {
  hidden: { opacity: 0, y: 12 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] } }),
}

export default function Landing() {
  const navigate = useNavigate()
  const [defaults, setDefaults] = useState([])
  const [mine, setMine] = useState([])
  const [counts, setCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    (async () => {
      try {
        const all = await api.listNotebooks()
        const myIds = getMyNotebookIds()
        const def = all.filter((n) => n.type === 'default')
        setDefaults(def)
        setMine(all.filter((n) => n.type === 'user' && myIds.includes(n.id)))
        const entries = await Promise.all(def.map(async (n) => {
          try { const s = await api.listSources(n.id); return [n.id, s.length] }
          catch { return [n.id, null] }
        }))
        setCounts(Object.fromEntries(entries))
      } finally { setLoading(false) }
    })()
  }, [])

  async function handleCreate() {
    setCreating(true)
    try {
      const nb = await api.createNotebook()
      addMyNotebookId(nb.id)
      navigate(`/notebook/${nb.id}`)
    } catch { setCreating(false) }
  }

  return (
    <div className="min-h-screen bg-paper text-ink">
      <TopBar />
      <main className="mx-auto max-w-6xl px-6 sm:px-8">
        <section className="pt-20 pb-16 sm:pt-28 sm:pb-20 max-w-3xl">
          <motion.p variants={fade} initial="hidden" animate="show" custom={0}
            className="font-mono text-xs tracking-[0.2em] uppercase text-emerald mb-6">
            Retrieval · Cited answers
          </motion.p>
          <motion.h1 variants={fade} initial="hidden" animate="show" custom={1}
            className="font-display font-light text-5xl sm:text-6xl leading-[1.05] tracking-[-0.02em]">
            Answers you can trace back to the page.
          </motion.h1>
          <motion.p variants={fade} initial="hidden" animate="show" custom={2}
            className="mt-6 text-lg text-ink-soft leading-relaxed max-w-xl">
            A retrieval system that reads your documents, finds the passages that matter, and
            answers with every source cited — so you can always check the work.
          </motion.p>
        </section>

        <section className="pb-20">
          <SectionLabel>Featured knowledge bases</SectionLabel>
          <div className="grid sm:grid-cols-2 gap-5 items-stretch">
            {loading
              ? [0, 1].map((i) => <div key={i} className="h-44 rounded-xl border border-line bg-paper-raised animate-pulse" />)
              : defaults.map((n, i) => (
                  <motion.div key={n.id} variants={fade} initial="hidden" animate="show" custom={i} className="h-full">
                    <KnowledgeBaseCard notebook={n} count={counts[n.id]} onOpen={() => navigate(`/notebook/${n.id}`)} />
                  </motion.div>
                ))}
          </div>
        </section>

        <section className="pb-28">
          <SectionLabel>Your notebooks</SectionLabel>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <CreateNotebookTile onClick={handleCreate} busy={creating} />
            {mine.map((n) => (
              <NotebookCard key={n.id} notebook={n}
                onOpen={() => navigate(`/notebook/${n.id}`)}
                onDeleted={(id) => setMine((prev) => prev.filter((x) => x.id !== id))} />
            ))}
          </div>
          <p className="mt-8 font-mono text-xs text-ink-faint">
            Notebooks you create are temporary and are cleared automatically after 24 hours.
          </p>
        </section>
      </main>
    </div>
  )
}

function SectionLabel({ children }) {
  return (
    <div className="flex items-center gap-4 mb-6">
      <h2 className="font-mono text-xs tracking-[0.18em] uppercase text-ink-soft">{children}</h2>
      <div className="h-px flex-1 bg-line" />
    </div>
  )
}