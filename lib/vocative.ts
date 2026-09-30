/**
 * Czech vocative heuristic for first names.
 * Handles the most common patterns; user can override via user.vocative.
 */
export function toVocative(name: string): string {
  if (!name) return name;
  const n = name.trim();
  const lower = n.toLowerCase();

  // Common overrides
  const overrides: Record<string, string> = {
    petr: 'Petře', tomáš: 'Tomáši', jan: 'Jane', jana: 'Jano',
    martin: 'Martine', lukáš: 'Lukáši', ondřej: 'Ondřeji',
    jakub: 'Jakube', david: 'Davide', michal: 'Michale',
    milan: 'Milane', pavel: 'Pavle', jiří: 'Jiří', josef: 'Josefe',
    václav: 'Václave', robert: 'Roberte', filip: 'Filipe',
    adam: 'Adame', daniel: 'Daniele', radek: 'Radku',
    marek: 'Marku', miroslav: 'Mirku', stanislav: 'Stanislave',
    anna: 'Anno', marie: 'Marie', petra: 'Petro', lucie: 'Lucie',
    eva: 'Evo', tereza: 'Terezo', kateřina: 'Kateřino',
    monika: 'Moniko', veronika: 'Veroniko', lenka: 'Lenko',
    martina: 'Martino', zuzana: 'Zuzano', alena: 'Aleno',
  };
  if (overrides[lower]) return overrides[lower];

  // Rules for masculine names
  if (lower.endsWith('ek') || lower.endsWith('ík')) {
    return n.slice(0, -2) + (lower.endsWith('ek') ? 'ku' : 'íku');
  }
  if (lower.endsWith('el')) return n.slice(0, -2) + 'le';
  if (lower.endsWith('al') || lower.endsWith('il') || lower.endsWith('ul')) {
    return n + 'e';
  }
  if (lower.endsWith('n') || lower.endsWith('r') || lower.endsWith('t') || lower.endsWith('d') || lower.endsWith('s')) {
    return n + 'e';
  }
  if (lower.endsWith('k') || lower.endsWith('h') || lower.endsWith('g') || lower.endsWith('ch')) {
    return n + 'u';
  }

  // Feminine: -a → -o, -e stays
  if (lower.endsWith('a')) return n.slice(0, -1) + 'o';
  if (lower.endsWith('e') || lower.endsWith('ie')) return n;

  return n;
}
