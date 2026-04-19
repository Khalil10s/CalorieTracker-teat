import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { getMealsForRange, getWeights, getRecentFoodsRanked, getFavorites, addMeal } from '../services/firestoreService';
import { MealEntry, MealType, FoodItem, WeightEntry } from '../types';
import { FONTS, SPACING, BORDER_RADIUS } from '../utils/constants';
import { useTheme } from '../contexts/ThemeContext';
import { formatDate, generateId } from '../utils/helpers';

const WIDTH = Dimensions.get('window').width;

type Period = '7d' | '30d' | '90d';

export default function StatsScreen() {
  const COLORS = useTheme().colors;
  const styles = makeStyles(COLORS);
  const { user, profile } = useAuth();
  const [period, setPeriod] = useState<Period>('7d');
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [weights, setWeights] = useState<WeightEntry[]>([]);
  const [recentFoods, setRecentFoods] = useState<MealEntry[]>([]);
  const [favorites, setFavorites] = useState<FoodItem[]>([]);

  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;

  const load = useCallback(async () => {
    if (!user) return;
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days + 1);
    const [m, w, recent, favs] = await Promise.all([
      getMealsForRange(start, end, user.uid),
      getWeights(user.uid, days),
      getRecentFoodsRanked(user.uid, 10),
      getFavorites(user.uid),
    ]);
    setMeals(m);
    setWeights(w);
    setRecentFoods(recent);
    setFavorites(favs);
  }, [user, days]);

  useEffect(() => { load(); }, [load]);

  const instantLog = async (entry: { foodName: string; calories: number; protein: number; carbs: number; fat: number; servingSize: string; mealType?: MealType }) => {
    if (!user) return;
    const now = Date.now();
    await addMeal({
      id: generateId(),
      foodName: entry.foodName,
      calories: entry.calories,
      protein: entry.protein,
      carbs: entry.carbs,
      fat: entry.fat,
      servingSize: entry.servingSize,
      quantity: 1,
      mealType: entry.mealType || 'snack',
      date: now,
      createdAt: now,
    }, user.uid);
    await load();
  };

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
      <Text style={styles.title}>Progress</Text>

      {/* ── RECENT FOODS ── */}
      {recentFoods.length > 0 && (
        <View style={styles.quickSection}>
          <Text style={styles.sectionLabel}>RECENT</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {recentFoods.slice(0, 12).map((item, i) => (
              <TouchableOpacity
                key={`${item.id}_${i}`}
                style={styles.recentChip}
                onPress={() => instantLog(item)}
                activeOpacity={0.6}
              >
                <Text style={styles.recentChipName} numberOfLines={1}>{item.foodName}</Text>
                <Text style={styles.recentChipCal}>{Math.round(item.calories)}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* ── FAVORITES ── */}
      {favorites.length > 0 && (
        <View style={styles.quickSection}>
          <Text style={styles.sectionLabel}>FAVORITES</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {favorites.slice(0, 10).map((fav) => (
              <TouchableOpacity
                key={fav.id}
                style={styles.favChip}
                onPress={() => instantLog({
                  foodName: fav.name,
                  calories: fav.calories,
                  protein: fav.protein,
                  carbs: fav.carbs,
                  fat: fav.fat,
                  servingSize: fav.servingSize,
                })}
                activeOpacity={0.6}
              >
                <Ionicons name="heart" size={14} color={COLORS.error} />
                <Text style={styles.favChipName} numberOfLines={1}>{fav.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* ── PERIOD SELECTOR ── */}
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
  content: { paddingTop: 60, paddingBottom: 100 },
  title: {
    fontSize: FONTS.sizes.xxxl, fontWeight: '700', color: COLORS.text,
    paddingHorizontal: SPACING.lg, marginBottom: SPACING.md,
  },

  // Quick actions / Recent / Favorites
  quickSection: {
    marginBottom: SPACING.lg,
  },
  // Quick chip styles kept for recent/favorites
  sectionLabel: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.xl,
  },
  chipRow: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.full,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quickChipText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    color: COLORS.text,
  },
  recentChip: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    minWidth: 80,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 1,
  },
  recentChipName: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '600',
    color: COLORS.text,
  },
  recentChipCal: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: 2,
  },
  favChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.full,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    gap: 6,
  },
  favChipName: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    color: COLORS.text,
  },

  // Period & charts
  periodRow: {
    flexDirection: 'row', gap: SPACING.sm,
    marginBottom: SPACING.lg, paddingHorizontal: SPACING.lg,
  },
  periodBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 20,
    backgroundColor: COLORS.surface, alignItems: 'center',
  },
  periodActive: { backgroundColor: COLORS.primary },
  periodText: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.textSecondary },
  periodTextActive: { color: '#fff' },
  card: {
    backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg, marginBottom: SPACING.lg, marginHorizontal: SPACING.lg,
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
