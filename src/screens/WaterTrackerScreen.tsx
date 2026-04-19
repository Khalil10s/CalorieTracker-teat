import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { addWater, getWaterForDate, deleteWater } from '../services/storageService';
import { WaterEntry } from '../types';
import { FONTS, SPACING, BORDER_RADIUS } from '../utils/constants';
import { useTheme } from '../contexts/ThemeContext';
import { generateId } from '../utils/helpers';

export default function WaterScreen() {
  const COLORS = useTheme().colors;
  const styles = makeStyles(COLORS);
  const { user, profile } = useAuth();
  const [entries, setEntries] = useState<WaterEntry[]>([]);
  const waterGoal = profile?.waterGoal || 2000;

  const load = useCallback(async () => {
    if (!user) return;
    const data = await getWaterForDate(new Date(), user.uid);
    setEntries(data);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const totalMl = entries.reduce((s, e) => s + e.amount, 0);
  const glasses = Math.floor(totalMl / 250);
  const progress = Math.min(totalMl / waterGoal, 1);

  const addAmount = async (ml: number) => {
    if (!user) return;
    await addWater({ id: generateId(), amount: ml, date: Date.now(), createdAt: Date.now() }, user.uid);
    await load();
  };

  const handleDeleteLast = () => {
    if (entries.length === 0) return;
    const last = entries[entries.length - 1];
    Alert.alert('Undo', `Remove last ${last.amount}ml?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive', onPress: async () => {
          await deleteWater(last.id, user?.uid);
          await load();
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Water</Text>
      <Text style={styles.subtitle}>Stay hydrated 💧</Text>

      <View style={styles.ringContainer}>
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { height: `${progress * 100}%` }]} />
        </View>
        <View style={styles.ringText}>
          <Text style={styles.amount}>{totalMl}</Text>
          <Text style={styles.unit}>/ {waterGoal} ml</Text>
          <Text style={styles.glasses}>{glasses} glasses</Text>
        </View>
      </View>

      <Text style={styles.quickLabel}>Quick Add</Text>
      <View style={styles.quickRow}>
        {[150, 250, 350, 500].map((ml) => (
          <TouchableOpacity key={ml} style={styles.quickBtn} onPress={() => addAmount(ml)}>
            <Ionicons name="water" size={20} color={COLORS.primary} />
            <Text style={styles.quickBtnText}>{ml}ml</Text>
          </TouchableOpacity>
        ))}
      </View>

      {entries.length > 0 && (
        <TouchableOpacity style={styles.undoBtn} onPress={handleDeleteLast}>
          <Ionicons name="arrow-undo" size={18} color={COLORS.textSecondary} />
          <Text style={styles.undoBtnText}>Undo last</Text>
        </TouchableOpacity>
      )}

      <View style={styles.logSection}>
        <Text style={styles.logTitle}>Today's Log</Text>
        {entries.length === 0 ? (
          <Text style={styles.emptyText}>No water logged yet</Text>
        ) : (
          entries.map((e, i) => (
            <View key={e.id} style={styles.logRow}>
              <Text style={styles.logTime}>
                {new Date(e.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
              <Text style={styles.logAmount}>{e.amount}ml</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const makeStyles = (COLORS: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingHorizontal: SPACING.lg, paddingTop: 60, paddingBottom: 100 },
  title: { fontSize: FONTS.sizes.xxxl, fontWeight: '700', color: COLORS.text },
  subtitle: { fontSize: FONTS.sizes.md, color: COLORS.textSecondary, marginTop: SPACING.xs },
  ringContainer: { alignItems: 'center', marginTop: SPACING.xxl },
  progressBg: {
    width: 120, height: 200, borderRadius: 60, backgroundColor: COLORS.border,
    overflow: 'hidden', justifyContent: 'flex-end',
  },
  progressFill: { backgroundColor: '#4FC3F7', borderRadius: 60 },
  ringText: { position: 'absolute', top: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },
  amount: { fontSize: FONTS.sizes.xxl, fontWeight: '700', color: COLORS.text },
  unit: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  glasses: { fontSize: FONTS.sizes.sm, color: COLORS.textTertiary, marginTop: SPACING.xs },
  quickLabel: {
    fontSize: FONTS.sizes.xs, fontWeight: '600', color: COLORS.textSecondary,
    textTransform: 'uppercase', marginTop: SPACING.xxl, marginBottom: SPACING.sm,
  },
  quickRow: { flexDirection: 'row', gap: SPACING.sm },
  quickBtn: {
    flex: 1, backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md, alignItems: 'center', gap: 4,
  },
  quickBtnText: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.text },
  undoBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.xs, marginTop: SPACING.lg,
  },
  undoBtnText: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  logSection: { marginTop: SPACING.xxl },
  logTitle: { fontSize: FONTS.sizes.lg, fontWeight: '600', color: COLORS.text, marginBottom: SPACING.md },
  emptyText: { fontSize: FONTS.sizes.md, color: COLORS.textTertiary },
  logRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.md, marginBottom: SPACING.xs,
  },
  logTime: { fontSize: FONTS.sizes.md, color: COLORS.textSecondary },
  logAmount: { fontSize: FONTS.sizes.md, fontWeight: '600', color: COLORS.text },
});
