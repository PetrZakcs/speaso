import type { SupportedLang } from '../lib/locale';

export interface CallTurn {
  id: string;
  callerPrompt: Record<SupportedLang, string>;
  prepSeconds: number;
  suggestedResponse: Record<SupportedLang, string>;
  clinicalTip: Record<SupportedLang, string>;
}

export interface CallScenario {
  id: string;
  callerName: Record<SupportedLang, string>;
  callerRole: Record<SupportedLang, string>;
  callerNumber: string;
  category: string;
  difficulty: 1 | 2 | 3;
  clinicalFocus: Record<SupportedLang, string>;
  turns: CallTurn[];
}

export const CALL_SCENARIOS: CallScenario[] = [
  {
    id: 'doctor',
    callerName: {
      cs: 'Ordinace MUDr. Dvořáková',
      en: 'Dr. Miller Family Practice',
    },
    callerRole: {
      cs: 'Zdravotní sestra',
      en: 'Medical Receptionist',
    },
    callerNumber: '+420 224 961 111',
    category: 'health',
    difficulty: 2,
    clinicalFocus: {
      cs: 'Měkký začátek na "Dobrý den", uvolnění čelisti při sdělení jména a data narození.',
      en: 'Soft onset on greeting, relaxed jaw when stating full name and birth date.',
    },
    turns: [
      {
        id: 'turn_1',
        callerPrompt: {
          cs: 'Dobrý den, ordinace doktorky Dvořákové, sestřička u telefonu, jak vám mohu pomoci?',
          en: 'Hello, Dr. Miller practice, nurse speaking, how can I help you today?',
        },
        prepSeconds: 3,
        suggestedResponse: {
          cs: 'Dobrý den, rád bych se prosím objednal na preventivní kontrolu.',
          en: 'Hello, I would like to schedule a routine check-up, please.',
        },
        clinicalTip: {
          cs: 'Před "Dobrý den" udělej fyziologický nádech do břicha a hlásku "D" nasaď jemně bez křeče.',
          en: 'Take a calm belly breath before "Hello" and glide into the sound smoothly.',
        },
      },
      {
        id: 'turn_2',
        callerPrompt: {
          cs: 'Rozumím. Na jaké to bude jméno a jaké je vaše datum narození?',
          en: 'Understood. What is your full name and date of birth?',
        },
        prepSeconds: 3,
        suggestedResponse: {
          cs: 'Moje jméno je {name} a narodil jsem se patnáctého března.',
          en: 'My name is {name} and my date of birth is March fifteenth.',
        },
        clinicalTip: {
          cs: 'Před vlastním jménem vydechni lehký proud vzduchu (vzdechový nástup). Nikam nespěchej.',
          en: 'Exhale a gentle breath before your name. You have all the time in the world.',
        },
      },
      {
        id: 'turn_3',
        callerPrompt: {
          cs: 'Mám volný termín příští úterý v deset hodin dopoledne. Vyhovuje vám to?',
          en: 'I have an opening next Tuesday at ten in the morning. Does that work for you?',
        },
        prepSeconds: 3,
        suggestedResponse: {
          cs: 'Ano, příští úterý v deset hodin mi to skvěle vyhovuje. Děkuji vám.',
          en: 'Yes, next Tuesday at ten works great for me. Thank you.',
        },
        clinicalTip: {
          cs: 'Vnímej uvolněnou čelist a měkký výdech při samohlásce "A".',
          en: 'Keep your jaw relaxed and let out a gentle sigh on "Yes".',
        },
      },
      {
        id: 'turn_4',
        callerPrompt: {
          cs: 'Výborně, píšu si vás. Budeme se těšit, na shledanou.',
          en: 'Excellent, you are all set. Have a wonderful day, goodbye.',
        },
        prepSeconds: 2,
        suggestedResponse: {
          cs: 'Děkuji vám za ochotu, hezký den a na shledanou.',
          en: 'Thank you for your help, have a great day, goodbye.',
        },
        clinicalTip: {
          cs: 'Klidné zakončení hovoru bez spěchu s úsměvem pro uvolnění lícních svalů.',
          en: 'Finish calm and unhurried with a slight smile to relax facial muscles.',
        },
      },
    ],
  },
  {
    id: 'pizza',
    callerName: {
      cs: 'Pizzerie Venezia',
      en: 'Venezia Pizza & Pasta',
    },
    callerRole: {
      cs: 'Dispečer rozvozu',
      en: 'Delivery Dispatcher',
    },
    callerNumber: '+420 777 555 123',
    category: 'food',
    difficulty: 1,
    clinicalFocus: {
      cs: 'Plynulá objednávka jídla, sdělení adresy a způsobu platby v klidném tempu.',
      en: 'Smooth food order, delivering address and payment method at a calm pace.',
    },
    turns: [
      {
        id: 'turn_1',
        callerPrompt: {
          cs: 'Pizzerie Venezia, dobrý den, jakou pizzu vám dnes upečeme?',
          en: 'Venezia Pizza, hello, what pizza can we make for you today?',
        },
        prepSeconds: 3,
        suggestedResponse: {
          cs: 'Dobrý den, rád bych si prosím objednal jednu pizzu Margherita a jednu Prosciutto.',
          en: 'Hello, I would like to order one Margherita pizza and one Prosciutto, please.',
        },
        clinicalTip: {
          cs: 'Před začátkem věty se zhluboka nadechni a rozděl větu na dva dechové celky.',
          en: 'Take a deep diaphragmatic breath and split the order into two breath chunks.',
        },
      },
      {
        id: 'turn_2',
        callerPrompt: {
          cs: 'Skvělá volba. Na jakou adresu to budeme doručovat a jaké je vaše telefonní číslo?',
          en: 'Great choice. What is the delivery address and contact phone number?',
        },
        prepSeconds: 3,
        suggestedResponse: {
          cs: 'Adresa je Lipová dvanáct, druhé patro. Telefon je stejný, ze kterého volám.',
          en: 'The address is 12 Maple Street, apartment 4. The phone number is the one I am calling from.',
        },
        clinicalTip: {
          cs: 'U čísel si dopřej klidnou mikropauzu před každou číslovkou.',
          en: 'Take a deliberate micro-pause before reciting numbers.',
        },
      },
      {
        id: 'turn_3',
        callerPrompt: {
          cs: 'Perfektní. Kurýr bude u vás do třiceti minut. Platba kartou nebo hotově?',
          en: 'Perfect. The courier will arrive in thirty minutes. Card or cash?',
        },
        prepSeconds: 2,
        suggestedResponse: {
          cs: 'Platba bude kartou při převzetí. Děkuji a mějte se hezky.',
          en: 'I will pay by card upon delivery. Thank you and have a nice day.',
        },
        clinicalTip: {
          cs: 'Slovo "Platba" začni měkkým artikulačním kontaktem rtů bez silného stlačení.',
          en: 'Keep lip contact soft when pronouncing the initial "P".',
        },
      },
    ],
  },
  {
    id: 'interview',
    callerName: {
      cs: 'HR Recruit Talent',
      en: 'Talent Acquisition Team',
    },
    callerRole: {
      cs: 'Personální manažerka',
      en: 'HR Manager',
    },
    callerNumber: '+420 220 100 200',
    category: 'work',
    difficulty: 3,
    clinicalFocus: {
      cs: 'Profesionální sebevědomí, kontrolované tempo 110–130 WPM pod sociálním tlakem.',
      en: 'Professional confidence, controlled cadence 110–130 WPM under social pressure.',
    },
    turns: [
      {
        id: 'turn_1',
        callerPrompt: {
          cs: 'Dobrý den, tady Nováková z personálního oddělení. Volám ohledně vaší přihlášky na pracovní pozici. Máte chvilku?',
          en: 'Hello, this is Ms. Taylor from HR. I am calling regarding your job application. Do you have a moment?',
        },
        prepSeconds: 3,
        suggestedResponse: {
          cs: 'Dobrý den, paní Nováková, ano, velice rád si s vámi popovídám.',
          en: 'Hello, Ms. Taylor, yes, I would be very happy to speak with you.',
        },
        clinicalTip: {
          cs: 'Pozdrav vyřkni pomalu a uvolněně. Dej protistraně najevo, že nespěcháš.',
          en: 'Greet slowly and steadily. Setting a calm pace from the start anchors the conversation.',
        },
      },
      {
        id: 'turn_2',
        callerPrompt: {
          cs: 'Výborně. Mohl byste mi v jedné nebo dvou větách shrnout, proč vás tato pozice zaujala?',
          en: 'Great. Could you briefly share in a sentence or two what caught your interest about this role?',
        },
        prepSeconds: 4,
        suggestedResponse: {
          cs: 'Tato pozice mě zaujala svým zaměřením na týmové projekty a možností profesního růstu.',
          en: 'I was drawn to this position by its emphasis on team collaboration and growth opportunities.',
        },
        clinicalTip: {
          cs: 'Před odpovědí si dopřej 2 vteřiny ticha na nádech. Ticho působí profesionálně a uvolní krk.',
          en: 'Allow a 2-second pause to breathe before answering. Silence sounds thoughtful and releases tension.',
        },
      },
      {
        id: 'turn_3',
        callerPrompt: {
          cs: 'To zní skvěle. Příští týden bychom rádi uspořádali osobní pohovor. Které dny by se vám hodily?',
          en: 'That sounds wonderful. We would love to invite you for an interview next week. Which days suit you best?',
        },
        prepSeconds: 3,
        suggestedResponse: {
          cs: 'V průběhu příštího týdne mám volno ve středu a ve čtvrtek odpoledne.',
          en: 'Next week I am fully available on Wednesday and Thursday afternoon.',
        },
        clinicalTip: {
          cs: 'Drž tempo v zelené zóně (100–130 WPM). Pomalá řeč zní jistě a klidně.',
          en: 'Keep your pace in the green zone (100–130 WPM). Steady cadence conveys authority.',
        },
      },
    ],
  },
];

export function getCallScenario(id: string): CallScenario | undefined {
  return CALL_SCENARIOS.find((s) => s.id === id);
}

export function formatTurnResponse(
  rawResponse: string,
  userName: string | undefined,
  lang: SupportedLang,
): string {
  const defaultName = lang === 'cs' ? 'Petr' : 'Alex';
  const nameToUse = userName?.trim() || defaultName;
  return rawResponse.replace(/\{name\}/g, nameToUse);
}
