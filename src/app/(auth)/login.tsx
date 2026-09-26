import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, spacing, borderRadius, shadows, typography } from '../../config/theme';
import { useAuthStore } from '../../stores/AppStore';
import { useLanguage } from '../../i18n/LanguageContext';
import { LocalizedText as Text } from '../../components/LocalizedText';

export default function LoginScreen() {
  const { language, t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const { login, isLoading, error } = useAuthStore();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert(t('Error'), t('Por favor ingresa email y contrasena'));
      return;
    }
    try {
      await login(email.trim(), password);
      // Only navigate if login succeeded (isAuthenticated becomes true)
      const { isAuthenticated } = useAuthStore.getState();
      if (isAuthenticated) {
        router.replace('/(tabs)');
      }
    } catch {
      // Error is handled by the store
    }
  };

  const handleDemo = async () => {
    try {
      await login('demo@shopping.com', 'demo');
      router.replace('/(tabs)');
    } catch {
      // Fallback: navigate anyway for demo
      router.replace('/(tabs)');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          {/* Brand Header */}
          <View style={styles.brandSection}>
            <View style={styles.logoMark}>
              <Ionicons name="cart" size={32} color={colors.white} />
            </View>
            <Text style={styles.brandName}>SHYFTEX</Text>
            <Text style={styles.brandTagline}>{t('Compra inteligente, precios reales')}</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Text style={styles.formTitle}>{t('Iniciar sesion')}</Text>

            <View style={[styles.inputRow, emailFocused && styles.inputRowFocused]}>
              <Ionicons
                name="mail-outline"
                size={18}
                color={emailFocused ? colors.primary : colors.textTertiary}
              />
              <TextInput
                style={styles.inputField}
                placeholder="tu@email.com"
                placeholderTextColor={colors.textTertiary}
                value={email}
                onChangeText={setEmail}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={[styles.inputRow, passwordFocused && styles.inputRowFocused]}>
              <Ionicons
                name="lock-closed-outline"
                size={18}
                color={passwordFocused ? colors.primary : colors.textTertiary}
              />
              <TextInput
                style={styles.inputField}
                placeholder={language === 'en' ? 'Password' : 'Contrasena'}
                placeholderTextColor={colors.textTertiary}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={colors.textTertiary}
                />
              </TouchableOpacity>
            </View>

            {error ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color={colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.loginBtn, isLoading && styles.loginBtnDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <Text style={styles.loginBtnText}>{t('Continuar')}</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
              <Text style={styles.footerText}>
                {t('No tienes cuenta? ')}
                <Text style={styles.footerLink}>{t('Registrate')}</Text>
              </Text>
            </TouchableOpacity>
          </View>

          {/* Demo */}
          <TouchableOpacity style={styles.demoBtn} onPress={handleDemo} activeOpacity={0.7}>
            <Ionicons name="play-circle-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.demoBtnText}>{t('Probar sin cuenta')}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl + 4,
  },
  // Brand
  brandSection: {
    alignItems: 'center',
    marginBottom: spacing.xxxxl + 8,
  },
  logoMark: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  brandName: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    letterSpacing: 2,
  },
  brandTagline: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  // Form
  form: {
    marginBottom: spacing.xxl,
  },
  formTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xl,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
    marginBottom: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    gap: spacing.md,
  },
  inputRowFocused: {
    borderColor: colors.primary,
  },
  inputField: {
    flex: 1,
    fontSize: typography.fontSize.md,
    color: colors.textPrimary,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.errorLight,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  errorText: {
    fontSize: typography.fontSize.sm,
    color: colors.error,
    flex: 1,
  },
  loginBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.sm,
    ...shadows.sm,
  },
  loginBtnDisabled: {
    opacity: 0.6,
  },
  loginBtnText: {
    color: colors.white,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
  // Footer
  footer: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  footerText: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
  },
  footerLink: {
    color: colors.primary,
    fontWeight: typography.fontWeight.semibold,
  },
  // Demo
  demoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceHover,
  },
  demoBtnText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
});
