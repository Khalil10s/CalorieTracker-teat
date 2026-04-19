import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { addWeight, getWeights, deleteWeight } from '../services/storageService';
import { WeightEntry } from '../types';
import { FONTS, SPACING, BORDER_RADIUS } from '../utils/constants';
import { useTheme } from '../contexts/ThemeContext';
import { generateId, formatDisplayDate, roundTo } from '../utils/helpers';

export default function WeightScreen() {
  const COLORS = useTheme().colors;
  const styles = makeStyles(COLORS);
  const { user, profile } = useAuth();
  const [weights, setWeights] = useState<WeightEntry[]>([]);
  const [input, setInput] = useState('');
  const unit = profile?.weightUnit || 'kg';

  const load = useCallback(async () => {
    if (!user) return;
    const data = await getWeights(user.uid);
    setWeights(data);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdd = async () => {
    const val = parseFloat(input);
    if (isNaN(val) || val <= 0 || !user) {
      Alert.alert('Error', 'Enter a valid weight.');
      return;
    }
    const now = Date.now();
    await addWeight({ id: generateId(), weight: val, date: now, createdAt: now }, user.uid);
    setInput('');
    load();
  };

  const handleDelete = (entry: WeightEntry) => {
    Alert.alert('Delete', 'Remove this entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (!user) return;
          await deleteWeight(entry.id, user.uid);
          load();
        },
      },
    ]);
  };

  const change =
    weights.length >= 2
      ? roundTo(weights[weights.length - 1].weight - weights[weights.length - 2].weight, 1)
      : null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Weight</Text>
      </View>

      {weights.length > 0 && (
        <View style={styles.summaryCard}>
          <Text style={styles.currentWeight}>
            {roundTo(weights[weights.length - 1].weight, 1)} {unit}
          </Text>
          {change !== null && (
            <Text style={[styles.change, { color: change > 0 ? COLORS.error : change < 0 ? COLORS.success : COLORS.textSecondary }]}>
              {change > 0 ? '+' : ''}{change} {unit} from previous
            </Text>
          )}
        </View>
      )}

      <View style={styles.addRow}>
        <TextInput
          style={styles.input}
          placeholder={`Weight (${unit})`}
          placeholderTextColor={COLORS.textTertiary}
          value={input}
          onChangeText={setInput}
          keyboardType="decimal-pad"
        />
        <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={[...weights].reverse()}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.row} onLongPress={() => handleDelete(item)}>
            <Text style={styles.rowDate}>{formatDisplayDate(new Date(item.date))}</Text>
            <Text style={styles.rowWeight}>{roundTo(item.weight, 1)} {unit}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No weight entries yet.</Text>}
      />
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
    paddingBottom: SPACING.lg,
  },
  title: {
    fontSize: FONTS.sizes.xxxl,
    fontWeight: '700',
    color: COLORS.text,
  },
  summaryCard: {
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xxl,
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  currentWeight: {
    fontSize: FONTS.sizes.hero,
    fontWeight: '700',
    color: COLORS.text,
  },
  change: {
    fontSize: FONTS.sizes.sm,
    marginTop: SPACING.xs,
    fontWeight: '600',
  },
  addRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 14,
    fontSize: FONTS.sizes.md,
    color: COLORS.text,
  },
  addBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 100,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  rowDate: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
  },
  rowWeight: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  empty: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.md,
    marginTop: 40,
  },
});
