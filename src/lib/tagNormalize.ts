/**
 * Display tags as lower kebab-case (e.g. "Topological Sort" → "topological-sort").
 * Dedupes by normalized form so casing/spacing variants collapse to one tag.
 */
export function normalizeTagKebab(raw: string): string {
  let s = String(raw).trim().replace(/^#+/u, "");
  s = s.replace(/_/g, " ").replace(/\s+/g, " ").trim();
  s = s.toLowerCase();
  s = s.replace(/\s+/g, "-");
  s = s.replace(/-+/g, "-").replace(/^-+|-+$/g, "");
  return s;
}

export function normalizeAndDedupeTags(tags: string[], max = 20): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of tags) {
    const n = normalizeTagKebab(t);
    if (!n || seen.has(n)) continue;
    seen.add(n);
    out.push(n);
    if (out.length >= max) break;
  }
  return out;
}
