import { themes, semantic, fonts, spacing } from '@nestly/shared/tokens';

describe('monorepo wiring', () => {
  it('imports design tokens from @nestly/shared', () => {
    expect(themes.pink.main).toBe('#f43f5e');
    expect(semantic.text.primary).toBe('#1e293b');
    expect(fonts.body).toBe('Plus Jakarta Sans');
    expect(spacing[4]).toBe(16);
  });
});
