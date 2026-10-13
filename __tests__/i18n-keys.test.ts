import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import strings from '../i18n/strings.json';

// Every literal key passed to t / tn / tList / translate* must exist — a typo
// otherwise only shows up as a raw key on someone's phone.
const root = join(__dirname, '..');
const DIRS = ['app', 'components', 'lib'];

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return files(p);
    return /\.(ts|tsx)$/.test(name) ? [p] : [];
  });
}

function leafKeys(obj: Record<string, any>, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) => {
    if (k === '_meta') return [];
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && 'cs' in v && 'en' in v) return [key];
    return v && typeof v === 'object' ? leafKeys(v, key) : [];
  });
}

const known = new Set(leafKeys(strings));
const CALL = /\b(?:t|tn|tList|translate|translatePlural|translateList)\(\s*(?:lang,\s*)?'([a-z_]+\.[a-zA-Z0-9_.]+)'/g;

describe('i18n keys used in code', () => {
  const used = DIRS.flatMap((d) => files(join(root, d))).flatMap((f) => {
    const src = readFileSync(f, 'utf8');
    return [...src.matchAll(CALL)].map((m) => ({ key: m[1], file: f.replace(root + '/', '') }));
  });

  it('finds the calls', () => {
    expect(used.length).toBeGreaterThan(100);
  });

  it('all exist in strings.json', () => {
    const missing = used.filter((u) => !known.has(u.key)).map((u) => `${u.key} (${u.file})`);
    expect(missing).toEqual([]);
  });
});
