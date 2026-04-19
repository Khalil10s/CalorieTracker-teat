import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { getMealsForRange, getWeights } from '../services/storageService';
import { MealEntry, WeightEntry } from '../types';
import { FONTS, SPACING, BORDER_RADIUS } from '../utils/constants';
import { useTheme } from '../contexts/ThemeContext';
import { formatDate } from '../utils/helpers';

const WIDTH = Dimensions.get('window').width;

type Period = '7d' | '30d' | '90d';

export default function StatsScreen() {
  const COLORS = useTheme().colors;
  const styles = makeStyles(COLORS);
  const { user, profile } = useAuth();
  const [period, setPeriod] = useState<Period>('7d');
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [weights, setWeights] = useState<WeightEntry[]>([]);

  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;

  const load = useCallback(async () => {
    if (!user) return;
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days + 1);
    const m = await getMealsForRange(start, end, user.uid);
    const w = await getWeights(user.uid, days);
    setMeals(m);
    setWeights(w);
  }, [user, days]);

  useEffect(() => { load(); }, [load]);

  // Group calories by day
  const dailyCals: { label: string; value: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = formatDate(d);
    const dayCals = meals
      .filter((m) => formatDate(new Date(m.date)) === key)
      .reduce((s, m) => s + m.calories * m.quantity, 0);
    const short = d.getDate().toString();
    dailyCals.push({ label: short, value: Math.round(dayCals) });
  }

  const maxCal = Math.max(...dailyCals.map((d) => d.value), 1);
  const avgCal = dailyCals.length ? Math.round(dailyCals.reduce((s, d) => s + d.value, 0) / dailyCals.length) : 0;
  const totalProtein = Math.round(meals.reduce((s, m) => s + m.protein * m.quantity, 0));
  const totalCarbs = Math.round(meals.reduce((s, m) => s + m.carbs * m.quantity, 0));
  const totalFat = Math.round(meals.reduce((s, m) => s + m.fat * m.quantity, 0));

  // Weight trend
  const weightData = weights.slice(-days);
  const maxW = weightData.length ? Math.max(...weightData.map((w) => w.weight)) : 0;
  const minW = weightData.length ? Math.min(...weightData.map((w) => w.weight)) : 0;
  const weightChange = weightData.length >= 2
    ? (weightData[weightData.length - 1].weight - weightData[0].weight).toFixed(1) : '0';
  const unit = profile?.weightUnit || 'kg';

  const barWidth = Math.max(2, (WIDTH - 80) / dailyCals.length - 2);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Stats</Text>

      <View style={styles.periodRow}>
        {(['7d', '30d', '90d'] as Period[]).map((p) => (
          <TouchableOpacity
            key={p} style={[styles.periodBtn, period === p && styles.periodActive]}
            onPress={() => setPeriod(p)}
          >
            <Text style={[styles.periodText, period === p && styles.periodTextActive]}>
              {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : '90 Days'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Calories</Text>
        <Text style={styles.avgText}>Avg: {avgCal} kcal/day</Text>
        <View style={styles.chart}>
          {dailyCals.map((d, i) => (
            <View key={i} style={styles.barCol}>
              <View style={[styles.bar, {
                height: Math.max(2, (d.value / maxCal) * 120),
                width: barWidth,
                backgroundColor: d.value > (profile?.calorieGoal || 2000) ? COLORS.error : COLORS.primary,
              }]} />
              {period === '7d' && <Text style={styles.barLabel}>{d.label}</Text>}
            </View>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Macros Total ({days} days)</Text>
        <View style={styles.macroRow}>
          {[
            { label: 'Protein', value: totalProtein, color: COLORS.protein },
            { label: 'Carbs', value: totalCarbs, color: COLORS.carbs },
            { label: 'Fat', value: totalFat, color: COLORS.fat },
          ].map(({ label, value, color }) => (
            <View key={label} style={styles.macroItem}>
              <View style={[styles.macroDot, { backgroundColor: color }]} />
              <Text style={styles.macroLabel}>{label}</Text>
              <Text style={styles.macroValue}>{value}g</Text>
            </View>
          ))}
        </View>
      </View>

      {weightData.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Weight Trend</Text>
          <Text style={styles.avgText}>
            Change: {parseFloat(weightChange) > 0 ? '+' : ''}{weightChange} {unit}
          </Text>
          <View style={styles.weightRow}>
            <View>
              <Text style={styles.weightLabel}>Lowest</Text>
              <Text style={styles.weightVal}>{minW} {unit}</Text>
            </View>
            <View>
              <Text style={styles.weightLabel}>Highest</Text>
              <Text style={styles.weightVal}>{maxW} {unit}</Text>
            </View>
            <View>
              <Text style={styles.weightLabel}>Latest</Text>
              <Text style={styles.weightVal}>{weightData[weightData.length - 1].weight} {unit}</Text>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const makeStyles = (COLORS: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingHorizontal: SPACING.lg, paddingTop: 60, paddingBottom: 100 },
  title: { fontSize: FONTS.sizes.xxxl, fontWeight: '700', color: COLORS.text },
  periodRow: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.lg, marginBottom: SPACING.lg },
  periodBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 20,
    backgroundColor: COLORS.surface, alignItems: 'center',
  },
  periodActive: { backgroundColor: COLORS.primary },
  periodText: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.textSecondary },
  periodTextActive: { color: '#fff' },
  card: {
    backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg, marginBottom: SPACING.lg,
  },
  cardTitle: { fontSize: FONTS.sizes.lg, fontWeight: '600', color: COLORS.text },
  avgText: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, marginTop: SPACING.xs },
  chart: {
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
    height: 140, marginTop: SPACING.lg,
  },
  barCol: { alignItems: 'center' },
  bar: { borderRadius: 3 },
  barLabel: { fontSize: 9, color: COLORS.textTertiary, marginTop: 4 },
  macroRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.lg },
  macroItem: { alignItems: 'center', flex: 1 },
  macroDot: { width: 10, height: 10, borderRadius: 5, marginBottom: 4 },
  macroLabel: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary },
  macroValue: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: COLORS.text, marginTop: 2 },
  weightRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.lg },
  weightLabel: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, textAlign: 'center' },
  weightVal: { fontSize: FONTS.sizes.lg, fontWeight: '600', color: COLORS.text, textAlign: 'center', marginTop: 2 },
});
