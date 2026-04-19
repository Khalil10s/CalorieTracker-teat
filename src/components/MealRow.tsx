import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MealEntry } from '../types';
import { FONTS, SPACING, BORDER_RADIUS } from '../utils/constants';
import { useTheme } from '../contexts/ThemeContext';

interface Props {
  entry: MealEntry;
  onPress?: () => void;
  onDelete?: () => void;
}

export default function MealRow({ entry, onPress, onDelete }: Props) {
  const COLORS = useTheme().colors;
  const styles = makeStyles(COLORS);
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{entry.foodName}</Text>
        <Text style={styles.meta}>
          {entry.servingSize} · {entry.quantity > 1 ? `×${entry.quantity} · ` : ''}
          P: {Math.round(entry.protein * entry.quantity)}g · C: {Math.round(entry.carbs * entry.quantity)}g · F: {Math.round(entry.fat * entry.quantity)}g
        </Text>
      </View>
      <View style={styles.right}>
        <Text style={styles.calories}>{Math.round(entry.calories * entry.quantity)}</Text>
        <Text style={styles.kcal}>kcal</Text>
      </View>
      {onDelete && (
        <TouchableOpacity onPress={onDelete} style={styles.deleteBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="trash-outline" size={18} color={COLORS.error} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const makeStyles = (COLORS: any) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  info: {
    flex: 1,
    marginRight: SPACING.md,
  },
  name: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  meta: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  right: {
    alignItems: 'flex-end',
    marginRight: SPACING.sm,
  },
  calories: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  kcal: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textTertiary,
  },
  deleteBtn: {
    padding: SPACING.xs,
  },
});
