import type { SupportedLang } from '../lib/locale';

export interface DailyWisdomItem {
  id: string;
  quote: string;
  author?: string;
  challenge: string;
}

interface RawWisdom {
  id: string;
  cs: { quote: string; author?: string; challenge: string };
  en: { quote: string; author?: string; challenge: string };
}

export const DAILY_WISDOM_COLLECTION: RawWisdom[] = [
  {
    id: 'w1',
    cs: {
      quote: 'Nemusíš mluvit rychle, aby tě ostatní poslouchali. Tvá slova mají váhu bez ohledu na tempo.',
      challenge: 'Při dnešní první objednávce (káva, nákup, lístek) se před první větou v klidu nadechni do břicha.',
    },
    en: {
      quote: "You don't need to speak fast to be heard. Your words have weight regardless of your pace.",
      challenge: 'On your first order today (coffee, groceries, ticket), take a calm belly breath before speaking.',
    },
  },
  {
    id: 'w2',
    cs: {
      quote: 'Každá pauza v řeči dává posluchači prostor lépe vnímat tvou myšlenku.',
      challenge: 'Udělej dnes v jednom rozhovoru vědomou 2sekundovou pauzu před tím, než odpovíš.',
    },
    en: {
      quote: 'Every pause in speech gives the listener space to absorb your thought.',
      challenge: 'Make a deliberate 2-second pause before answering in one conversation today.',
    },
  },
  {
    id: 'w3',
    cs: {
      quote: 'Plynulost nezačíná v ústech, ale v uvolněných ramenech a klidné bránici.',
      challenge: 'Kdykoliv projdeš dveřmi, zkontroluj ramena a nech je volně klesnout dolů.',
    },
    en: {
      quote: 'Fluency does not start in the mouth, but in relaxed shoulders and a calm diaphragm.',
      challenge: 'Whenever you walk through a door today, check your shoulders and let them drop.',
    },
  },
  {
    id: 'w4',
    cs: {
      quote: 'Zásek není selhání. Je to jen signál těla, které si říká o měkčí nádech.',
      challenge: 'Pokud dnes pocítíš zásek, zastav se, vydechni a začni slabiku s měkkým hlasovým začátkem.',
    },
    en: {
      quote: 'A speech block is not failure. It is merely a signal that your body asks for a softer breath.',
      challenge: 'If you feel a block today, stop, breathe out, and restart with a gentle vocal onset.',
    },
  },
  {
    id: 'w5',
    cs: {
      quote: 'Tvoje hodnota jako člověka nijak nesouvisí s tím, jak hladce vyslovíš slovo.',
      challenge: 'Navaž dnes oční kontakt s někým, s kým mluvíš, a usměj se před začátkem věty.',
    },
    en: {
      quote: 'Your worth as a human has zero correlation with how smoothly you pronounce a word.',
      challenge: 'Hold gentle eye contact with someone you speak to today and smile before your sentence.',
    },
  },
  {
    id: 'w6',
    cs: {
      quote: 'Mozek se učí každým klidným opakováním. Trpělivost je nejrychlejší zkratka.',
      challenge: 'Přečti si dnes nahlas 3 věty z jakékoliv knihy v polovičním tempu, než obvykle mluvíš.',
    },
    en: {
      quote: 'The brain learns with every calm repetition. Patience is the fastest shortcut.',
      challenge: 'Read 3 sentences from any book out loud at half your usual speed today.',
    },
  },
  {
    id: 'w7',
    cs: {
      quote: 'Když uvolníš spodní čelist, hlasivky dostanou prostor volně kmitat bez křeče.',
      challenge: 'Zívni si a vnímej pocit uvolněného krku. Přenes tento pocit do další věty.',
    },
    en: {
      quote: 'When you release your lower jaw, your vocal cords gain room to vibrate freely.',
      challenge: 'Yawn and notice the sensation of an open throat. Carry that feeling into your next sentence.',
    },
  },
  {
    id: 'w8',
    cs: {
      quote: 'Nikdo na světě neposlouchá tvé tempo tak přísně, jako ty sám(a).',
      challenge: 'Všimni si dnes, kolik přirozených pauz a zádrhelů dělají v řeči lidé v rádiu nebo kolem tebe.',
    },
    en: {
      quote: 'Nobody in the world evaluates your pace as critically as you do yourself.',
      challenge: 'Notice today how many natural pauses and stumbles people on podcasts or around you make.',
    },
  },
  {
    id: 'w9',
    cs: {
      quote: 'Klidný výdech je lék na strach. Tělo nemůže být v panice, když vydechuje pomalu.',
      challenge: 'Před zvednutím telefonu udělej 1 fyziologický vzdech (dvojitý nádech a dlouhý výdech).',
    },
    en: {
      quote: 'A calm exhale cures anxiety. The body cannot stay in panic while exhaling slowly.',
      challenge: 'Before answering a phone call today, take 1 physiological sigh (double inhale, long exhale).',
    },
  },
  {
    id: 'w10',
    cs: {
      quote: 'Řeč je hudba, ne sprint. Dej každému taktu jeho přirozený prostor.',
      challenge: 'Při mluvení si představuj, že tvůj dech je smyčec, který jemně hladí struny.',
    },
    en: {
      quote: 'Speech is music, not a sprint. Give every measure its natural room.',
      challenge: 'While speaking, imagine your breath as a violin bow gently gliding across strings.',
    },
  },
  {
    id: 'w11',
    cs: {
      quote: 'Odvaha neznamená nemít strach. Odvaha znamená promluvit i s chvěním v hlase.',
      challenge: 'Zeptej se dnes někoho na ulici nebo v práci na jednoduchou otázku („Kolik je hodin?“).',
    },
    en: {
      quote: 'Courage is not the absence of fear. Courage is speaking even with a quiver in your voice.',
      challenge: 'Ask someone on the street or at work a simple question today ("What time is it?").',
    },
  },
  {
    id: 'w12',
    cs: {
      quote: 'Měkký začátek samohlásky chrání hlasivky před tvrdým nárazem.',
      challenge: 'Vyslov slova začínající na A, O, U s lehkým tichým výdechem („h-ano“, „h-opravdu“).',
    },
    en: {
      quote: 'A soft vowel onset protects vocal cords from a hard glottal strike.',
      challenge: 'Pronounce words starting with vowels with a gentle breathy onset ("h-always", "h-open").',
    },
  },
  {
    id: 'w13',
    cs: {
      quote: 'Lidé si nepamatují, zda ses na chvíli zadrhl(a). Pamatují si, jakou energii jsi jim předal(a).',
      challenge: 'Zaměř se dnes na poselství toho, co říkáš, ne na mechaniku slov.',
    },
    en: {
      quote: 'People will not remember if you paused. They remember the warmth and energy you shared.',
      challenge: 'Focus on the message of what you say today, not the mechanics of words.',
    },
  },
  {
    id: 'w14',
    cs: {
      quote: 'Dva týdny vědomého tréninku mění hustotu šedé kůry mozkové v řečových centrech.',
      challenge: 'Pogratuluj si za to, že jsi dnes otevřel(a) aplikaci. Každý krok se sčítá.',
    },
    en: {
      quote: 'Two weeks of mindful training alters neural density in speech motor cortex areas.',
      challenge: 'Congratulate yourself for opening the app today. Every step compounds.',
    },
  },
];

export function getDailyWisdom(dateKey: string, lang: SupportedLang): DailyWisdomItem {
  let hash = 0;
  for (let i = 0; i < dateKey.length; i++) {
    hash = (hash << 5) - hash + dateKey.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % DAILY_WISDOM_COLLECTION.length;
  const item = DAILY_WISDOM_COLLECTION[index];
  const loc = item[lang] ?? item.cs;
  return {
    id: item.id,
    quote: loc.quote,
    author: loc.author,
    challenge: loc.challenge,
  };
}
