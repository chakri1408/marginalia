import { useEffect, useRef, useState } from 'react'
import { Play, Loader2, AlertCircle } from 'lucide-react'
import { api } from '../api/client'

const RETRIEVAL_KEYS = [
  ['keyword_hit_rate', 'Keyword hit rate'],
  ['full_coverage', 'Full coverage'],
  ['mrr', 'MRR'],
  ['ndcg_binary', 'nDCG'],
]
const ANSWER_KEYS = [
  ['faithfulness', 'Faithfulness'],
  ['correctness', 'Correctness'],
  ['relevance', 'Relevance'],
]

export default function EvalsDashboard({ notebookId }) {
  const [info, setInfo] = useState(null)
  const [retrieval, setRetrieval] = useState(null)
  const [answer, setAnswer] = useState(null)
  const [nPer, setNPer] = useState(3)
  const polling = useRef(null)

  const anyRunning = retrieval?.metrics?.status === 'running' || answer?.metrics?.status === 'running'

  useEffect(() => {
    api.evalInfo(notebookId).then((i) => { setInfo(i); setNPer(Math.min(3, i.max_answer_sample || 1)) }).catch(() => {})
    api.listEvals(notebookId).then((runs) => {
      const r = runs.find((x) => x.kind === 'retrieval')
      const a = runs.find((x) => x.kind === 'answer')
      if (r) setRetrieval(r)
      if (a) setAnswer(a)
      if (r?.metrics?.status === 'running') startPoll(r.id, 'retrieval')
      if (a?.metrics?.status === 'running') startPoll(a.id, 'answer')
    }).catch(() => {})
    return () => clearInterval(polling.current)
  }, [notebookId])

  function startPoll(runId, kind) {
    clearInterval(polling.current)
    polling.current = setInterval(async () => {
      try {
        const run = await api.getEvalRun(notebookId, runId)
        ;(kind === 'retrieval' ? setRetrieval : setAnswer)(run)
        if (run.metrics?.status !== 'running') clearInterval(polling.current)
      } catch { clearInterval(polling.current) }
    }, 1000)
  }

  async function run(kind) {
    const started = await api.runEval(notebookId, kind, nPer)
    const seed = { id: started.id, kind, metrics: { status: 'running', completed: 0, total: kind === 'retrieval' ? info?.total : nPer * info?.categories } }
    ;(kind === 'retrieval' ? setRetrieval : setAnswer)(seed)
    startPoll(started.id, kind)
  }

  return (
    <div className="flex-1 overflow-y-auto px-8 py-10 bg-paper">
      <div className="max-w-5xl mx-auto">
        <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-emerald mb-2">Evaluation</p>
        <h2 className="font-display text-3xl mb-2">How well does retrieval actually work?</h2>
        <p className="text-ink-soft mb-10 max-w-2xl leading-relaxed">
          Run the system against a labelled test set and measure it — retrieval quality across the full set,
          and answer quality judged by an LLM on a stratified sample.
        </p>

        <div className="grid md:grid-cols-2 gap-6 items-start">
          <EvalColumn
            title="Retrieval evaluation"
            desc={info ? `Runs all ${info.total} questions. Keyword-based metrics, no LLM judge.` : 'Loading…'}
            run={retrieval} metricKeys={RETRIEVAL_KEYS} fmt={(v) => v.toFixed(3)}
            onRun={() => run('retrieval')} disabled={anyRunning}
          />
          <EvalColumn
            title="Answer evaluation"
            desc={info ? `LLM-as-judge on ${nPer} per category (${nPer * info.categories} questions).` : 'Loading…'}
            run={answer} metricKeys={ANSWER_KEYS} fmt={(v) => v.toFixed(2)} maxScale={5}
            onRun={() => run('answer')} disabled={anyRunning}
            picker={info && (
              <div className="flex items-center gap-1.5 mb-4">
                <span className="font-mono text-[11px] text-ink-faint mr-1">per category</span>
                {[1, 2, 3, 4].slice(0, info.max_answer_sample).map((n) => (
                  <button key={n} onClick={() => setNPer(n)} disabled={anyRunning}
                    className={`h-7 w-7 rounded-md font-mono text-xs cursor-pointer transition-colors
                                ${nPer === n ? 'bg-emerald text-white' : 'border border-line text-ink-soft hover:border-emerald/40'}`}>
                    {n}
                  </button>
                ))}
              </div>
            )}
          />
        </div>
      </div>
    </div>
  )
}

function EvalColumn({ title, desc, run, metricKeys, fmt, maxScale = 1, onRun, disabled, picker }) {
  const status = run?.metrics?.status
  const m = run?.metrics

  return (
    <div className="rounded-xl border border-line bg-paper-raised p-7">
      <h3 className="font-display text-xl mb-1">{title}</h3>
      <p className="text-sm text-ink-soft leading-relaxed mb-5">{desc}</p>
      {picker}

      {status === 'running' ? (
        <Progress completed={m.completed || 0} total={m.total || 1} />
      ) : status === 'error' ? (
        <p className="flex items-center gap-2 text-sm text-emerald-deep"><AlertCircle className="h-4 w-4" /> {m.error}</p>
      ) : status === 'done' ? (
        <Results m={m} metricKeys={metricKeys} fmt={fmt} maxScale={maxScale} onRerun={onRun} disabled={disabled} />
      ) : (
        <button onClick={onRun} disabled={disabled}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald px-5 py-2.5 text-sm text-white
                     cursor-pointer transition-colors hover:bg-emerald-deep disabled:opacity-40 disabled:cursor-default">
          <Play className="h-4 w-4" /> Run evaluation
        </button>
      )}
      {disabled && status !== 'running' && (
        <p className="mt-3 font-mono text-[11px] text-ink-faint">Waiting — another evaluation is running.</p>
      )}
    </div>
  )
}

function Progress({ completed, total }) {
  const pct = Math.round((completed / total) * 100)
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="flex items-center gap-2 font-mono text-[12px] text-emerald">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Running
        </span>
        <span className="font-mono text-[12px] text-ink-soft">{completed} / {total}</span>
      </div>
      <div className="h-1.5 rounded-full bg-line overflow-hidden">
        <div className="h-full bg-emerald transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function Results({ m, metricKeys, fmt, maxScale, onRerun, disabled }) {
  const cats = Object.entries(m.per_category || {})
  return (
    <div>
      <div className="grid grid-cols-2 gap-3 mb-6">
        {metricKeys.map(([k, label]) => (
          <div key={k} className="rounded-lg bg-emerald-soft/40 px-4 py-3">
            <div className="font-mono text-2xl text-emerald-deep">{fmt(m.overall[k])}{maxScale === 5 ? <span className="text-base text-ink-faint">/5</span> : ''}</div>
            <div className="font-mono text-[10px] tracking-wide uppercase text-ink-faint mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-ink-faint mb-2">By category</p>
      <div className="space-y-1.5 mb-5">
        {cats.map(([cat, scores]) => (
          <div key={cat} className="flex items-center gap-3">
            <span className="w-28 shrink-0 text-[12px] text-ink truncate">{cat.replace(/_/g, ' ')}</span>
            <div className="flex-1 h-1.5 rounded-full bg-line overflow-hidden">
              <div className="h-full bg-emerald/70" style={{ width: `${(scores[metricKeys[0][0]] / maxScale) * 100}%` }} />
            </div>
            <span className="font-mono text-[11px] text-ink-soft w-10 text-right">{fmt(scores[metricKeys[0][0]])}</span>
          </div>
        ))}
      </div>

      <button onClick={onRerun} disabled={disabled}
        className="font-mono text-[12px] text-emerald cursor-pointer hover:underline disabled:opacity-40 disabled:cursor-default disabled:no-underline">
        Run again
      </button>
    </div>
  )
}