/**
 * Scrapay Design System
 * Unified color palette and design tokens for consistent UI/UX
 */

// ==================== COLOR PALETTE ====================

export const colors = {
  // Primary Brand Colors
  primary: {
    main: '#f06f0b',
    light: '#f38d33',
    dark: '#e15506',
    50: '#fef7ee',
    500: '#f06f0b',
    600: '#e15506',
    700: '#ba3f08',
  },

  // Secondary/Accent Colors  
  secondary: {
    main: '#8b5e3c',
    light: '#aca292',
    dark: '#6a442c',
    400: '#8b5e3c',
    500: '#7a5134',
    900: '#3e2c1c',
  },

  // Success (Green) - for verified, completed
  success: {
    main: '#22c55e',
    light: '#4ade80',
    dark: '#16a34a',
    50: '#f0fdf4',
    100: '#dcfce7',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
  },

  // Warning (Yellow/Orange) - for pending
  warning: {
    main: '#f59e0b',
    light: '#fbbf24',
    dark: '#d97706',
    50: '#fffbeb',
    100: '#fef3c7',
    500: '#f59e0b',
    600: '#d97706',
  },

  // Danger (Red) - for rejected, cancelled, errors
  danger: {
    main: '#ef4444',
    light: '#f87171',
    dark: '#dc2626',
    50: '#fef2f2',
    100: '#fee2e2',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
  },

  // Info (Blue)
  info: {
    main: '#3b82f6',
    light: '#60a5fa',
    dark: '#2563eb',
    500: '#3b82f6',
    600: '#2563eb',
  },

  // Neutral/Gray
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },

  white: '#ffffff',
  black: '#000000',
}

// ==================== STATUS COLORS ====================

export const statusColors = {
  // Order Status
  pending: colors.warning.main,
  accepted: colors.info.main,
  rejected: colors.danger.main,
  in_progress: colors.info.dark,
  completed: colors.success.main,
  cancelled: colors.neutral[500],

  // Vendor Verification Status
  verified: colors.success.main,
  unverified: colors.warning.main,
  verification_pending: colors.warning.main,
  verification_rejected: colors.danger.main,
  verification_approved: colors.success.main,

  // General
  online: colors.success.main,
  offline: colors.neutral[400],
  active: colors.success.main,
  inactive: colors.neutral[400],
}

export default {
  colors,
  statusColors,
}
