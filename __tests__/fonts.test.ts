import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

// The original font files were saved GitHub HTML pages, so the app silently
// fell back to the system font. Guard against that ever happening again.
const dir = join(__dirname, '..', 'assets', 'fonts');

describe('bundled fonts', () => {
  const files = readdirSync(dir).filter((f) => f.endsWith('.ttf'));

  it('ships the fonts the root layout loads', () => {
    expect(files.length).toBeGreaterThanOrEqual(8);
  });

  it.each(files)('%s is a real TrueType file', (file) => {
    const magic = readFileSync(join(dir, file)).subarray(0, 4).toString('hex');
    expect(['00010000', '74727565']).toContain(magic);
  });
});
