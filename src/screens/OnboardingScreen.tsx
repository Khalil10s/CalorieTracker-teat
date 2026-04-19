import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { FitnessGoal, Gender, ActivityLevel } from '../types';
import { FONTS, SPACING, BORDER_RADIUS } from '../utils/constants';
import { useTheme } from '../contexts/ThemeContext';

interface Props {
  onComplete: () => void;
}

const TOTAL_STEPS = 9;

const IMPORTANT_OPTIONS = [
  'Healthy aging',
  'Stable energy',
  'Better nutrition without strict diets',
  'Better training results',
  'Stress reduction around food',
  'Hormonal balance',
  'Better routines',
];

const CHALLENGE_OPTIONS = [
  'Maintaining routines',
  'Planning what I will eat',
  'Difficulty resisting temptations',
  'Determining reasonable portion sizes',
  'Finding inspiration',
  'Making healthy choices',
  'Feeling encouragement from my surroundings',
];

export default function OnboardingScreen({ onComplete }: Props) {
  const COLORS = useTheme().colors;
  const styles = makeStyles(COLORS);
  const { updateProfile, profile } = useAuth();

  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState<FitnessGoal | null>(null);
  const [gender, setGender] = useState<Gender | null>(null);
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [currentWeight, setCurrentWeight] = useState('');
  const [goalWeight, setGoalWeight] = useState('');
  const [importantTo, setImportantTo] = useState<string[]>([]);
  const [challenges, setChallenges] = useState<string[]>([]);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | null>(null);

  const toggleMulti = (arr: string[], val: string, setter: (v: string[]) => void) => {
    setter(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
  };

  const canNext = () => {
    switch (step) {
      case 0: return goal !== null;
      case 1: return gender !== null;
      case 2: return age.trim() !== '' && !isNaN(Number(age)) && Number(age) > 0;
      case 3: return height.trim() !== '' && !isNaN(Number(height)) && Number(height) > 0;
      case 4: return currentWeight.trim() !== '' && !isNaN(Number(currentWeight)) && Number(currentWeight) > 0;
      case 5: return goalWeight.trim() !== '' && !isNaN(Number(goalWeight)) && Number(goalWeight) > 0;
      case 6: return importantTo.length > 0;
      case 7: return challenges.length > 0;
      case 8: return activityLevel !== null;
      default: return false;
    }
  };

  const handleFinish = async () => {
    const ageNum = parseInt(age);
    const heightNum = parseInt(height);
    const weightNum = parseFloat(currentWeight);
    const goalWeightNum = parseFloat(goalWeight);

    // Mifflin-St Jeor BMR
    let bmr = 10 * weightNum + 6.25 * heightNum - 5 * ageNum;
    bmr += gender === 'female' ? -161 : 5;

    const activityMultiplier =
      activityLevel === 'sedentary' ? 1.2 :
      activityLevel === 'partly_active' ? 1.375 :
      activityLevel === 'active' ? 1.55 : 1.725;

    let tdee = Math.round(bmr * activityMultiplier);

    if (goal === 'lose_weight') tdee -= 500;
    else if (goal === 'build_muscle') tdee += 300;

    const calGoal = Math.max(1200, Math.round(tdee));
    const proteinGoal = goal === 'build_muscle' ? Math.round(weightNum * 2) : Math.round(weightNum * 1.6);
    const fatGoal = Math.round((calGoal * 0.25) / 9);
    const carbsGoal = Math.round((calGoal - proteinGoal * 4 - fatGoal * 9) / 4);

    await updateProfile({
      fitnessGoal: goal!,
      gender: gender!,
      age: ageNum,
      height: heightNum,
      currentWeight: weightNum,
      goalWeight: goalWeightNum,
      importantTo,
      challenges,
      activityLevel: activityLevel!,
      calorieGoal: calGoal,
      proteinGoal: Math.max(50, proteinGoal),
      carbsGoal: Math.max(50, carbsGoal),
      fatGoal: Math.max(20, fatGoal),
      hasCompletedOnboarding: true,
    });
    onComplete();
  };

  const next = () => {
    if (step === TOTAL_STEPS - 1) {
      handleFinish();
    } else {
      setStep(step + 1);
    }
  };

  const back = () => {
    if (step > 0) setStep(step - 1);
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>What's your goal?</Text>
            <Text style={styles.stepSubtitle}>We'll personalize your plan based on this</Text>
            {([
              { key: 'lose_weight' as FitnessGoal, label: 'Lose weight', icon: 'trending-down', desc: 'Burn fat and get leaner' },
              { key: 'build_muscle' as FitnessGoal, label: 'Build muscle', icon: 'barbell', desc: 'Gain strength and muscle mass' },
              { key: 'eat_healthy' as FitnessGoal, label: 'Eat healthy', icon: 'leaf', desc: 'Balanced nutrition and wellness' },
            ]).map((item) => (
              <TouchableOpacity
                key={item.key}
                style={[styles.optionCard, goal === item.key && styles.optionCardSelected]}
                onPress={() => setGoal(item.key)}
                activeOpacity={0.7}
              >
                <View style={[styles.optionIcon, goal === item.key && styles.optionIconSelected]}>
                  <Ionicons name={item.icon as any} size={24} color={goal === item.key ? '#fff' : COLORS.primary} />
                </View>
                <View style={styles.optionTextWrap}>
                  <Text style={[styles.optionLabel, goal === item.key && styles.optionLabelSelected]}>{item.label}</Text>
                  <Text style={styles.optionDesc}>{item.desc}</Text>
                </View>
                {goal === item.key && <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        );

      case 1:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>What's your gender?</Text>
            <Text style={styles.stepSubtitle}>This helps us calculate your daily needs</Text>
            {([
              { key: 'male' as Gender, label: 'Male', icon: 'male' },
              { key: 'female' as Gender, label: 'Female', icon: 'female' },
              { key: 'other' as Gender, label: 'Other', icon: 'person' },
            ]).map((item) => (
              <TouchableOpacity
                key={item.key}
                style={[styles.optionCard, gender === item.key && styles.optionCardSelected]}
                onPress={() => setGender(item.key)}
                activeOpacity={0.7}
              >
                <View style={[styles.optionIcon, gender === item.key && styles.optionIconSelected]}>
                  <Ionicons name={item.icon as any} size={24} color={gender === item.key ? '#fff' : COLORS.primary} />
                </View>
                <Text style={[styles.optionLabel, gender === item.key && styles.optionLabelSelected, { flex: 1 }]}>{item.label}</Text>
                {gender === item.key && <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>How old are you?</Text>
            <Text style={styles.stepSubtitle}>Age affects your calorie needs</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.bigInput}
                value={age}
                onChangeText={setAge}
                keyboardType="number-pad"
                placeholder="25"
                placeholderTextColor={COLORS.textTertiary}
                maxLength={3}
              />
              <Text style={styles.inputUnit}>years</Text>
            </View>
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>How tall are you?</Text>
            <Text style={styles.stepSubtitle}>Used for accurate calorie calculation</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.bigInput}
                value={height}
                onChangeText={setHeight}
                keyboardType="number-pad"
                placeholder="175"
                placeholderTextColor={COLORS.textTertiary}
                maxLength={3}
              />
              <Text style={styles.inputUnit}>cm</Text>
            </View>
          </View>
        );

      case 4:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>What's your current weight?</Text>
            <Text style={styles.stepSubtitle}>We'll track your progress from here</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.bigInput}
                value={currentWeight}
                onChangeText={setCurrentWeight}
                keyboardType="decimal-pad"
                placeholder="75"
                placeholderTextColor={COLORS.textTertiary}
                maxLength={5}
              />
              <Text style={styles.inputUnit}>{profile?.weightUnit || 'kg'}</Text>
            </View>
          </View>
        );

      case 5:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>What's your goal weight?</Text>
            <Text style={styles.stepSubtitle}>We'll help you get there</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.bigInput}
                value={goalWeight}
                onChangeText={setGoalWeight}
                keyboardType="decimal-pad"
                placeholder="70"
                placeholderTextColor={COLORS.textTertiary}
                maxLength={5}
              />
              <Text style={styles.inputUnit}>{profile?.weightUnit || 'kg'}</Text>
            </View>
          </View>
        );

      case 6:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>What is important for you?</Text>
            <Text style={styles.stepSubtitle}>Select all that apply</Text>
            {IMPORTANT_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[styles.multiCard, importantTo.includes(opt) && styles.multiCardSelected]}
                onPress={() => toggleMulti(importantTo, opt, setImportantTo)}
                activeOpacity={0.7}
              >
                <Text style={[styles.multiLabel, importantTo.includes(opt) && styles.multiLabelSelected]}>{opt}</Text>
                <View style={[styles.checkbox, importantTo.includes(opt) && styles.checkboxSelected]}>
                  {importantTo.includes(opt) && <Ionicons name="checkmark" size={16} color="#fff" />}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        );

      case 7:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>What is challenging for you?</Text>
            <Text style={styles.stepSubtitle}>Select all that apply</Text>
            {CHALLENGE_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[styles.multiCard, challenges.includes(opt) && styles.multiCardSelected]}
                onPress={() => toggleMulti(challenges, opt, setChallenges)}
                activeOpacity={0.7}
              >
                <Text style={[styles.multiLabel, challenges.includes(opt) && styles.multiLabelSelected]}>{opt}</Text>
                <View style={[styles.checkbox, challenges.includes(opt) && styles.checkboxSelected]}>
                  {challenges.includes(opt) && <Ionicons name="checkmark" size={16} color="#fff" />}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        );

      case 8:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>What does a normal day look like?</Text>
            <Text style={styles.stepSubtitle}>Your activity level helps set your calorie goal</Text>
            {([
              { key: 'sedentary' as ActivityLevel, label: 'Mostly sedentary', icon: 'desktop-outline', desc: 'Desk job, little exercise' },
              { key: 'partly_active' as ActivityLevel, label: 'Partly physically active', icon: 'walk-outline', desc: 'Light activity or walking' },
              { key: 'active' as ActivityLevel, label: 'Physically active most days', icon: 'bicycle-outline', desc: 'Regular movement throughout the day' },
              { key: 'exercise_regularly' as ActivityLevel, label: 'I exercise regularly', icon: 'fitness-outline', desc: 'Structured workouts 4+ times/week' },
            ]).map((item) => (
              <TouchableOpacity
                key={item.key}
                style={[styles.optionCard, activityLevel === item.key && styles.optionCardSelected]}
                onPress={() => setActivityLevel(item.key)}
                activeOpacity={0.7}
              >
                <View style={[styles.optionIcon, activityLevel === item.key && styles.optionIconSelected]}>
                  <Ionicons name={item.icon as any} size={24} color={activityLevel === item.key ? '#fff' : COLORS.primary} />
                </View>
                <View style={styles.optionTextWrap}>
                  <Text style={[styles.optionLabel, activityLevel === item.key && styles.optionLabelSelected]}>{item.label}</Text>
                  <Text style={styles.optionDesc}>{item.desc}</Text>
                </View>
                {activityLevel === item.key && <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LinearGradient
        colors={['#3BB89E', '#7BC67E', '#B8C466']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerRow}>
          {step > 0 ? (
            <TouchableOpacity onPress={back} style={styles.backBtn} activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 40 }} />
          )}
          <Text style={styles.stepCounter}>{step + 1} / {TOTAL_STEPS}</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${((step + 1) / TOTAL_STEPS) * 100}%` }]} />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {renderStep()}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.nextBtn, !canNext() && styles.nextBtnDisabled]}
          onPress={next}
          disabled={!canNext()}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={canNext() ? ['#3BB89E', '#7BC67E'] : [COLORS.border, COLORS.border]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.nextBtnGradient}
          >
            <Text style={[styles.nextBtnText, !canNext() && { color: COLORS.textTertiary }]}>
              {step === TOTAL_STEPS - 1 ? 'Get Started' : 'Continue'}
            </Text>
            <Ionicons
              name={step === TOTAL_STEPS - 1 ? 'checkmark' : 'arrow-forward'}
              size={20}
              color={canNext() ? '#fff' : COLORS.textTertiary}
            />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (COLORS: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerGradient: {
    paddingTop: 56,
    paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCounter: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 0.5,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xxl,
    paddingBottom: 120,
  },
  stepContent: {
    gap: SPACING.md,
  },
  stepTitle: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  stepSubtitle: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    gap: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  optionCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}10`,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${COLORS.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIconSelected: {
    backgroundColor: COLORS.primary,
  },
  optionTextWrap: {
    flex: 1,
  },
  optionLabel: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  optionLabelSelected: {
    color: COLORS.primary,
  },
  optionDesc: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  multiCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  multiCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}10`,
  },
  multiLabel: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
    marginRight: SPACING.sm,
  },
  multiLabelSelected: {
    color: COLORS.primary,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.xxl,
    gap: SPACING.md,
  },
  bigInput: {
    fontSize: FONTS.sizes.hero,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
    minWidth: 120,
    borderBottomWidth: 3,
    borderBottomColor: COLORS.primary,
    paddingVertical: SPACING.sm,
  },
  inputUnit: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  footer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 34,
    paddingTop: SPACING.md,
    backgroundColor: COLORS.background,
  },
  nextBtn: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  nextBtnDisabled: {
    opacity: 0.6,
  },
  nextBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    gap: SPACING.sm,
  },
  nextBtnText: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: '#fff',
  },
});
