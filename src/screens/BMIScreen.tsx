import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { getWeights } from '../services/storageService';
import { FONTS, SPACING, BORDER_RADIUS } from '../utils/constants';
import { useTheme } from '../contexts/ThemeContext';

interface Props {
  onBack: () => void;
}

export default function BMIScreen({ onBack }: Props) {
  const COLORS = useTheme().colors;
  const styles = makeStyles(COLORS);
  const { profile, updateProfile } = useAuth();
  const [height, setHeight] = useState(String(profile?.height || ''));
  const [weight, setWeight] = useState('');

  useEffect(() => {
    getWeights(profile?.uid, 1).then((w) => {
      if (w.length) setWeight(String(w[w.length - 1].weight));
    });
  }, []);

  const h = parseFloat(height) / 100; // cm to m
  const w = parseFloat(weight);
  const bmi = h > 0 && w > 0 ? w / (h * h) : 0;
  const bmiRounded = Math.round(bmi * 10) / 10;

  const getCategory = (bmi: number) => {
    if (bmi < 18.5) return { label: 'Underweight', color: '#4FC3F7' };
    if (bmi < 25) return { label: 'Normal', color: COLORS.success };
    if (bmi < 30) return { label: 'Overweight', color: COLORS.warning };
    return { label: 'Obese', color: COLORS.error };
  };

  const category = bmi > 0 ? getCategory(bmi) : null;

  const saveHeight = async () => {
    const h = parseFloat(height);
    if (h > 0) await updateProfile({ height: h });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Ionicons name="chevron-back" size={28} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>BMI Calculator</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.card}>
        <Text style={styles.fieldLabel}>Height (cm)</Text>
        <TextInput
          style={styles.input}
          value={height}
          onChangeText={setHeight}
          keyboardType="decimal-pad"
          placeholder="e.g. 175"
          placeholderTextColor={COLORS.textTertiary}
          onBlur={saveHeight}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.fieldLabel}>Weight ({profile?.weightUnit || 'kg'})</Text>
        <TextInput
          style={styles.input}
          value={weight}
          onChangeText={setWeight}
          keyboardType="decimal-pad"
          placeholder="e.g. 70"
          placeholderTextColor={COLORS.textTertiary}
        />
      </View>

      {bmi > 0 && (
        <View style={styles.resultCard}>
          <Text style={styles.bmiLabel}>Your BMI</Text>
          <Text style={[styles.bmiValue, { color: category?.color }]}>{bmiRounded}</Text>
          <Text style={[styles.bmiCategory, { color: category?.color }]}>{category?.label}</Text>

          <View style={styles.scaleContainer}>
            <View style={styles.scale}>
              <View style={[styles.scaleSegment, { flex: 18.5, backgroundColor: '#4FC3F7' }]} />
              <View style={[styles.scaleSegment, { flex: 6.5, backgroundColor: COLORS.success }]} />
              <View style={[styles.scaleSegment, { flex: 5, backgroundColor: COLORS.warning }]} />
              <View style={[styles.scaleSegment, { flex: 10, backgroundColor: COLORS.error }]} />
            </View>
            <View style={styles.scaleLabels}>
              <Text style={styles.scaleText}>18.5</Text>
              <Text style={styles.scaleText}>25</Text>
              <Text style={styles.scaleText}>30</Text>
              <Text style={styles.scaleText}>40</Text>
            </View>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>BMI Categories</Text>
            {[
              { range: '< 18.5', label: 'Underweight', color: '#4FC3F7' },
              { range: '18.5 – 24.9', label: 'Normal', color: COLORS.success },
              { range: '25 – 29.9', label: 'Overweight', color: COLORS.warning },
              { range: '30+', label: 'Obese', color: COLORS.error },
            ].map(({ range, label, color }) => (
              <View key={label} style={styles.infoRow}>
                <View style={[styles.infoDot, { backgroundColor: color }]} />
                <Text style={styles.infoLabel}>{label}</Text>
                <Text style={styles.infoRange}>{range}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const makeStyles = (COLORS: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingBottom: 100 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.lg, paddingTop: 60, paddingBottom: SPACING.lg,
  },
  headerTitle: { fontSize: FONTS.sizes.lg, fontWeight: '600', color: COLORS.text },
  card: {
    backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg, marginHorizontal: SPACING.lg, marginBottom: SPACING.sm,
  },
  fieldLabel: { fontSize: FONTS.sizes.xs, fontWeight: '600', color: COLORS.textSecondary, marginBottom: SPACING.xs },
  input: { fontSize: FONTS.sizes.xxl, fontWeight: '700', color: COLORS.text },
  resultCard: {
    backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xxl, marginHorizontal: SPACING.lg, marginTop: SPACING.lg, alignItems: 'center',
  },
  bmiLabel: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  bmiValue: { fontSize: 56, fontWeight: '700', marginTop: SPACING.xs },
  bmiCategory: { fontSize: FONTS.sizes.lg, fontWeight: '600', marginTop: SPACING.xs },
  scaleContainer: { width: '100%', marginTop: SPACING.xxl },
  scale: { flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden' },
  scaleSegment: {},
  scaleLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  scaleText: { fontSize: 10, color: COLORS.textTertiary },
  infoSection: { width: '100%', marginTop: SPACING.xxl },
  infoTitle: { fontSize: FONTS.sizes.md, fontWeight: '600', color: COLORS.text, marginBottom: SPACING.md },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm },
  infoDot: { width: 8, height: 8, borderRadius: 4, marginRight: SPACING.sm },
  infoLabel: { flex: 1, fontSize: FONTS.sizes.md, color: COLORS.text },
  infoRange: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
});
