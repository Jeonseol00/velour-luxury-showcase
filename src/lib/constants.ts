// VELOUR — Product Data, Testimonials, Oracle Questions

export const PRODUCTS = [
  {
    id: 'nocturne-absolute',
    name: 'Nocturne Absolute',
    family: 'Oriental Woody',
    price: '$285',
    image: '/images/perfume-nocturne.png',
    description: 'A velvet darkness woven from aged oud, black amber, and smoky incense. For those who own the night.',
    notes: {
      top: ['Bergamot', 'Black Pepper', 'Saffron'],
      heart: ['Oud', 'Rose Absolute', 'Incense'],
      base: ['Amber', 'Musk', 'Sandalwood'],
    },
  },
  {
    id: 'velvet-dusk',
    name: 'Velvet Dusk',
    family: 'Floral Amber',
    price: '$245',
    image: '/images/perfume-velvet.png',
    description: 'The tender hour between day and dream. Powdered iris meets warm vanilla on a bed of suede.',
    notes: {
      top: ['Pink Pepper', 'Pear', 'Mandarin'],
      heart: ['Iris', 'Jasmine', 'Violet'],
      base: ['Vanilla', 'Suede', 'Tonka Bean'],
    },
  },
  {
    id: 'ember-iris',
    name: 'Ember & Iris',
    family: 'Citrus Leather',
    price: '$265',
    image: '/images/perfume-ember.png',
    description: 'Sun-scorched earth after summer rain. Bright citrus ignites over smoked leather and vetiver.',
    notes: {
      top: ['Yuzu', 'Grapefruit', 'Cardamom'],
      heart: ['Leather', 'Iris', 'Geranium'],
      base: ['Vetiver', 'Cedarwood', 'Moss'],
    },
  },
] as const;

export const TESTIMONIALS = [
  {
    text: "I've worn Nocturne Absolute every evening for three months. Strangers stop me in elevators to ask what I'm wearing. It's intoxicating without trying.",
    author: 'Isabelle M.',
    role: 'Creative Director, Paris',
    stars: 5,
  },
  {
    text: "Velvet Dusk is the closest a fragrance has come to capturing the feeling of being held. It's soft, intimate, and utterly unforgettable.",
    author: 'Alexander K.',
    role: 'Architect, Copenhagen',
    stars: 5,
  },
  {
    text: "Ember & Iris broke every rule I had about perfume. It's masculine and feminine simultaneously — a contradiction that makes perfect sense on skin.",
    author: 'Mei-Lin C.',
    role: 'Photographer, Tokyo',
    stars: 5,
  },
  {
    text: "The sillage of Nocturne Absolute is remarkable. Two sprays last from morning meetings to midnight dinners. This is what luxury should be.",
    author: 'James W.',
    role: 'Editor-in-Chief, London',
    stars: 5,
  },
  {
    text: "VELOUR understands that perfume is memory made wearable. Velvet Dusk takes me to a Tuscan garden at twilight every time I wear it.",
    author: 'Sofia R.',
    role: 'Curator, Milan',
    stars: 5,
  },
  {
    text: "I've spent years searching for a signature scent. Ember & Iris ended that search in a single breath. Raw, refined, and entirely its own.",
    author: 'Darius N.',
    role: 'Film Director, Los Angeles',
    stars: 5,
  },
];

export const ORACLE_QUESTIONS = [
  {
    question: 'What time of day feels most like you?',
    options: [
      { label: 'Golden hour — warm, radiant, fleeting', value: 'warm' },
      { label: 'Midnight — deep, mysterious, alive', value: 'dark' },
      { label: 'Early morning — fresh, quiet, clear', value: 'fresh' },
      { label: 'Twilight — soft, contemplative, romantic', value: 'soft' },
    ],
  },
  {
    question: 'Choose a texture that speaks to your soul.',
    options: [
      { label: 'Worn leather and old books', value: 'leather' },
      { label: 'Silk against bare skin', value: 'silk' },
      { label: 'Cool marble in a sunlit room', value: 'marble' },
      { label: 'Crushed velvet in candlelight', value: 'velvet' },
    ],
  },
  {
    question: 'Where would you disappear to for a month?',
    options: [
      { label: 'A hidden temple in Kyoto', value: 'east' },
      { label: 'A stone villa on the Amalfi Coast', value: 'mediterranean' },
      { label: 'A cabin in the Norwegian fjords', value: 'nordic' },
      { label: 'A riad in the Marrakech medina', value: 'exotic' },
    ],
  },
  {
    question: 'What do people notice about you first?',
    options: [
      { label: 'My intensity — I fill a room without trying', value: 'intense' },
      { label: 'My elegance — understated but unmistakable', value: 'elegant' },
      { label: 'My energy — magnetic and unpredictable', value: 'energy' },
      { label: 'My warmth — inviting and genuine', value: 'warm_persona' },
    ],
  },
  {
    question: 'Pick a closing note for your evening.',
    options: [
      { label: 'Smoky whiskey by a dying fire', value: 'smoky' },
      { label: 'Jasmine drifting through an open window', value: 'floral' },
      { label: 'Rain on sun-warmed stone', value: 'earthy' },
      { label: 'Vanilla and candlewax', value: 'sweet' },
    ],
  },
];

// Decision tree fallback — maps answer patterns to products
export function getOracleResult(answers: string[]): typeof PRODUCTS[number] {
  let scores = { nocturne: 0, velvet: 0, ember: 0 };

  const nocturneSignals = ['dark', 'leather', 'exotic', 'intense', 'smoky'];
  const velvetSignals = ['soft', 'silk', 'velvet', 'mediterranean', 'elegant', 'warm_persona', 'floral', 'sweet'];
  const emberSignals = ['warm', 'fresh', 'marble', 'east', 'nordic', 'energy', 'earthy'];

  for (const answer of answers) {
    if (nocturneSignals.includes(answer)) scores.nocturne++;
    if (velvetSignals.includes(answer)) scores.velvet++;
    if (emberSignals.includes(answer)) scores.ember++;
  }

  const max = Math.max(scores.nocturne, scores.velvet, scores.ember);
  if (scores.nocturne === max) return PRODUCTS[0];
  if (scores.velvet === max) return PRODUCTS[1];
  return PRODUCTS[2];
}

export const RESULT_DESCRIPTIONS: Record<string, string> = {
  'nocturne-absolute': 'You carry the weight of midnight without bending. Nocturne Absolute mirrors your depth — a fragrance for those who lead with presence and leave with mystery. Oud and black amber will trace your silhouette long after you\'ve left the room.',
  'velvet-dusk': 'You exist in the tender space between strength and softness. Velvet Dusk was composed for souls like yours — intimate, layered, and impossible to forget. Iris and warm vanilla will become your second skin.',
  'ember-iris': 'You are contradiction made beautiful — grounded yet electric, familiar yet surprising. Ember & Iris captures that duality. Sun-warmed citrus and smoked leather will announce you before you speak.',
};
