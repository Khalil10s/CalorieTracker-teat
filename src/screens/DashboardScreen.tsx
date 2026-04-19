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
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { getMealsForDate, deleteMeal, getStreak, getWaterForDate } from '../services/storageService';
import { MealEntry, MealType, MEAL_TYPES } from '../types';
import CalorieRing from '../components/CalorieRing';
import MacroBar from '../components/MacroBar';
import MealRow from '../components/MealRow';
import { FONTS, SPACING, BORDER_RADIUS } from '../utils/constants';
import { useTheme } from '../contexts/ThemeContext';
import { getDateLabel } from '../utils/helpers';

interface Props {
  onNavigateAddMeal: (mealType: MealType) => void;
  onEditMeal: (meal: MealEntry, mealType: MealType) => void;
}

export default function DashboardScreen({ onNavigateAddMeal, onEditMeal }: Props) {
  const COLORS = useTheme().colors;
  const styles = makeStyles(COLORS);
  const { user, profile } = useAuth();
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [date] = useState(new Date());
  const [streak, setStreak] = useState(0);
  const [waterTotal, setWaterTotal] = useState(0);

  const loadMeals = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getMealsForDate(date, user.uid);
      setMeals(data);
      const s = await getStreak(user.uid);
      setStreak(s);
      const waterEntries = await getWaterForDate(date, user.uid);
      setWaterTotal(waterEntries.reduce((sum, w) => sum + w.amount, 0));
    } catch (err) {
      console.error('Failed to load meals', err);
    }
  }, [user, date]);

  useEffect(() => {
    loadMeals();
  }, [loadMeals]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMeals();
    setRefreshing(false);
  };

  const handleDelete = (meal: MealEntry) => {
    Alert.alert('Delete', `Remove ${meal.foodName}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (!user) return;
          await deleteMeal(meal.id, user.uid);
          await loadMeals();
        },
      },
    ]);
  };

  const totalCalories = meals.reduce((s, m) => s + m.calories * m.quantity, 0);
  const totalProtein = meals.reduce((s, m) => s + m.protein * m.quantity, 0);
  const totalCarbs = meals.reduce((s, m) => s + m.carbs * m.quantity, 0);
  const totalFat = meals.reduce((s, m) => s + m.fat * m.quantity, 0);

  const mealsByType = (type: MealType) => meals.filter((m) => m.mealType === type);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.dateLabel}>{getDateLabel(date)}</Text>
        <Text style={styles.greeting}>Hi, {profile?.displayName?.split(' ')[0] || 'there'}</Text>
      </View>

      <View style={styles.quickRow}>
        <View style={styles.quickCard}>
          <Ionicons name="flame" size={22} color="#FF9500" />
          <Text style={styles.quickValue}>{streak}</Text>
          <Text style={styles.quickLabel}>Day Streak</Text>
        </View>
        <View style={styles.quickCard}>
          <Ionicons name="water" size={22} color="#4FC3F7" />
          <Text style={styles.quickValue}>{waterTotal}ml</Text>
          <Text style={styles.quickLabel}>/ {profile?.waterGoal || 2000}ml</Text>
        </View>
      </View>

      <View style={styles.ringCard}>
        <CalorieRing consumed={Math.round(totalCalories)} goal={profile?.calorieGoal || 2000} />
        <View style={styles.macros}>
          <MacroBar label="Protein" current={totalProtein} goal={profile?.proteinGoal || 150} color={COLORS.protein} />
          <MacroBar label="Carbs" current={totalCarbs} goal={profile?.carbsGoal || 250} color={COLORS.carbs} />
          <MacroBar label="Fat" current={totalFat} goal={profile?.fatGoal || 65} color={COLORS.fat} />
        </View>
      </View>

      {MEAL_TYPES.map(({ type, label, icon }) => {
        const entries = mealsByType(type);
        return (
          <View key={type} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{icon} {label}</Text>
              <TouchableOpacity onPress={() => onNavigateAddMeal(type)}>
                <Ionicons name="add-circle" size={28} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
            {entries.length === 0 ? (
              <TouchableOpacity style={styles.emptyCard} onPress={() => onNavigateAddMeal(type)}>
                <Ionicons name="add" size={20} color={COLORS.textTertiary} />
                <Text style={styles.emptyText}>Add {label.toLowerCase()}</Text>
              </TouchableOpacity>
            ) : (
              entries.map((entry) => (
                <MealRow
                  key={entry.id}
                  entry={entry}
                  onPress={() => onEditMeal(entry, type)}
                  onDelete={() => handleDelete(entry)}
                />
              ))
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
  header: {
    paddingHorizontal: SPACING.xxl,
    paddingTop: 60,
    paddingBottom: SPACING.lg,
  },
  dateLabel: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  greeting: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: SPACING.xs,
  },
  quickRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  quickCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    alignItems: 'center',
    gap: 4,
  },
  quickValue: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  quickLabel: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
  },
  ringCard: {
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xxl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  macros: {
    flexDirection: 'row',
    gap: SPACING.lg,
    marginTop: SPACING.xxl,
    width: '100%',
  },
  section: {
    marginTop: SPACING.xxl,
    paddingHorizontal: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  emptyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  emptyText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textTertiary,
  },
});
