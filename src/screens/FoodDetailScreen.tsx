import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { addMeal } from '../services/firestoreService';
import { FoodItem, MealType } from '../types';
import { FONTS, SPACING, BORDER_RADIUS } from '../utils/constants';
import { useTheme } from '../contexts/ThemeContext';
import { generateId } from '../utils/helpers';

interface Props {
  food: FoodItem;
  mealType: MealType;
  onBack: () => void;
  onDone: () => void;
}

export default function FoodDetailScreen({ food, mealType, onBack, onDone }: Props) {
  const COLORS = useTheme().colors;
  const styles = makeStyles(COLORS);
  const { user } = useAuth();
  const [grams, setGrams] = useState('100');
  const [fav, setFav] = useState(false);

  useEffect(() => {
    isFavorite(food.id).then(setFav);
  }, [food.id]);

  const toggleFavorite = async () => {
    if (fav) {
      await removeFavorite(food.id);
      setFav(false);
    } else {
      await addFavorite(food);
      setFav(true);
    }
  };

  // API nutrition is per 100g, so calculate based on grams entered
  const g = parseFloat(grams) || 0;
  const multiplier = g / 100;

  const calcCalories = Math.round(food.calories * multiplier);
  const calcProtein = Math.round(food.protein * multiplier * 10) / 10;
  const calcCarbs = Math.round(food.carbs * multiplier * 10) / 10;
  const calcFat = Math.round(food.fat * multiplier * 10) / 10;

  const handleAdd = async () => {
    if (!user) return;
    if (g <= 0) {
      Alert.alert('Invalid amount', 'Please enter how many grams you will eat.');
      return;
    }
    const now = Date.now();
    await addMeal(
      {
        id: generateId(),
        foodName: food.name,
        calories: calcCalories,
        protein: calcProtein,
        carbs: calcCarbs,
        fat: calcFat,
        servingSize: `${g}g`,
        quantity: 1,
        mealType,
        date: now,
        createdAt: now,
      },
      user.uid,
    );
    onDone();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Ionicons name="chevron-back" size={28} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Food Details</Text>
        <TouchableOpacity onPress={toggleFavorite}>
          <Ionicons name={fav ? 'heart' : 'heart-outline'} size={26} color={fav ? COLORS.error : COLORS.textTertiary} />
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.foodName}>{food.name}</Text>
        <Text style={styles.serving}>Per 100g — {food.calories} kcal</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>How many grams will you eat?</Text>
        <View style={styles.gramsRow}>
          <TextInput
            style={styles.qtyInput}
            value={grams}
            onChangeText={setGrams}
            keyboardType="decimal-pad"
            selectTextOnFocus
          />
          <Text style={styles.gramsUnit}>g</Text>
        </View>
        <View style={styles.quickBtns}>
          {[50, 100, 150, 200, 250, 300].map((v) => (
            <TouchableOpacity
              key={v}
              style={[styles.quickBtn, grams === String(v) && styles.quickBtnActive]}
              onPress={() => setGrams(String(v))}
            >
              <Text style={[styles.quickBtnText, grams === String(v) && styles.quickBtnTextActive]}>{v}g</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.nutritionCard}>
        <Text style={styles.nutritionTitle}>Nutrition for {g}g</Text>
        {[
          { label: 'Calories', value: calcCalories, unit: 'kcal', color: COLORS.calories },
          { label: 'Protein', value: calcProtein, unit: 'g', color: COLORS.protein },
          { label: 'Carbs', value: calcCarbs, unit: 'g', color: COLORS.carbs },
          { label: 'Fat', value: calcFat, unit: 'g', color: COLORS.fat },
        ].map(({ label, value, unit, color }) => (
          <View key={label} style={styles.nutritionRow}>
            <View style={[styles.dot, { backgroundColor: color }]} />
            <Text style={styles.nutritionLabel}>{label}</Text>
            <Text style={styles.nutritionValue}>{value}{unit}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
        <Text style={styles.addButtonText}>Add to {mealType}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const makeStyles = (COLORS: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: 60,
    paddingBottom: SPACING.lg,
  },
  title: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  foodName: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '700',
    color: COLORS.text,
  },
  serving: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  label: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  qtyInput: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
  },
  gramsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gramsUnit: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
  },
  quickBtns: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  quickBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.border,
  },
  quickBtnActive: {
    backgroundColor: COLORS.primary,
  },
  quickBtnText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  quickBtnTextActive: {
    color: '#fff',
  },
  nutritionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.xxl,
  },
  nutritionTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  nutritionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: SPACING.sm,
  },
  nutritionLabel: {
    flex: 1,
    fontSize: FONTS.sizes.md,
    color: COLORS.text,
  },
  nutritionValue: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: 16,
    marginHorizontal: SPACING.lg,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: FONTS.sizes.lg,
    fontWeight: '600',
  },
});
