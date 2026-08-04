export const COLORS = {
  // Premium Deep Eco-Green & Dark Teal Theme
  primary: '#064E3B',       // Deep Forest Green
  secondary: '#0F766E',     // Dark Teal
  primaryLight: '#0D9488',  // Light Teal
  primaryDark: '#022C22',   // Very Deep Forest Green
  
  accent: '#84CC16',        // Lime Accent (interactive button glows)
  accentDark: '#4D7C0F',    // Darker lime green
  discountGreen: '#22C55E', // Green for positive percentages/eco points

  background: '#F0FDF4',    // Soft Climate background
  surface: '#FFFFFF',
  border: '#D1FAE5',        // Soft light green border
  borderDark: '#A7F3D0',    // Muted dark border

  textDark: '#0F172A',      // Premium slate dark text
  textSecondary: '#475569', // Medium slate text
  textLight: '#FFFFFF', 

  success: '#10B981',
  successLight: '#D1FAE5',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  danger: '#EF4444',
  dangerLight: '#FEE2E2',

  // Fallbacks for compatibility
  bgGradientStart: '#064E3B',
  bgGradientEnd: '#0F766E',
  glassBorder: '#D1FAE5',
  glassBg: 'rgba(255, 255, 255, 0.85)',
  glassBgLight: 'rgba(255, 255, 255, 0.95)',
  textPrimary: '#0F172A',
};

export const TYPOGRAPHY = {
  fontFamily: 'System', 
  hero: {
    fontSize: 32,
    fontWeight: 'bold' as const,
    color: COLORS.textDark,
  },
  h1: {
    fontSize: 26,
    fontWeight: 'bold' as const,
    color: COLORS.textDark,
  },
  h2: {
    fontSize: 22,
    fontWeight: 'bold' as const,
    color: COLORS.textDark,
  },
  h3: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: COLORS.textDark,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: COLORS.textSecondary,
  },
  body: {
    fontSize: 14,
    fontWeight: 'normal' as const,
    color: COLORS.textSecondary,
  },
  caption: {
    fontSize: 12,
    fontWeight: 'normal' as const,
    color: COLORS.textSecondary,
  },
};

export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  soft: {
    shadowColor: '#064E3B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  glow: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
  limeGlow: {
    shadowColor: '#84CC16',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  }
};
