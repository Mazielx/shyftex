import { translate } from '../../i18n/LanguageContext';

jest.mock('react-native', () => ({ Platform: { OS: 'web' } }));
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: { getItem: jest.fn(), setItem: jest.fn() },
}));

describe('translate', () => {
  it('translates a known interface label into English', () => {
    expect(translate('en', 'Nueva lista')).toBe('New list');
    expect(translate('en', 'No hay planes')).toBe('No plans yet');
    expect(translate('en', 'Cerrar sesión')).toBe('Sign out');
  });

  it('keeps Spanish text in Spanish and preserves unknown dynamic data', () => {
    expect(translate('es', 'Nueva lista')).toBe('Nueva lista');
    expect(translate('es', 'No hay planes')).toBe('No hay planes');
    expect(translate('en', 'Leche Lala 1L')).toBe('Leche Lala 1L');
  });

  it('translates exact home labels and interpolated interface copy without changing dynamic values', () => {
    expect(translate('en', 'Listas')).toBe('Lists');
    expect(translate('en', 'Planes')).toBe('Plans');
    expect(translate('en', 'Crear lista')).toBe('Create list');
    expect(translate('en', 'Tip: Se concreta con las marcas para mejores resultados. "2L leche Lala" funciona mejor que solo "leche".'))
      .toBe('Tip: Be specific about brands for better results. "2L Lala milk" works better than just "milk".');
    expect(translate('en', 'Hoy cierra a las {closeTime}', { closeTime: '21:30' })).toBe('Today closes at 21:30');
    expect(translate('en', 'Hoy cierra a las {closeTime}', { closeTime: 'Leche Lala' })).toBe('Today closes at Leche Lala');
  });
});
