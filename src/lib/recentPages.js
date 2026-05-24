// Persist last-5 visited pages per user in localStorage
const KEY = 'setra_recent_pages';
const MAX = 5;

export function getRecentPages() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

export function pushRecentPage(entry) {
  // entry: { path, label, icon (string name) }
  const current = getRecentPages().filter(r => r.path !== entry.path);
  const next = [entry, ...current].slice(0, MAX);
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
}