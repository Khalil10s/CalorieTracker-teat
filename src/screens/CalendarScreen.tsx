import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { getMealsForDate } from '../services/firestoreService';
import { MealEntry } from '../types';
import MealRow from '../components/MealRow';
import { FONTS, SPACING, BORDER_RADIUS } from '../utils/constants';
import { useTheme } from '../contexts/ThemeContext';
import { formatDate, getMonthDays, isToday, formatDisplayDate } from '../utils/helpers';

export default function CalendarScreen() {
  const COLORS = useTheme().colors;
  const styles = makeStyles(COLORS);
  const { user, profile } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dayMeals, setDayMeals] = useState<MealEntry[]>([]);
  const [dailyTotals, setDailyTotals] = useState<Map<string, number>>(new Map());

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const days = getMonthDays(year, month);
  const firstDayOffset = new Date(year, month, 1).getDay();

  const loadMonth = useCallback(async () => {
    if (!user) return;
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);
    const { getMealsForRange } = await import('../services/storageService');
    const meals = await getMealsForRange(start, end, user.uid);
    const totals = new Map<string, number>();
    for (const m of meals) {
      const key = formatDate(new Date(m.date));
      totals.set(key, (totals.get(key) || 0) + m.calories * m.quantity);
    }
    setDailyTotals(totals);
  }, [user, year, month]);

  useEffect(() => {
    loadMonth();
  }, [loadMonth]);

  useEffect(() => {
    if (!selectedDate || !user) {
      setDayMeals([]);
      return;
    }
    getMealsForDate(selectedDate, user.uid).then(setDayMeals);
  }, [selectedDate, user]);

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));
  const monthLabel = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const goal = profile?.calorieGoal || 2000;

  const getHeatColor = (total: number) => {
    if (total === 0) return 'transparent';
    const ratio = total / goal;
    if (ratio <= 0.5) return '#C6F6D5';
    if (ratio <= 0.9) return '#68D391';
    if (ratio <= 1.1) return '#38A169';
    return '#FC8181';
  };

  const dayTotalCals = dayMeals.reduce((s, m) => s + m.calories * m.quantity, 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Calendar</Text>
      </View>

      <View style={styles.monthHeader}>
        <TouchableOpacity onPress={prevMonth}>
          <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.monthLabel}>{monthLabel}</Text>
        <TouchableOpacity onPress={nextMonth}>
          <Ionicons name="chevron-forward" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.weekRow}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <Text key={d} style={styles.weekDay}>{d}</Text>
        ))}
      </View>

      <View style={styles.daysGrid}>
        {Array(firstDayOffset).fill(null).map((_, i) => (
          <View key={`empty-${i}`} style={styles.dayCell} />
        ))}
        {days.map((d) => {
          const key = formatDate(d);
          const total = dailyTotals.get(key) || 0;
          const isSelected = selectedDate && formatDate(selectedDate) === key;
          return (
            <TouchableOpacity
              key={key}
              style={[styles.dayCell, isSelected && styles.dayCellSelected]}
              onPress={() => setSelectedDate(d)}
            >
              <View style={[styles.dayDot, { backgroundColor: getHeatColor(total) }]}>
                <Text style={[styles.dayText, isToday(d) && styles.dayTextToday, isSelected && styles.dayTextSelected]}>
                  {d.getDate()}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {selectedDate && (
        <View style={styles.detail}>
          <Text style={styles.detailTitle}>{formatDisplayDate(selectedDate)}</Text>
          <Text style={styles.detailSummary}>{Math.round(dayTotalCals)} / {goal} kcal</Text>
          <FlatList
            data={dayMeals}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <MealRow entry={item} />}
            scrollEnabled={false}
            ListEmptyComponent={<Text style={styles.empty}>No meals logged</Text>}
          />
        </View>
      )}
    </View>
  );
}

const makeStyles = (COLORS: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: SPACING.xxl,
    paddingTop: 60,
    paddingBottom: SPACING.md,
  },
  title: {
    fontSize: FONTS.sizes.xxxl,
    fontWeight: '700',
    color: COLORS.text,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xxl,
    marginBottom: SPACING.md,
  },
  monthLabel: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  weekRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xs,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: FONTS.sizes.xs,
    fontWeight: '600',
    color: COLORS.textTertiary,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.lg,
  },
  dayCell: {
    width: `${100 / 7}%`,
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  dayCellSelected: {
    // handled by dot
  },
  dayDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text,
  },
  dayTextToday: {
    fontWeight: '700',
    color: COLORS.primary,
  },
  dayTextSelected: {
    fontWeight: '700',
  },
  detail: {
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    flex: 1,
  },
  detailTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  detailSummary: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  empty: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.md,
    marginTop: SPACING.xl,
  },
});
