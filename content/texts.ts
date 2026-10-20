import type { SupportedLang } from '../lib/locale';
import type { AgeGroup } from '../state/store';

/**
 * Original reading texts for read-aloud practice.
 * Level 1 = short, simple sentences · 2 = everyday prose · 3 = longer
 * sentences and harder consonant clusters.
 */
export interface ReadingText {
  id: string;
  level: 1 | 2 | 3;
  audience: 'general' | 'child';
  title: Record<SupportedLang, string>;
  body: Record<SupportedLang, string>;
}

export const TEXTS: ReadingText[] = [
  {
    id: 'morning',
    level: 1,
    audience: 'general',
    title: { cs: 'Ráno', en: 'Morning' },
    body: {
      cs: 'Je ráno. Otevřu okno a nadechnu se. Venku je klid. Uvařím si čaj a sednu si ke stolu. Nikam nespěchám. Den teprve začíná.',
      en: 'It is morning. I open the window and take a breath. It is quiet outside. I make some tea and sit down at the table. I am in no hurry. The day is just beginning.',
    },
  },
  {
    id: 'park',
    level: 1,
    audience: 'general',
    title: { cs: 'V parku', en: 'In the park' },
    body: {
      cs: 'V parku je hodně lidí. Někdo běží, někdo čte knihu. Pes nese klacek. Na lavičce sedí paní a krmí ptáky. Slunce svítí a fouká lehký vítr.',
      en: 'There are many people in the park. Someone is running, someone is reading a book. A dog carries a stick. A woman sits on a bench feeding the birds. The sun is shining and a light wind is blowing.',
    },
  },
  {
    id: 'shopping',
    level: 1,
    audience: 'general',
    title: { cs: 'Nákup', en: 'Shopping' },
    body: {
      cs: 'Dnes jdu nakoupit. Potřebuji chleba, mléko a jablka. V obchodě si vezmu košík. U pokladny pozdravím a zaplatím. Pak jdu pomalu domů.',
      en: 'Today I am going shopping. I need bread, milk and apples. In the shop I take a basket. At the checkout I say hello and pay. Then I walk home slowly.',
    },
  },
  {
    id: 'train',
    level: 2,
    audience: 'general',
    title: { cs: 'Cesta vlakem', en: 'A train journey' },
    body: {
      cs: 'Vlak se pomalu rozjel a za oknem začala ubíhat krajina. Pole, lesy a malé vesnice se střídaly jako obrázky v knize. Průvodčí prošel vagonem a zkontroloval jízdenky. Vytáhl jsem sešit a začal psát, co všechno chci v novém městě vidět.',
      en: 'The train slowly pulled away and the countryside began to slide past the window. Fields, forests and small villages changed like pictures in a book. The conductor walked through the carriage checking tickets. I took out a notebook and started writing down everything I wanted to see in the new city.',
    },
  },
  {
    id: 'cooking',
    level: 2,
    audience: 'general',
    title: { cs: 'Večeře pro přátele', en: 'Dinner for friends' },
    body: {
      cs: 'V sobotu večer přijdou přátelé na večeři. Ráno jsem napsal seznam a odpoledne nakoupil zeleninu, těstoviny a čerstvé bylinky. Při vaření si pouštím hudbu a nikam nespěchám. Nejvíc se těším na chvíli, kdy všichni sedneme ke stolu a začneme si povídat.',
      en: 'On Saturday evening my friends are coming over for dinner. In the morning I wrote a list and in the afternoon I bought vegetables, pasta and fresh herbs. I put on some music while I cook and take my time. What I look forward to most is the moment we all sit down at the table and start talking.',
    },
  },
  {
    id: 'weather',
    level: 2,
    audience: 'general',
    title: { cs: 'Předpověď počasí', en: 'Weather forecast' },
    body: {
      cs: 'Zítra bude převážně oblačno, odpoledne se místy objeví přeháňky. Teploty vystoupají na patnáct až osmnáct stupňů. Vítr bude slabý, na horách mírný. O víkendu se oteplí a vrátí se slunečné počasí.',
      en: 'Tomorrow will be mostly cloudy, with scattered showers in the afternoon. Temperatures will rise to between fifteen and eighteen degrees. The wind will be light, moderate in the mountains. Over the weekend it will get warmer and sunny weather will return.',
    },
  },
  {
    id: 'lighthouse',
    level: 3,
    audience: 'general',
    title: { cs: 'Maják', en: 'The lighthouse' },
    body: {
      cs: 'Na skalnatém výběžku, kde se střetávají proudy dvou moří, stojí starý maják. Jeho strážce každý večer vystoupá po sto čtyřiceti schodech, aby zkontroloval světlo, které po desetiletí provádí lodě nebezpečnými mělčinami. Přestože dnes většinu práce zastanou přístroje, strážce tvrdí, že žádný stroj nedokáže vycítit, kdy se blíží bouře.',
      en: 'On a rocky headland where the currents of two seas collide stands an old lighthouse. Every evening its keeper climbs one hundred and forty steps to check the light that has guided ships through treacherous shallows for decades. Although instruments now do most of the work, the keeper insists that no machine can sense when a storm is approaching.',
    },
  },
  {
    id: 'science',
    level: 3,
    audience: 'general',
    title: { cs: 'Jak funguje paměť', en: 'How memory works' },
    body: {
      cs: 'Vědci zjistili, že paměť není jako šuplík, do kterého ukládáme hotové vzpomínky. Pokaždé, když si na něco vzpomeneme, mozek ji znovu skládá z jednotlivých střípků. Proto se vzpomínky v průběhu let proměňují a dva lidé si tutéž událost mohou pamatovat překvapivě odlišně.',
      en: 'Scientists have discovered that memory is not like a drawer where we store finished memories. Every time we remember something, the brain reassembles it from individual fragments. That is why memories change over the years, and two people can remember the same event in surprisingly different ways.',
    },
  },
  {
    id: 'interview',
    level: 3,
    audience: 'general',
    title: { cs: 'Představení', en: 'Introducing myself' },
    body: {
      cs: 'Dobrý den, děkuji za pozvání. Poslední tři roky pracuji jako koordinátor projektů ve střední firmě. Mám na starosti plánování, komunikaci s dodavateli a rozpočty. Nejvíc mě baví, když se podaří propojit lidi z různých oddělení a společně dotáhneme projekt do konce.',
      en: 'Good afternoon, thank you for inviting me. For the past three years I have worked as a project coordinator at a mid-sized company. I am responsible for planning, supplier communication and budgets. What I enjoy most is bringing together people from different departments and seeing a project through to the end together.',
    },
  },
  {
    id: 'kid_cat',
    level: 1,
    audience: 'child',
    title: { cs: 'Kočka Micka', en: 'Molly the cat' },
    body: {
      cs: 'Micka je malá kočka. Má bílé tlapky a dlouhý ocas. Ráda spí na okně. Když svítí sluníčko, Micka přede. Mňau!',
      en: 'Molly is a little cat. She has white paws and a long tail. She likes to sleep on the windowsill. When the sun shines, Molly purrs. Meow!',
    },
  },
  {
    id: 'kid_rocket',
    level: 2,
    audience: 'child',
    title: { cs: 'Raketa', en: 'The rocket' },
    body: {
      cs: 'Tomáš postavil z krabice raketu. Namaloval na ni hvězdy a okýnko. Pak si sedl dovnitř a začal odpočítávat: deset, devět, osm… Když řekl nula, zavřel oči a představil si, že letí až k Měsíci.',
      en: 'Tom built a rocket out of a box. He painted stars and a little window on it. Then he sat inside and started counting down: ten, nine, eight… When he said zero, he closed his eyes and imagined flying all the way to the Moon.',
    },
  },
  {
    id: 'kid_forest',
    level: 3,
    audience: 'child',
    title: { cs: 'Výlet do lesa', en: 'A trip to the forest' },
    body: {
      cs: 'O prázdninách jsme s dědou vyrazili do lesa. Děda mi ukázal stopy srnky a vysvětlil, jak poznat, kterým směrem běžela. U potoka jsme postavili malou přehradu z kamenů a sledovali, jak voda hledá cestu kolem. Domů jsme se vrátili unavení, ale šťastní.',
      en: 'During the holidays Grandpa and I set off for the forest. Grandpa showed me deer tracks and explained how to tell which way the deer had run. By the stream we built a little dam out of stones and watched the water find its way around it. We came home tired but happy.',
    },
  },
  {
    id: 'architecture',
    level: 1,
    audience: 'general',
    title: { cs: 'Staré město', en: 'The Old Town' },
    body: {
      cs: 'Procházím úzkými uličkami starého města. Domy mají barevné fasády a vysoká okna. V dálce slyším zvonit kostelní zvon. Vzduch voní čerstvou kávou z malé pekárny. Každý krok mě vede k tichému náměstíčku.',
      en: 'I walk through the narrow streets of the old town. The houses have colourful facades and tall windows. In the distance I hear church bells ringing. The air smells of fresh coffee from a small bakery. Every step leads me toward a quiet little square.',
    },
  },
  {
    id: 'nature_lake',
    level: 1,
    audience: 'general',
    title: { cs: 'U jezera', en: 'By the lake' },
    body: {
      cs: 'Hladina jezera je klidná a čistá jako zrcadlo. Na břehu roste vysoké rákosí. Dvě divoké kachny pomalu plují ke stínu staré vrby. Sedím v trávě a pozoruji, jak se vlnky jemně dotýkají kamenů.',
      en: 'The lake surface is still and clear as a mirror. Tall reeds grow along the shore. Two wild ducks slowly swim toward the shade of an old willow. I sit in the grass watching ripples gently touch the stones.',
    },
  },
  {
    id: 'travel_mountains',
    level: 2,
    audience: 'general',
    title: { cs: 'Horský výstup', en: 'Mountain climb' },
    body: {
      cs: 'Cesta na vrchol vedla strmým smrkovým lesem. Zastavovali jsme se na každé vyhlídce, abychom popadli dech a napili se pramenité vody. Kolem poledne stromy ustoupily a před námi se otevřel pohled na celé údolí. Mlha se pomalu rozpouštěla a odhalovala ostré skalní hřebeny.',
      en: 'The trail to the peak led through a steep spruce forest. We stopped at every viewpoint to catch our breath and drink fresh spring water. Around noon the trees gave way and the whole valley opened up before us. The mist was slowly lifting, unveiling sharp rocky ridges.',
    },
  },
  {
    id: 'work_presentation',
    level: 2,
    audience: 'general',
    title: { cs: 'Týmová porada', en: 'Team meeting' },
    body: {
      cs: 'V konferenční místnosti vládla příjemná atmosféra. Před zahájením prezentace jsem se zhluboka nadechl a položil ruce na stůl. Představil jsem výsledky našeho čtvrtletního projektu a zodpověděl dotazy kolegů. Když člověk mluví pomalu a s rozmyslem, ostatní mu přirozeně naslouchají.',
      en: 'There was a pleasant atmosphere in the conference room. Before starting the presentation I took a deep breath and rested my hands on the table. I presented the results of our quarterly project and answered questions from colleagues. When you speak slowly and deliberately, people naturally listen.',
    },
  },
  {
    id: 'science_neuroplasticity',
    level: 3,
    audience: 'general',
    title: { cs: 'Síla neuroplasticity', en: 'The power of neuroplasticity' },
    body: {
      cs: 'Moderní neurologie potvrzuje, že lidský mozek si uchovává schopnost vytvářet nová nervová spojení po celý život. Když opakovaně trénujeme nový způsob dýchání a uvolňování mluvidel, mozek postupně přepisuje staré vzorce napětí. Pravidelný každodenní trénink posiluje dráhy plynulosti a proměňuje vědomé úsilí v přirozený, automatický návyk.',
      en: 'Modern neurology confirms that the human brain retains the ability to form new neural pathways throughout life. When we repeatedly practice a new way of breathing and vocal cord relaxation, the brain gradually rewrites old tension habits. Daily consistent practice strengthens fluency pathways, turning conscious effort into a natural, automatic habit.',
    },
  },
  {
    id: 'kid_dragon',
    level: 2,
    audience: 'child',
    title: { cs: 'Drak Vendelín', en: 'Oliver the dragon' },
    body: {
      cs: 'V jeskyni za lesem bydlel drak Vendelín. Na rozdíl od ostatních draků nechrlil oheň, ale kouzelné mýdlové bubliny. Každé ráno se posadil na palouček, zhluboka vydechl a vyfoukl obrovskou duhovou bublinu. Zvířátka z lesa k němu chodila na návštěvu a radostně skákala za bublinami.',
      en: 'In a cave behind the forest lived Oliver the dragon. Unlike other dragons he did not breathe fire, but magical soap bubbles. Every morning he sat in a meadow, took a deep breath out, and blew a giant rainbow bubble. The forest animals came to visit him and joyfully leaped after the bubbles.',
    },
  },
];

/** Texts suitable for the user, children get the child set. */
export function textsFor(ageGroup: AgeGroup | null, level: 1 | 2 | 3): ReadingText[] {
  const audience = ageGroup === 'child' ? 'child' : 'general';
  const matches = TEXTS.filter((x) => x.audience === audience && x.level === level);
  return matches.length > 0 ? matches : TEXTS.filter((x) => x.level === level);
}
