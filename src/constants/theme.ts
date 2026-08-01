import { COLORS } from './colors';
import { TYPOGRAPHY } from './typography';

export const THEME = {
  colors: COLORS,
  typography: TYPOGRAPHY,
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
  touchTargetMin: 48, // React Native & WCAG touch target guideline
};
