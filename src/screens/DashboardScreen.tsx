import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import {
  getMealsForDate, deleteMeal,
  getYesterdayMeals, repeatYesterdayMeals, repeatLastMeal, quickAddCalories,
} from '../services/storageService';
import { MealEntry, MealType, MEAL_TYPES } from '../types';
import CalorieRing from '../components/CalorieRing';
import MealRow from '../components/MealRow';
import { FONTS, SPACING, BORDER_RADIUS } from '../utils/constants';
import { useTheme } from '../contexts/ThemeContext';

interface Props {
  onNavigateAddMeal: (mealType: MealType) => void;
  onEditMeal: (meal: MealEntry, mealType: MealType) => void;
  onSearch: (mealType: MealType) => void;
  onNavigateStats?: () => void;
}

export default function DashboardScreen({ onNavigateAddMeal, onEditMeal, onSearch, onNavigateStats }: Props) {
  const COLORS = useTheme().colors;
  const styles = makeStyles(COLORS);
  const { user, profile } = useAuth();
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [yesterdayCount, setYesterdayCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const [data, yesterday] = await Promise.all([
        getMealsForDate(new Date(), user.uid),
        getYesterdayMeals(user.uid),
      ]);
      setMeals(data);
      setYesterdayCount(yesterday.length);
    } catch (err) {
      console.error('Failed to load', err);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleQuickAdd = async (amount: number) => {
    if (!user) return;
    await quickAddCalories(amount, user.uid);
    await load();
  };

  const handleRepeatYesterday = async () => {
    if (!user || yesterdayCount === 0) return;
    const count = await repeatYesterdayMeals(user.uid);
    Alert.alert('Done', `Logged ${count} meals from yesterday.`);
    await load();
  };

  const handleRepeatLastMeal = async () => {
    if (!user) return;
    const result = await repeatLastMeal(user.uid);
    if (result) {
      await load();
    } else {
      Alert.alert('No Meals', 'No previous meals found to repeat.');
    }
  };

  const handleDelete = (meal: MealEntry) => {
    Alert.alert('Delete', `Remove ${meal.foodName}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await deleteMeal(meal.id, user?.uid);
        await load();
      }},
    ]);
  };

  const totalCalories = meals.reduce((s, m) => s + m.calories * m.quantity, 0);
  const totalProtein = meals.reduce((s, m) => s + m.protein * m.quantity, 0);
  const totalCarbs = meals.reduce((s, m) => s + m.carbs * m.quantity, 0);
  const totalFat = meals.reduce((s, m) => s + m.fat * m.quantity, 0);
  const calGoal = profile?.calorieGoal || 2000;

  const proteinGoal = profile?.proteinGoal || 150;
  const carbsGoal = profile?.carbsGoal || 250;
  const fatGoal = profile?.fatGoal || 65;

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
  const hour = today.getHours();
  const progress = calGoal > 0 ? totalCalories / calGoal : 0;
  const remaining = Math.max(calGoal - Math.round(totalCalories), 0);
  const firstName = profile?.displayName?.split(' ')[0] || '';

  // Motivational message based on time + progress
  let motivation = '';
  if (progress >= 1) {
    motivation = `Excellent job${firstName ? `, ${firstName}` : ''}! You've hit your calorie goal for today! 🎉`;
  } else if (progress >= 0.8) {
    motivation = `Almost there${firstName ? `, ${firstName}` : ''}! Just ${remaining} kcal left. Great job! 🔥`;
  } else if (hour < 12) {
    motivation = `Good morning${firstName ? `, ${firstName}` : ''}! You have ${remaining} kcal to enjoy today. You got this! 💪`;
  } else if (hour < 17) {
    motivation = `Good job${firstName ? `, ${firstName}` : ''}, keep it up! ${remaining} kcal remaining. 👏`;
  } else {
    motivation = `Good evening${firstName ? `, ${firstName}` : ''}! ${remaining} kcal left to finish strong tonight. 🌙`;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
    >
      {/* ── GREEN GRADIENT HEADER ── */}
      <LinearGradient
        colors={['#3BB89E', '#7BC67E', '#B8C466']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroGradient}
      >
        <View style={styles.heroTopRow}>
          <View style={{ width: 36 }} />
          <Text style={styles.heroTitle}>Aska</Text>
          <TouchableOpacity
            style={styles.heroAddBtn}
            onPress={() => onSearch('snack')}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={26} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Ring + Eaten / Burned */}
        <View style={styles.ringRow}>
          <View style={styles.sideLabel}>
            <Text style={styles.sideValue}>{Math.round(totalCalories)}</Text>
            <Text style={styles.sideLabelText}>EATEN</Text>
          </View>

          <CalorieRing consumed={Math.round(totalCalories)} goal={calGoal} size={170} strokeWidth={12} lightText />

          <View style={styles.sideLabel}>
            <Text style={styles.sideValue}>0</Text>
            <Text style={styles.sideLabelText}>BURNED</Text>
          </View>
        </View>

        {/* SEE STATS link */}
        <TouchableOpacity style={styles.seeStats} onPress={onNavigateStats} activeOpacity={0.7}>
          <Text style={styles.seeStatsText}>SEE STATS</Text>
          <Ionicons name="chevron-down" size={14} color="rgba(255,255,255,0.85)" />
        </TouchableOpacity>
      </LinearGradient>

      {/* ── MACRO PROGRESS BARS ── */}
      <View style={styles.macroSection}>
        {[
          { label: 'Carbs', current: Math.round(totalCarbs), goal: carbsGoal, color: COLORS.carbs },
          { label: 'Protein', current: Math.round(totalProtein), goal: proteinGoal, color: COLORS.protein },
          { label: 'Fat', current: Math.round(totalFat), goal: fatGoal, color: COLORS.fat },
        ].map(({ label, current, goal, color }) => {
          const progress = goal > 0 ? Math.min(current / goal, 1) : 0;
          return (
            <View key={label} style={styles.macroItem}>
              <Text style={styles.macroLabel}>{label}</Text>
              <View style={styles.macroBarTrack}>
                <View style={[styles.macroBarFill, { width: `${progress * 100}%`, backgroundColor: color }]} />
              </View>
              <Text style={styles.macroValues}>{current}/{goal}g</Text>
            </View>
          );
        })}
      </View>

      {/* ── DATE HEADER ── */}
      <View style={styles.dateRow}>
        <Ionicons name="calendar-outline" size={16} color={COLORS.textSecondary} />
        <Text style={styles.dateLabel}>TODAY, {dateStr}</Text>
      </View>

      {/* ── QUICK ACTIONS ── */}
      <View style={styles.quickSection}>
        <Text style={styles.quickTitle}>QUICK ACTIONS</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickRow}>
          {[100, 250, 500].map((amt) => (
            <TouchableOpacity
              key={amt}
              style={styles.quickChip}
              onPress={() => handleQuickAdd(amt)}
              activeOpacity={0.7}
            >
              <Ionicons name="flash-outline" size={16} color={COLORS.primary} />
              <Text style={styles.quickChipText}>+{amt} kcal</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[styles.quickChip, yesterdayCount === 0 && { opacity: 0.4 }]}
            onPress={handleRepeatYesterday}
            activeOpacity={0.7}
            disabled={yesterdayCount === 0}
          >
            <Ionicons name="repeat-outline" size={16} color={COLORS.primary} />
            <Text style={styles.quickChipText}>Yesterday{yesterdayCount > 0 ? ` (${yesterdayCount})` : ''}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickChip}
            onPress={handleRepeatLastMeal}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-redo-outline" size={16} color={COLORS.primary} />
            <Text style={styles.quickChipText}>Last Meal</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* ── MOTIVATIONAL MESSAGE ── */}
      <View style={styles.motivationCard}>
        <Text style={styles.motivationText}>{motivation}</Text>
      </View>

      {/* ── DIARY: Meal Sections ── */}
      {MEAL_TYPES.map(({ type, label, icon, color }) => {
        const entries = meals.filter((m) => m.mealType === type);
        const sectionCal = entries.reduce((s, m) => s + m.calories * m.quantity, 0);
        return (
          <View key={type} style={styles.mealSection}>
            <View style={styles.mealHeader}>
              <View style={styles.mealHeaderLeft}>
                <View style={[styles.mealDot, { backgroundColor: color }]} />
                <Text style={styles.mealLabel}>{label}</Text>
                {sectionCal > 0 && (
                  <Text style={styles.mealCal}>{Math.round(sectionCal)} kcal</Text>
                )}
              </View>
              <TouchableOpacity
                onPress={() => onSearch(type)}
                style={styles.mealAddBtn}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={22} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
            {entries.length > 0 ? (
              entries.map((entry) => (
                <MealRow
                  key={entry.id}
                  entry={entry}
                  onPress={() => onEditMeal(entry, type)}
                  onDelete={() => handleDelete(entry)}
                />
              ))
            ) : (
              <TouchableOpacity
                style={styles.mealEmpty}
                onPress={() => onSearch(type)}
                activeOpacity={0.6}
              >
                <Ionicons name="add-circle-outline" size={20} color={COLORS.textTertiary} />
                <Text style={styles.mealEmptyText}>Add {label.toLowerCase()}</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

const makeStyles = (COLORS: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingBottom: 100,
  },

  // ── Green gradient hero ──
  heroGradient: {
    paddingTop: 56,
    paddingBottom: SPACING.xl,
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  heroTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: '#fff',
  },
  heroAddBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.lg,
  },
  sideLabel: {
    alignItems: 'center',
    width: 60,
  },
  sideValue: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: '#fff',
  },
  sideLabelText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.75)',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  seeStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.md,
    gap: 4,
  },
  seeStatsText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 0.5,
  },

  // ── Motivational message ──
  motivationCard: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    elevation: 2,
  },
  motivationText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    color: COLORS.text,
    lineHeight: 20,
    textAlign: 'center',
  },

  // ── Macro bars ──
  macroSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.lg,
    marginTop: -12,
    borderRadius: BORDER_RADIUS.lg,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
  },
  macroItem: {
    flex: 1,
    alignItems: 'center',
  },
  macroLabel: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  macroBarTrack: {
    width: '80%',
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.border,
    overflow: 'hidden',
    marginBottom: 4,
  },
  macroBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  macroValues: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },

  // ── Date header ──
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.xl,
    marginBottom: SPACING.md,
    gap: 6,
  },
  dateLabel: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 1,
  },

  // ── Quick actions ──
  quickSection: {
    marginBottom: SPACING.md,
  },
  quickTitle: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.xl,
  },
  quickRow: {
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

  // ── Meal diary sections ──
  mealSection: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  mealHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  mealDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  mealLabel: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  mealCal: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  mealAddBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  mealEmptyText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textTertiary,
    fontWeight: '500',
  },
});
