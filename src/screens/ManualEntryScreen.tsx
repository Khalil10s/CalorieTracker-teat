import React, { useState } from 'react';
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
import { addMeal } from '../services/storageService';
import { MealType } from '../types';
import { FONTS, SPACING, BORDER_RADIUS } from '../utils/constants';
import { useTheme } from '../contexts/ThemeContext';
import { generateId } from '../utils/helpers';

interface Props {
  mealType: MealType;
  onBack: () => void;
  onDone: () => void;
}

export default function ManualEntryScreen({ mealType, onBack, onDone }: Props) {
  const COLORS = useTheme().colors;
  const styles = makeStyles(COLORS);
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [serving, setServing] = useState('1 serving');

  const handleAdd = async () => {
    if (!user || !name.trim() || !calories.trim()) {
      Alert.alert('Error', 'Please enter a name and calories.');
      return;
    }
    const now = Date.now();
    await addMeal(
      {
        id: generateId(),
        foodName: name.trim(),
        calories: parseFloat(calories) || 0,
        protein: parseFloat(protein) || 0,
        carbs: parseFloat(carbs) || 0,
        fat: parseFloat(fat) || 0,
        servingSize: serving.trim() || '1 serving',
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
        <Text style={styles.title}>Manual Entry</Text>
        <View style={{ width: 28 }} />
      </View>

      {[
        { label: 'Food Name', value: name, set: setName, kbd: 'default' as const },
        { label: 'Calories (kcal)', value: calories, set: setCalories, kbd: 'decimal-pad' as const },
        { label: 'Protein (g)', value: protein, set: setProtein, kbd: 'decimal-pad' as const },
        { label: 'Carbs (g)', value: carbs, set: setCarbs, kbd: 'decimal-pad' as const },
        { label: 'Fat (g)', value: fat, set: setFat, kbd: 'decimal-pad' as const },
        { label: 'Serving Size', value: serving, set: setServing, kbd: 'default' as const },
      ].map(({ label, value, set, kbd }) => (
        <View key={label} style={styles.field}>
          <Text style={styles.label}>{label}</Text>
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={set}
            keyboardType={kbd}
            placeholder={label}
            placeholderTextColor={COLORS.textTertiary}
          />
        </View>
      ))}

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
  field: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.xs,
  },
  input: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '600',
    color: COLORS.text,
    paddingVertical: SPACING.xs,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: 16,
    marginHorizontal: SPACING.lg,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  addButtonText: {
    color: '#fff',
    fontSize: FONTS.sizes.lg,
    fontWeight: '600',
  },
});
