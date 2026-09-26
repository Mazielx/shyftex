import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLanguage } from '../i18n/LanguageContext';
import { colors } from '../config/theme';

export function LanguageToggle() {
  const { language, setLanguage, t } = useLanguage();
  return (
    <View style={styles.wrapper}>
      <View
        style={styles.container}
        accessibilityRole="toolbar"
        accessibilityLabel="Language / Idioma"
      >
        {(['es', 'en'] as const).map((option) => (
          <TouchableOpacity
            key={option}
            accessibilityRole="button"
            accessibilityLabel={option === 'es' ? 'Español' : 'English'}
            accessibilityState={{ selected: language === option }}
            onPress={() => setLanguage(option)}
            style={[styles.button, language === option && styles.selected]}
            activeOpacity={0.75}
          >
            <Text style={[styles.label, language === option && styles.selectedLabel]}>
              {option.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {language === 'en' ? (
        <Text style={styles.notice} accessibilityLiveRegion="polite">
          {t('App controls are translated; user-entered products, retailer names, addresses, and provider-generated demo text stay in their original language.')}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    zIndex: 20,
    bottom: Platform.OS === 'web' ? 76 : 104,
    right: 16,
    alignItems: 'flex-end',
    pointerEvents: 'box-none',
  },
  container: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  notice: {
    maxWidth: 230,
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    color: colors.textSecondary,
    backgroundColor: colors.surface,
    fontSize: 11,
    textAlign: 'right',
  },
  button: {
    minWidth: 38,
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 15,
    paddingHorizontal: 8,
  },
  selected: { backgroundColor: colors.primary },
  label: { color: colors.textSecondary, fontSize: 12, fontWeight: '700' },
  selectedLabel: { color: colors.white },
});
