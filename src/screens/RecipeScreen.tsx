import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { addRecipe, getRecipes, deleteRecipe, addMeal } from '../services/storageService';
import { Recipe, RecipeIngredient, MealType } from '../types';
import { FONTS, SPACING, BORDER_RADIUS } from '../utils/constants';
import { useTheme } from '../contexts/ThemeContext';
import { generateId } from '../utils/helpers';

interface Props {
  onBack: () => void;
}

export default function RecipeScreen({ onBack }: Props) {
  const COLORS = useTheme().colors;
  const styles = makeStyles(COLORS);
  const { user } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [recipeName, setRecipeName] = useState('');
  const [servings, setServings] = useState('1');
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);
  const [ingName, setIngName] = useState('');
  const [ingGrams, setIngGrams] = useState('');
  const [ingCal, setIngCal] = useState('');
  const [ingP, setIngP] = useState('');
  const [ingC, setIngC] = useState('');
  const [ingF, setIngF] = useState('');

  const load = useCallback(async () => {
    const r = await getRecipes(user?.uid);
    setRecipes(r);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const addIngredient = () => {
    if (!ingName.trim()) return;
    ingredients.push({
      name: ingName.trim(),
      grams: parseFloat(ingGrams) || 0,
      calories: parseFloat(ingCal) || 0,
      protein: parseFloat(ingP) || 0,
      carbs: parseFloat(ingC) || 0,
      fat: parseFloat(ingF) || 0,
    });
    setIngredients([...ingredients]);
    setIngName(''); setIngGrams(''); setIngCal(''); setIngP(''); setIngC(''); setIngF('');
  };

  const saveRecipe = async () => {
    if (!recipeName.trim() || ingredients.length === 0) {
      Alert.alert('Error', 'Add a name and at least one ingredient.');
      return;
    }
    const s = parseInt(servings) || 1;
    const recipe: Recipe = {
      id: generateId(),
      name: recipeName.trim(),
      ingredients,
      totalCalories: ingredients.reduce((a, i) => a + i.calories, 0),
      totalProtein: ingredients.reduce((a, i) => a + i.protein, 0),
      totalCarbs: ingredients.reduce((a, i) => a + i.carbs, 0),
      totalFat: ingredients.reduce((a, i) => a + i.fat, 0),
      servings: s,
      createdAt: Date.now(),
    };
    await addRecipe(recipe, user?.uid);
    setShowCreate(false);
    setRecipeName(''); setServings('1'); setIngredients([]);
    await load();
  };

  const logRecipe = async (recipe: Recipe) => {
    if (!user) return;
    const perServing = {
      calories: Math.round(recipe.totalCalories / recipe.servings),
      protein: Math.round(recipe.totalProtein / recipe.servings * 10) / 10,
      carbs: Math.round(recipe.totalCarbs / recipe.servings * 10) / 10,
      fat: Math.round(recipe.totalFat / recipe.servings * 10) / 10,
    };
    await addMeal({
      id: generateId(),
      foodName: recipe.name,
      calories: perServing.calories,
      protein: perServing.protein,
      carbs: perServing.carbs,
      fat: perServing.fat,
      servingSize: `1/${recipe.servings} recipe`,
      quantity: 1,
      mealType: 'lunch' as MealType,
      date: Date.now(),
      createdAt: Date.now(),
    }, user.uid);
    Alert.alert('Added', `${recipe.name} logged as lunch (1 serving).`);
  };

  const handleDelete = (r: Recipe) => {
    Alert.alert('Delete', `Delete "${r.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteRecipe(r.id); await load(); } },
    ]);
  };

  if (showCreate) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setShowCreate(false)}>
            <Ionicons name="chevron-back" size={28} color={COLORS.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Recipe</Text>
          <View style={{ width: 28 }} />
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Recipe Name</Text>
          <TextInput style={styles.fieldInput} value={recipeName} onChangeText={setRecipeName} placeholder="e.g. Chicken Bowl" placeholderTextColor={COLORS.textTertiary} />
        </View>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Servings</Text>
          <TextInput style={styles.fieldInput} value={servings} onChangeText={setServings} keyboardType="number-pad" />
        </View>

        <Text style={styles.sectionLabel}>Ingredients ({ingredients.length})</Text>
        {ingredients.map((ing, i) => (
          <View key={i} style={styles.ingRow}>
            <Text style={styles.ingName}>{ing.name} — {ing.grams}g</Text>
            <Text style={styles.ingMacro}>{ing.calories}cal | P{ing.protein} C{ing.carbs} F{ing.fat}</Text>
          </View>
        ))}

        <View style={styles.addIngSection}>
          <TextInput style={styles.smallInput} value={ingName} onChangeText={setIngName} placeholder="Name" placeholderTextColor={COLORS.textTertiary} />
          <View style={styles.ingInputRow}>
            <TextInput style={styles.numInput} value={ingGrams} onChangeText={setIngGrams} placeholder="g" keyboardType="decimal-pad" placeholderTextColor={COLORS.textTertiary} />
            <TextInput style={styles.numInput} value={ingCal} onChangeText={setIngCal} placeholder="cal" keyboardType="decimal-pad" placeholderTextColor={COLORS.textTertiary} />
            <TextInput style={styles.numInput} value={ingP} onChangeText={setIngP} placeholder="P" keyboardType="decimal-pad" placeholderTextColor={COLORS.textTertiary} />
            <TextInput style={styles.numInput} value={ingC} onChangeText={setIngC} placeholder="C" keyboardType="decimal-pad" placeholderTextColor={COLORS.textTertiary} />
            <TextInput style={styles.numInput} value={ingF} onChangeText={setIngF} placeholder="F" keyboardType="decimal-pad" placeholderTextColor={COLORS.textTertiary} />
          </View>
          <TouchableOpacity style={styles.addIngBtn} onPress={addIngredient}>
            <Ionicons name="add-circle" size={22} color={COLORS.primary} />
            <Text style={styles.addIngText}>Add Ingredient</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={saveRecipe}>
          <Text style={styles.saveBtnText}>Save Recipe</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Ionicons name="chevron-back" size={28} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recipes</Text>
        <TouchableOpacity onPress={() => setShowCreate(true)}>
          <Ionicons name="add-circle" size={28} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {recipes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="restaurant-outline" size={48} color={COLORS.textTertiary} />
          <Text style={styles.emptyText}>No recipes yet</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={() => setShowCreate(true)}>
            <Text style={styles.emptyBtnText}>Create Recipe</Text>
          </TouchableOpacity>
        </View>
      ) : (
        recipes.map((r) => (
          <View key={r.id} style={styles.recipeCard}>
            <View style={styles.recipeHeader}>
              <Text style={styles.recipeName}>{r.name}</Text>
              <TouchableOpacity onPress={() => handleDelete(r)}>
                <Ionicons name="trash-outline" size={20} color={COLORS.error} />
              </TouchableOpacity>
            </View>
            <Text style={styles.recipeMeta}>
              {r.ingredients.length} ingredients · {r.servings} serving{r.servings > 1 ? 's' : ''}
            </Text>
            <Text style={styles.recipeNutrition}>
              Per serving: {Math.round(r.totalCalories / r.servings)} kcal · P{Math.round(r.totalProtein / r.servings)}g · C{Math.round(r.totalCarbs / r.servings)}g · F{Math.round(r.totalFat / r.servings)}g
            </Text>
            <TouchableOpacity style={styles.logBtn} onPress={() => logRecipe(r)}>
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={styles.logBtnText}>Log 1 serving</Text>
            </TouchableOpacity>
          </View>
        ))
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
  field: {
    backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg, marginHorizontal: SPACING.lg, marginBottom: SPACING.sm,
  },
  fieldLabel: { fontSize: FONTS.sizes.xs, fontWeight: '600', color: COLORS.textSecondary, marginBottom: SPACING.xs },
  fieldInput: { fontSize: FONTS.sizes.lg, fontWeight: '600', color: COLORS.text },
  sectionLabel: {
    fontSize: FONTS.sizes.xs, fontWeight: '600', color: COLORS.textSecondary,
    textTransform: 'uppercase', marginLeft: SPACING.lg, marginTop: SPACING.lg, marginBottom: SPACING.sm,
  },
  ingRow: {
    backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.md, marginHorizontal: SPACING.lg, marginBottom: SPACING.xs,
  },
  ingName: { fontSize: FONTS.sizes.md, fontWeight: '600', color: COLORS.text },
  ingMacro: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, marginTop: 2 },
  addIngSection: { marginHorizontal: SPACING.lg, marginTop: SPACING.md },
  smallInput: {
    backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.md, fontSize: FONTS.sizes.md, color: COLORS.text, marginBottom: SPACING.sm,
  },
  ingInputRow: { flexDirection: 'row', gap: SPACING.xs },
  numInput: {
    flex: 1, backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm, fontSize: FONTS.sizes.sm, color: COLORS.text, textAlign: 'center',
  },
  addIngBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.xs, marginTop: SPACING.md,
  },
  addIngText: { fontSize: FONTS.sizes.md, color: COLORS.primary, fontWeight: '600' },
  saveBtn: {
    backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.md,
    paddingVertical: 16, marginHorizontal: SPACING.lg, alignItems: 'center', marginTop: SPACING.xxl,
  },
  saveBtnText: { color: '#fff', fontSize: FONTS.sizes.lg, fontWeight: '600' },
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyText: { fontSize: FONTS.sizes.md, color: COLORS.textTertiary, marginTop: SPACING.md },
  emptyBtn: {
    backgroundColor: COLORS.primary, borderRadius: 20, paddingVertical: 10, paddingHorizontal: 24, marginTop: SPACING.lg,
  },
  emptyBtnText: { color: '#fff', fontSize: FONTS.sizes.md, fontWeight: '600' },
  recipeCard: {
    backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg, marginHorizontal: SPACING.lg, marginBottom: SPACING.md,
  },
  recipeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  recipeName: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: COLORS.text },
  recipeMeta: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, marginTop: 4 },
  recipeNutrition: { fontSize: FONTS.sizes.sm, color: COLORS.textTertiary, marginTop: 2 },
  logBtn: {
    flexDirection: 'row', backgroundColor: COLORS.primary, borderRadius: 20,
    paddingVertical: 8, paddingHorizontal: 16, alignSelf: 'flex-start',
    alignItems: 'center', gap: 4, marginTop: SPACING.md,
  },
  logBtnText: { color: '#fff', fontSize: FONTS.sizes.sm, fontWeight: '600' },
});
