const KEY = 'marginalia.notebooks'

export function getMyNotebookIds() {
  try { return JSON.parse(localStorage.getItem(KEY)) || [] } catch { return [] }
}
export function addMyNotebookId(id) {
  const ids = getMyNotebookIds()
  if (!ids.includes(id)) localStorage.setItem(KEY, JSON.stringify([...ids, id]))
}
export function removeMyNotebookId(id) {
  localStorage.setItem(KEY, JSON.stringify(getMyNotebookIds().filter((x) => x !== id)))
}