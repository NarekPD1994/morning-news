// Colours and type, matched to the Morning Brief website.
export const C = {
  bg: '#f2f1ee',
  card: '#ffffff',
  shell: '#ebeae6',
  ink: '#1c1c1e',
  sub: '#6e6e73',
  hair: 'rgba(0,0,0,0.08)',
  dark: '#1c1c1e',
  onDark: '#ffffff',
  hot: '#ff3b30',
};

export const F = {
  regular: 'Outfit_400Regular',
  medium: 'Outfit_500Medium',
  serif: 'InstrumentSerif_400Regular',
  serifItalic: 'InstrumentSerif_400Regular_Italic',
};

export const TOPICS: Record<string, string> = {
  ai: 'AI',
  design: 'Design & UX',
  eng: 'Design eng',
  tech: 'Tech & IT',
  art: 'Art direction',
  lead: 'Leadership',
  fintech: 'Fintech UX',
  career: 'Career abroad',
};

export const TOPIC_COLORS: Record<string, string> = {
  ai: '#8b7cf6',
  design: '#4f8df7',
  eng: '#2bb5a5',
  tech: '#7d8796',
  art: '#ff7a66',
  lead: '#f5a524',
  fintech: '#30b46c',
  career: '#38b6f0',
};

export const SWATCHES = ['#8b7cf6', '#4f8df7', '#2bb5a5', '#30b46c', '#f5a524', '#ff7a66', '#ec5c9a', '#1c1c1e'];

/** A light tint of a hex colour, for icon backgrounds. */
export function tint(hex: string, alpha = 0.14): string {
  const h = hex.replace('#', '');
  if (h.length !== 6) return `rgba(125,135,150,${alpha})`;
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export const shadow = {
  shadowColor: '#14141e',
  shadowOpacity: 0.12,
  shadowRadius: 18,
  shadowOffset: { width: 0, height: 10 },
  elevation: 4,
};
