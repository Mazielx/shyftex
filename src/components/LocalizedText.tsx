import React from 'react';
import { Text as NativeText, TextProps } from 'react-native';
import { useLanguage } from '../i18n/LanguageContext';

/** Translate recognized static copy while leaving user/provider data untouched. */
export function LocalizedText({ children, ...props }: TextProps) {
  const { t } = useLanguage();
  const localizedChildren = React.Children.map(children, (child) =>
    typeof child === 'string' ? t(child) : child,
  );
  return <NativeText {...props}>{localizedChildren}</NativeText>;
}
