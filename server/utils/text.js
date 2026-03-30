export function countWords(text) {
  const matches = (text || "").match(/\b[\w'-]+\b/g);
  return matches ? matches.length : 0;
}

export function dedupeParagraphs(text) {
  const paragraphs = (text || "")
    .split(/\n\s*\n/g)
    .map((p) => p.trim())
    .filter(Boolean);

  const seen = new Set();
  const out = [];
  for (const paragraph of paragraphs) {
    const normalized = paragraph.replace(/\s+/g, " ").trim().toLowerCase();
    if (seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    out.push(paragraph);
  }
  return out.join("\n\n");
}
