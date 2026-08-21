import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../../config/theme';
import { formatCurrency } from '../../lib/format';
import { Money } from '../../domain/valueObjects/Money';

export interface PriceTagProps {
  price: Money;
  salePrice?: Money | null;
  showSavings?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_CONFIG = {
  sm: { priceSize: typography.fontSize.md, saleSize: typography.fontSize.sm },
  md: { priceSize: typography.fontSize.lg, saleSize: typography.fontSize.md },
  lg: { priceSize: typography.fontSize.xxl, saleSize: typography.fontSize.lg },
} as const;

export function PriceTag({
  price,
  salePrice = null,
  showSavings = true,
  size = 'md',
}: PriceTagProps): React.JSX.Element {
  const hasSale = salePrice !== null && salePrice.cents < price.cents;
  const sizeConfig = SIZE_CONFIG[size];
  const savingsAmount = hasSale ? price.toDecimal() - salePrice.toDecimal() : 0;

  if (!hasSale) {
    return (
      <Text style={[styles.regularPrice, { fontSize: sizeConfig.priceSize }]}>
        {formatCurrency(price.toDecimal())}
      </Text>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.priceRow}>
        <Text style={[styles.salePrice, { fontSize: sizeConfig.priceSize }]}>
          {formatCurrency(salePrice.toDecimal())}
        </Text>
        <Text style={[styles.originalPrice, { fontSize: sizeConfig.saleSize }]}>
          {formatCurrency(price.toDecimal())}
        </Text>
      </View>
      {showSavings && savingsAmount > 0 && (
        <View style={styles.savingsBadge}>
          <Text style={styles.savingsText}>-{formatCurrency(savingsAmount)}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-end',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  regularPrice: {
    fontWeight: '600',
    color: colors.textPrimary,
  },
  salePrice: {
    fontWeight: '700',
    color: colors.savings,
  },
  originalPrice: {
    textDecorationLine: 'line-through',
    color: colors.textTertiary,
  },
  savingsBadge: {
    marginTop: spacing.xs,
    backgroundColor: colors.savingsLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  savingsText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.savings,
  },
});
