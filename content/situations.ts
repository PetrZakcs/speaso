import type { SupportedLang } from '../lib/locale';
import type { TintName } from '../theme/tokens';

/**
 * Guided real-life scenarios: prepare → rehearse phrases out loud
 * (optionally recorded) → a small real-world challenge → reflection.
 * Self-guided — there is no AI conversation partner.
 */
export type SituationId = 'introduction' | 'phone' | 'shop' | 'presentation' | 'meeting' | 'interview';

interface SituationContent {
  title: string;
  sub: string;
  prep: string[];
  phrases: string[];
  challenge: string;
}

export interface Situation {
  id: SituationId;
  /** Ionicons name. */
  icon: string;
  tint: TintName;
  difficulty: 'easy' | 'medium' | 'hard';
  premium: boolean;
  minutes: number;
  content: Record<SupportedLang, SituationContent>;
}

export const SITUATIONS: Situation[] = [
  {
    id: 'introduction',
    icon: 'person-outline',
    tint: 'lavender',
    difficulty: 'easy',
    premium: false,
    minutes: 5,
    content: {
      cs: {
        title: 'Představení se jménem',
        sub: 'Říct své jméno v klidu',
        prep: [
          'Jméno nemá žádná synonyma — proto na něm cítíme největší tlak. Je to úplně normální.',
          'Před vyslovením jména jemně vydechni trochu vzduchu (měkké hlasové nasazení).',
          'První hlásku nesaď silou. Představ si, že po ní sklouzneš jako po másle.',
          'Můžeš jméno uvést klidným spojením: „Ahoj, já jsem...“ nebo „Těší mě, ...“',
        ],
        phrases: [
          'Dobrý den, těší mě, já jsem {name}.',
          'Ahoj, jmenuji se {name}.',
          'Dobrý den, tady {name}.',
          'Rád vás poznávám, já jsem {name}.',
          'Ahoj všem, já jsem {name} a těším se na spolupráci.',
        ],
        challenge: 'Při příštím setkání řekni své jméno vědomě s lehkým výdechem na začátku bez spěchu.',
      },
      en: {
        title: 'Saying your name',
        sub: 'Introducing yourself calmly',
        prep: [
          'Your name has no synonyms — that is why it carries the most pressure. That is completely normal.',
          'Before saying your name, let out a tiny breath of air first (soft vocal onset).',
          'Do not push into the first sound. Glide into it gently.',
          'You can anchor it with a relaxed opener: "Hi, I am..." or "Nice to meet you, ..."',
        ],
        phrases: [
          'Hello, nice to meet you, I am {name}.',
          'Hi there, my name is {name}.',
          'Good morning, this is {name} speaking.',
          'Pleased to meet you, I am {name}.',
          'Hi everyone, I am {name} and I look forward to working together.',
        ],
        challenge: 'Next time you introduce yourself, take an easy outbreath first and glide into your name with zero rush.',
      },
    },
  },
  {
    id: 'shop',
    icon: 'bag-handle-outline',
    tint: 'sage',
    difficulty: 'easy',
    premium: false,
    minutes: 6,
    content: {
      cs: {
        title: 'V obchodě',
        sub: 'Zeptat se na zboží',
        prep: [
          'Představ si konkrétní obchod, kam chodíš.',
          'Rozmysli si, na co se chceš zeptat — stačí jedna věc.',
          'Tři klidné nádechy do břicha. Výdech pomalu ústy.',
          'Pamatuj: prodavač tam je od toho, aby ti pomohl. Máš čas.',
        ],
        phrases: [
          'Dobrý den, prosím vás, máte tady ovesné vločky?',
          'Děkuji. A kde je najdu?',
          'Prosím vás, je možné zaplatit kartou?',
          'A ještě jednu tašku, prosím.',
          'Děkuji, na shledanou.',
        ],
        challenge: 'Při příštím nákupu se zeptej prodavače alespoň na jednu věc, i když ji umíš najít sám/sama.',
      },
      en: {
        title: 'In a shop',
        sub: 'Asking about an item',
        prep: [
          'Picture a specific shop you go to.',
          'Decide what you want to ask about — one thing is enough.',
          'Take three calm belly breaths. Breathe out slowly through your mouth.',
          'Remember: the shop assistant is there to help you. You have time.',
        ],
        phrases: [
          'Hello, excuse me, do you have any oats?',
          'Thank you. Where can I find them?',
          'Excuse me, can I pay by card?',
          'I would also like a bag, please.',
          'Thanks, goodbye.',
        ],
        challenge: 'Next time you go shopping, ask the assistant about at least one thing — even if you could find it yourself.',
      },
    },
  },
  {
    id: 'phone',
    icon: 'call-outline',
    tint: 'peach',
    difficulty: 'medium',
    premium: false,
    minutes: 8,
    content: {
      cs: {
        title: 'Telefonát',
        sub: 'Objednat se k lékaři',
        prep: [
          'Napiš si na papír, co potřebuješ: jméno, důvod, kdy můžeš.',
          'Telefonát nemusí být plynulý. Stačí, když se domluvíš.',
          'Před vytočením se dvakrát pomalu nadechni.',
          'Když se zasekneš, je v pořádku říct: „Moment, prosím.“',
        ],
        phrases: [
          'Dobrý den, tady Nováková. Potřebuji se objednat na prohlídku.',
          'Jde o preventivní prohlídku, nic akutního.',
          'Hodilo by se mi to v úterý nebo ve čtvrtek dopoledne.',
          'Ve čtvrtek v devět mi to vyhovuje, děkuji.',
          'Můžete mi prosím zopakovat ten čas?',
          'Děkuji, na shledanou.',
        ],
        challenge: 'Tento týden zavolej jednou někam, kam bys normálně napsal/a zprávu nebo e-mail.',
      },
      en: {
        title: 'Phone call',
        sub: "Booking a doctor's appointment",
        prep: [
          'Write down what you need: your name, the reason, when you are free.',
          'The call does not have to be fluent. It just has to get the job done.',
          'Before dialling, take two slow breaths.',
          'If you get stuck, it is fine to say: "One moment, please."',
        ],
        phrases: [
          'Hello, this is Alex Smith. I would like to book a check-up.',
          'It is a routine check-up, nothing urgent.',
          'Tuesday or Thursday morning would suit me best.',
          'Thursday at nine works for me, thank you.',
          'Could you repeat the time, please?',
          'Thank you, goodbye.',
        ],
        challenge: 'This week, make one phone call where you would normally send a message or an email.',
      },
    },
  },
  {
    id: 'meeting',
    icon: 'people-outline',
    tint: 'sky',
    difficulty: 'hard',
    premium: true,
    minutes: 8,
    content: {
      cs: {
        title: 'Pracovní porada',
        sub: 'Říct svůj názor',
        prep: [
          'Vyber si jedno téma, ke kterému chceš na poradě něco říct.',
          'Shrň svůj názor do jedné věty. Kratší je snazší.',
          'Před promluvou se nadechni a začni první slovo jemně.',
          'Pauza během mluvení působí jistě, ne nejistě.',
        ],
        phrases: [
          'Můžu k tomu něco doplnit?',
          'Podle mě by stálo za to vyzkoušet to nejdřív na menším projektu.',
          'Vidím tam jedno riziko: termín je hodně těsný.',
          'Navrhuji, abychom se k tomu vrátili příští týden.',
          'Souhlasím, já si vezmu na starost přípravu podkladů.',
        ],
        challenge: 'Na příští poradě se ozvi alespoň jednou — klidně jen krátkou otázkou.',
      },
      en: {
        title: 'Work meeting',
        sub: 'Voicing your opinion',
        prep: [
          'Pick one topic you want to say something about in the meeting.',
          'Sum up your view in one sentence. Shorter is easier.',
          'Before speaking, breathe in and start the first word gently.',
          'A pause while speaking comes across as confident, not unsure.',
        ],
        phrases: [
          'Can I add something to that?',
          'I think it would be worth trying it on a smaller project first.',
          'I see one risk: the deadline is very tight.',
          'I suggest we come back to this next week.',
          "I agree. I'll take care of preparing the materials.",
        ],
        challenge: 'In your next meeting, speak up at least once — even with just a short question.',
      },
    },
  },
  {
    id: 'presentation',
    icon: 'easel-outline',
    tint: 'lavender',
    difficulty: 'hard',
    premium: true,
    minutes: 10,
    content: {
      cs: {
        title: 'Prezentace',
        sub: 'Mluvit před lidmi',
        prep: [
          'Rozděl prezentaci na tři hlavní body. Víc si pamatovat nemusíš.',
          'Úvodní větu si nacvič nejvíc — zbytek pak jde snáz.',
          'Postav se zpříma, uvolni ramena, dýchej do břicha.',
          'Můžeš publiku klidně říct, že koktáš. Často to uleví oběma stranám.',
        ],
        phrases: [
          'Dobrý den, děkuji, že jste přišli.',
          'Dnes vám představím tři věci, které nám pomohou ušetřit čas.',
          'Začnu tím nejdůležitějším.',
          'Tady vidíte, jak se čísla vyvíjela za poslední rok.',
          'Shrnu to: méně kroků, rychlejší výsledky, spokojenější zákazníci.',
          'Děkuji za pozornost. Máte nějaké otázky?',
        ],
        challenge: 'Odprezentuj úvod nahlas před jedním člověkem, kterému věříš.',
      },
      en: {
        title: 'Presentation',
        sub: 'Speaking in front of people',
        prep: [
          'Split your talk into three main points. You do not need to remember more.',
          'Practise the opening line the most — the rest gets easier after that.',
          'Stand tall, relax your shoulders, breathe into your belly.',
          'You can tell the audience that you stutter. It often relieves both sides.',
        ],
        phrases: [
          'Good morning, thank you for coming.',
          'Today I will show you three things that will save us time.',
          "I'll start with the most important one.",
          'Here you can see how the numbers developed over the past year.',
          'To sum up: fewer steps, faster results, happier customers.',
          'Thank you for your attention. Do you have any questions?',
        ],
        challenge: 'Present your opening out loud to one person you trust.',
      },
    },
  },
  {
    id: 'interview',
    icon: 'briefcase-outline',
    tint: 'butter',
    difficulty: 'hard',
    premium: true,
    minutes: 10,
    content: {
      cs: {
        title: 'Pracovní pohovor',
        sub: 'Představit se a odpovídat',
        prep: [
          'Připrav si krátké představení: kdo jsi, co děláš, co tě baví.',
          'Vyber dvě konkrétní zkušenosti, které chceš zmínit.',
          'Odpovědi nemusí být rychlé. Promyšlené působí lépe.',
          'Na začátku pohovoru můžeš říct: „Koktám, chvíli mi to může trvat.“',
        ],
        phrases: [
          'Dobrý den, jmenuji se Jana Nováková, děkuji za pozvání.',
          'Poslední tři roky pracuji v koordinaci projektů.',
          'Nejvíc mě baví, když se podaří dotáhnout věci do konce.',
          'Mojí silnou stránkou je pečlivost a spolehlivost.',
          'Mohu se zeptat, jak vypadá běžný pracovní den v týmu?',
          'Děkuji za rozhovor, těším se na vaši odpověď.',
        ],
        challenge: 'Nahraj si celé své představení a poslechni si ho. Co se ti na něm líbí?',
      },
      en: {
        title: 'Job interview',
        sub: 'Introducing yourself and answering',
        prep: [
          'Prepare a short introduction: who you are, what you do, what you enjoy.',
          'Pick two concrete experiences you want to mention.',
          'Answers do not have to be fast. Thoughtful comes across better.',
          'At the start you can say: "I stutter, so it may take me a moment."',
        ],
        phrases: [
          'Good morning, my name is Jane Smith, thank you for inviting me.',
          'For the past three years I have worked as a project coordinator.',
          'What I enjoy most is seeing things through to the end.',
          'My strengths are attention to detail and reliability.',
          'May I ask what a typical working day in the team looks like?',
          'Thank you for the conversation, I look forward to hearing from you.',
        ],
        challenge: 'Record your whole introduction and listen back. What do you like about it?',
      },
    },
  },
];

export function getSituation(id: string | undefined): Situation | undefined {
  return SITUATIONS.find((s) => s.id === id);
}

export const FREE_SITUATIONS = SITUATIONS.filter((s) => !s.premium).length;
