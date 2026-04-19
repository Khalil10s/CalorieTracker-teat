import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { MealEntry, WeightEntry, UserProfile, FoodItem } from '../types';

const userDoc = (uid: string) => doc(db, 'users', uid);

// ---- Profile ----

export const saveProfile = async (profile: UserProfile): Promise<void> => {
  await setDoc(doc(collection(userDoc(profile.uid), 'profile'), 'main'), profile, { merge: true });
};

export const getProfile = async (uid: string): Promise<UserProfile | null> => {
  const snap = await getDoc(doc(collection(userDoc(uid), 'profile'), 'main'));
  return snap.exists() ? (snap.data() as UserProfile) : null;
};

// ---- Meals ----

export const addMeal = async (meal: MealEntry, uid: string): Promise<void> => {
  await setDoc(doc(collection(userDoc(uid), 'meals'), meal.id), meal);
};

export const getMealsForDate = async (date: Date, uid: string): Promise<MealEntry[]> => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const q = query(
    collection(userDoc(uid), 'meals'),
    where('date', '>=', startOfDay.getTime()),
    where('date', '<=', endOfDay.getTime()),
    orderBy('date', 'asc')
  );

  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as MealEntry);
};

export const getMealsForRange = async (start: Date, end: Date, uid: string): Promise<MealEntry[]> => {
  const startTime = new Date(start);
  startTime.setHours(0, 0, 0, 0);
  const endTime = new Date(end);
  endTime.setHours(23, 59, 59, 999);

  const q = query(
    collection(userDoc(uid), 'meals'),
    where('date', '>=', startTime.getTime()),
    where('date', '<=', endTime.getTime()),
    orderBy('date', 'asc')
  );

  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as MealEntry);
};

export const deleteMeal = async (mealId: string, uid: string): Promise<void> => {
  await deleteDoc(doc(collection(userDoc(uid), 'meals'), mealId));
};

export const getRecentMeals = async (uid: string, count: number = 20): Promise<MealEntry[]> => {
  const q = query(
    collection(userDoc(uid), 'meals'),
    orderBy('createdAt', 'desc'),
    limit(count)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as MealEntry);
};

// ---- Weight ----

export const addWeight = async (entry: WeightEntry, uid: string): Promise<void> => {
  await setDoc(doc(collection(userDoc(uid), 'weights'), entry.id), entry);
};

export const getWeights = async (uid: string, count: number = 90): Promise<WeightEntry[]> => {
  const q = query(
    collection(userDoc(uid), 'weights'),
    orderBy('date', 'desc'),
    limit(count)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as WeightEntry).reverse();
};

export const deleteWeight = async (entryId: string, uid: string): Promise<void> => {
  await deleteDoc(doc(collection(userDoc(uid), 'weights'), entryId));
};

// ---- Custom Foods ----

export const addCustomFood = async (food: FoodItem, uid: string): Promise<void> => {
  await setDoc(doc(collection(userDoc(uid), 'customFoods'), food.id), food);
};

export const getCustomFoods = async (uid: string): Promise<FoodItem[]> => {
  const q = query(collection(userDoc(uid), 'customFoods'), orderBy('name'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as FoodItem);
};
