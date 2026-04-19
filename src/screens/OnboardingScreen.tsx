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
import { useAuth } from '../contexts/AuthContext';
import { FONTS, SPACING, BORDER_RADIUS } from '../utils/constants';
import { useTheme } from '../contexts/ThemeContext';

export default function OnboardingScreen() {
  const COLORS = useTheme().colors;
  const styles = makeStyles(COLORS);
  const { profile, updateProfile } = useAuth();
  const [calories, setCalories] = useState(String(profile?.calorieGoal ?? 2000));
  const [protein, setProtein] = useState(String(profile?.proteinGoal ?? 150));
  const [carbs, setCarbs] = useState(String(profile?.carbsGoal ?? 250));
  const [fat, setFat] = useState(String(profile?.fatGoal ?? 65));
  const [unit, setUnit] = useState<'kg' | 'lbs'>(profile?.weightUnit ?? 'kg');

  const handleSave = async () => {
    const cal = parseInt(calories);
    const p = parseInt(protein);
    const c = parseInt(carbs);
    const f = parseInt(fat);
    if (isNaN(cal) || isNaN(p) || isNaN(c) || isNaN(f)) {
      Alert.alert('Error', 'Please enter valid numbers for all goals.');
      return;
    }
    await updateProfile({
      calorieGoal: cal,
      proteinGoal: p,
      carbsGoal: c,
      fatGoal: f,
      weightUnit: unit,
      hasCompletedOnboarding: true,
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Set Your Goals</Text>
      <Text style={styles.subtitle}>You can always change these later in settings.</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Daily Calorie Goal</Text>
        <TextInput
          style={styles.input}
          value={calories}
          onChangeText={setCalories}
          keyboardType="number-pad"
          placeholder="2000"
          placeholderTextColor={COLORS.textTertiary}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Protein (g)</Text>
        <TextInput
          style={styles.input}
          value={protein}
          onChangeText={setProtein}
          keyboardType="number-pad"
          placeholder="150"
          placeholderTextColor={COLORS.textTertiary}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Carbs (g)</Text>
        <TextInput
          style={styles.input}
          value={carbs}
          onChangeText={setCarbs}
          keyboardType="number-pad"
          placeholder="250"
          placeholderTextColor={COLORS.textTertiary}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Fat (g)</Text>
        <TextInput
          style={styles.input}
          value={fat}
          onChangeText={setFat}
          keyboardType="number-pad"
          placeholder="65"
          placeholderTextColor={COLORS.textTertiary}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Weight Unit</Text>
        <View style={styles.toggleRow}>
          {(['kg', 'lbs'] as const).map((u) => (
            <TouchableOpacity
              key={u}
              style={[styles.toggle, unit === u && styles.toggleActive]}
              onPress={() => setUnit(u)}
            >
              <Text style={[styles.toggleText, unit === u && styles.toggleTextActive]}>
                {u.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleSave}>
        <Text style={styles.buttonText}>Get Started</Text>
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
    padding: SPACING.xxl,
    paddingTop: 80,
  },
  title: {
    fontSize: FONTS.sizes.xxxl,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xxxl,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '600',
    color: COLORS.text,
    paddingVertical: SPACING.xs,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  toggle: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.inputBackground,
    alignItems: 'center',
  },
  toggleActive: {
    backgroundColor: COLORS.primary,
  },
  toggleText: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  toggleTextActive: {
    color: '#fff',
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  buttonText: {
    color: '#fff',
    fontSize: FONTS.sizes.lg,
    fontWeight: '600',
  },
});
