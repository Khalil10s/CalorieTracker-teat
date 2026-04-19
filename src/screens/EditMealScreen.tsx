import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { updateMeal, deleteMeal } from '../services/storageService';
import { MealEntry, MealType } from '../types';
import { FONTS, SPACING, BORDER_RADIUS } from '../utils/constants';
import { useTheme } from '../contexts/ThemeContext';

interface Props {
  meal: MealEntry;
  mealType: MealType;
  onBack: () => void;
  onDone: () => void;
}

export default function EditMealScreen({ meal, mealType, onBack, onDone }: Props) {
  const COLORS = useTheme().colors;
  const styles = makeStyles(COLORS);
  const { user } = useAuth();
  const [foodName, setFoodName] = useState(meal.foodName);
  const [calories, setCalories] = useState(String(meal.calories));
  const [protein, setProtein] = useState(String(meal.protein));
  const [carbs, setCarbs] = useState(String(meal.carbs));
  const [fat, setFat] = useState(String(meal.fat));
  const [serving, setServing] = useState(meal.servingSize);

  const handleSave = async () => {
    if (!user || !foodName.trim()) return;
    const updated: MealEntry = {
      ...meal,
      foodName: foodName.trim(),
      calories: parseFloat(calories) || 0,
      protein: parseFloat(protein) || 0,
      carbs: parseFloat(carbs) || 0,
      fat: parseFloat(fat) || 0,
      servingSize: serving,
    };
    await updateMeal(updated, user.uid);
    onDone();
  };

  const handleDelete = () => {
    Alert.alert('Delete', `Remove ${meal.foodName}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          if (!user) return;
          await deleteMeal(meal.id, user.uid);
          onDone();
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Ionicons name="chevron-back" size={28} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Meal</Text>
        <TouchableOpacity onPress={handleDelete}>
          <Ionicons name="trash-outline" size={24} color={COLORS.error} />
        </TouchableOpacity>
      </View>

      {[
        { label: 'Food Name', value: foodName, set: setFoodName, kb: 'default' as const },
        { label: 'Calories', value: calories, set: setCalories, kb: 'decimal-pad' as const },
        { label: 'Protein (g)', value: protein, set: setProtein, kb: 'decimal-pad' as const },
        { label: 'Carbs (g)', value: carbs, set: setCarbs, kb: 'decimal-pad' as const },
        { label: 'Fat (g)', value: fat, set: setFat, kb: 'decimal-pad' as const },
        { label: 'Serving', value: serving, set: setServing, kb: 'default' as const },
      ].map(({ label, value, set, kb }) => (
        <View key={label} style={styles.field}>
          <Text style={styles.fieldLabel}>{label}</Text>
          <TextInput style={styles.fieldInput} value={value} onChangeText={set} keyboardType={kb} />
        </View>
      ))}

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveBtnText}>Save Changes</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const makeStyles = (COLORS: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingBottom: 40 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.lg, paddingTop: 60, paddingBottom: SPACING.lg,
  },
  title: { fontSize: FONTS.sizes.lg, fontWeight: '600', color: COLORS.text },
  field: {
    backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg, marginHorizontal: SPACING.lg, marginBottom: SPACING.sm,
  },
  fieldLabel: { fontSize: FONTS.sizes.xs, fontWeight: '600', color: COLORS.textSecondary, marginBottom: SPACING.xs },
  fieldInput: { fontSize: FONTS.sizes.lg, fontWeight: '600', color: COLORS.text },
  saveBtn: {
    backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.md,
    paddingVertical: 16, marginHorizontal: SPACING.lg, alignItems: 'center', marginTop: SPACING.lg,
  },
  saveBtnText: { color: '#fff', fontSize: FONTS.sizes.lg, fontWeight: '600' },
});
