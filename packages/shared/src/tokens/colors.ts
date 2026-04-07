export const themes = {
  pink: {
    main: '#f43f5e',
    burgundy: '#7e1631',
    softBg: '#fffaf9',
    bodyBg: '#fdf8f7',
    theme100: '#ffe4e6',
  },
  blue: {
    main: '#3b82f6',
    burgundy: '#1e3a8a',
    softBg: '#f0f9ff',
    bodyBg: '#f8fafc',
    theme100: '#dbeafe',
  },
  orange: {
    main: '#f97316',
    burgundy: '#7c2d12',
    softBg: '#fff7ed',
    bodyBg: '#fffaf5',
    theme100: '#ffedd5',
  },
} as const;

export type ThemeName = keyof typeof themes;

export const semantic = {
  text: {
    primary: '#1e293b',
    secondary: '#64748b',
    muted: '#94a3b8',
    inverse: '#ffffff',
  },
  input: {
    bg: '#ffffff',
    border: '#f1f5f9',
    placeholder: '#94a3b8',
    focus: '#f43f5e',
  },
  glass: {
    bg: 'rgba(255, 255, 255, 0.6)',
    border: 'rgba(255, 255, 255, 0.8)',
  },
} as const;
