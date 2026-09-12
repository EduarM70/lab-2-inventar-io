export interface AppColors {
  background: string;
  surface: string;
  surfaceSecondary: string;
  text: string;
  textSecondary: string;
  border: string;
  primary: string;
  success: string;
  warning: string;
  danger: string;
}

export const lightColors = {
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceSecondary: '#F1F5F9',
  text: '#0F172A',
  textSecondary: '#64748B',
  border: '#E2E8F0',
  primary: '#4F46E5',
  success: '#16A34A',
  warning: '#D97706',
  danger: '#DC2626',
} as const satisfies AppColors;

export const darkColors = {
  background: '#0B1220',
  surface: '#111827',
  surfaceSecondary: '#1E293B',
  text: '#F1F5F9',
  textSecondary: '#94A3B8',
  border: '#334155',
  primary: '#818CF8',
  success: '#4ADE80',
  warning: '#FBBF24',
  danger: '#F87171',
} as const satisfies AppColors;
