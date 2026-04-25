import { atom } from 'nanostores';

export type ScentProfile = {
  name: string;
  description: string;
  family: string;
  notes: string[];
};

export const isAnalyzing = atom<boolean>(false);
export const synesthesiaColor = atom<string>('#d4a574'); // Default amber/gold
export const intensityMultiplier = atom<number>(1.0); // Modifies particle speed & distortion
export const oracleResult = atom<ScentProfile | null>(null);

// Cinematic Preloader States
export const isEngineReady = atom<boolean>(false);
export const engineProgress = atom<number>(0);

// Simulates the Generative Engine processing the text
export async function analyzeMemory(memoryText: string) {
  isAnalyzing.set(true);
  intensityMultiplier.set(3.5); // Spin up the 3D scene dramatically
  
  // Artificial latency for "neural processing"
  await new Promise(resolve => setTimeout(resolve, 3500));
  
  const text = memoryText.toLowerCase();
  
  // Keyword-based sentiment and color mapping (Fallback logic mimicking an LLM)
  let targetColor = '#d4a574'; // Default
  let profile: ScentProfile = {
    name: 'Nocturne Absolute',
    family: 'Oriental Woody',
    description: 'A velvet darkness woven from aged oud. Your memory echoes with deep, unspoken resonance.',
    notes: ['Oud', 'Incense', 'Black Amber']
  };

  if (text.match(/(rain|ocean|water|blue|cold|winter|ice)/)) {
    targetColor = '#5b8c9c'; // Oceanic blue
    profile = {
      name: 'Abyssal Tears',
      family: 'Marine Amber',
      description: 'Your memory speaks of depths and chill. We have distilled the raw force of water into molecular form.',
      notes: ['Sea Salt', 'Ambergris', 'Blue Cypress']
    };
  } else if (text.match(/(forest|pine|wood|green|leaf|spring|earth)/)) {
    targetColor = '#55704a'; // Deep green
    profile = {
      name: 'Verdant Echo',
      family: 'Woody Fougere',
      description: 'Grounded and eternal. This composition reconstructs the quiet strength of ancient roots and crushed leaves.',
      notes: ['Vetiver', 'Oakmoss', 'Galbanum']
    };
  } else if (text.match(/(fire|sun|warm|summer|red|orange|desert)/)) {
    targetColor = '#c9544c'; // Ember red
    profile = {
      name: 'Ember & Iris',
      family: 'Citrus Leather',
      description: 'Scorched earth and radiant heat. A fragrance that ignites the skin with the warmth of your memory.',
      notes: ['Smoked Leather', 'Saffron', 'Red Mandarin']
    };
  } else if (text.match(/(flower|rose|sweet|soft|love|pink|garden)/)) {
    targetColor = '#c77d9c'; // Dusty rose
    profile = {
      name: 'Velvet Dusk',
      family: 'Floral Amber',
      description: 'The tender hour between day and dream. Your memory translates into an intimate, layered floral aura.',
      notes: ['Iris Pallida', 'Warm Vanilla', 'Pink Pepper']
    };
  }

  synesthesiaColor.set(targetColor);
  oracleResult.set(profile);
  intensityMultiplier.set(1.0); // Return to idle state
  isAnalyzing.set(false);
}
