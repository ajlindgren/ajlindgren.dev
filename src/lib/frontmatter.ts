/**
 * Minimal frontmatter parser — zero dependencies.
 *
 * Splits a leading `---` fenced block of simple `key: value` lines from the
 * markdown body. Intentionally tiny: values are treated as plain strings (the
 * only shape Face 3's Patron content needs). If you ever need arrays, dates, or
 * nested YAML, reach for `gray-matter` instead of growing this.
 */
export type Frontmatter = {
  data: Record<string, string>;
  body: string;
};

const FENCE = /^---\s*$/;

export function parseFrontmatter(raw: string): Frontmatter {
  const normalized = raw.replace(/\r\n/g, '\n');
  const lines = normalized.split('\n');

  // No opening fence → the whole thing is body.
  if (lines.length === 0 || !FENCE.test(lines[0])) {
    return { data: {}, body: normalized.trim() };
  }

  const data: Record<string, string> = {};
  let i = 1;
  for (; i < lines.length; i++) {
    if (FENCE.test(lines[i])) {
      i++; // step past the closing fence
      break;
    }
    const line = lines[i];
    const sep = line.indexOf(':');
    if (sep === -1) continue; // skip blank / malformed lines
    const key = line.slice(0, sep).trim();
    if (!key) continue;
    data[key] = unquote(line.slice(sep + 1).trim());
  }

  const body = lines.slice(i).join('\n').trim();
  return { data, body };
}

function unquote(value: string): string {
  if (value.length >= 2) {
    const first = value[0];
    const last = value[value.length - 1];
    if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
      return value.slice(1, -1);
    }
  }
  return value;
}
