// ─────────────────────────────────────────────────────────────
// Trax Design System
// Import these constants into any screen instead of hard-coding
// values. When mirroring to a new screen, import from here.
// ─────────────────────────────────────────────────────────────

// Spacing scale (4-base grid)
export const SP = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  6: 24,
  8: 32,
} as const;

// Typography — every text style in the app maps to one of these
export const Type = {
  appBrand: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#0EA5E9',
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
    marginBottom: 4,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  modalTitle: {
    fontSize: 26,
    fontWeight: '700' as const,
    color: '#0F172A',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#0F172A',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 6,
  },
  cardMeta: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#64748B',
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
    marginBottom: SP[2],
  },
  body: {
    fontSize: 16,
    color: '#0F172A',
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  caption: {
    fontSize: 11,
    fontWeight: '700' as const,
  },
  link: {
    fontSize: 16,
    color: '#64748B',
  },
} as const;

// Animation — one spring config and one timing config, used everywhere
export const SPRING_CONFIG = {
  tension: 120,
  friction: 14,
  useNativeDriver: true,
} as const;

export const TIMING_CONFIG = {
  duration: 220,
  useNativeDriver: true,
} as const;
