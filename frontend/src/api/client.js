const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

async function req(path, options = {}) {
  const res = await fetch(`${API_BASE}/api${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  })
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}))
    throw new Error(detail.detail || `Request failed: ${res.status}`)
  }
  return res.status === 204 ? null : res.json()
}

export const api = {
  listNotebooks: () => req('/notebooks'),
  getNotebook: (id) => req(`/notebooks/${id}`),
  createNotebook: () => req('/notebooks', { method: 'POST' }),
  wipeNotebook: (id) => req(`/notebooks/${id}`, { method: 'DELETE' }),
  listSources: (id) => req(`/notebooks/${id}/sources`),
  renameNotebook: (id, title) => req(`/notebooks/${id}`, { method: 'PATCH', body: JSON.stringify({ title }) }),
  evalInfo: (id) => req(`/notebooks/${id}/evals/info`),
  getEvalRun: (id, runId) => req(`/notebooks/${id}/evals/${runId}`),
  clearSources: (id) => req(`/notebooks/${id}/sources`, { method: 'DELETE' }),
  chat: (id, question, history = []) =>
    req(`/notebooks/${id}/chat`, { method: 'POST', body: JSON.stringify({ question, history }) }),
  listTraces: (id) => req(`/notebooks/${id}/traces`),
  listEvals: (id) => req(`/notebooks/${id}/evals`),
  runEval: (id, kind, n = 3) =>
    req(`/notebooks/${id}/evals`, { method: 'POST', body: JSON.stringify({ kind, n_per_category: n }) }),
  uploadSources: async (id, files) => {
    const fd = new FormData()
    for (const f of files) fd.append('files', f)
    const res = await fetch(`${API_BASE}/api/notebooks/${id}/sources`, { method: 'POST', body: fd })
    if (!res.ok) throw new Error('Upload failed')
    return res.json()
  },
}