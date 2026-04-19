import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_KEY = 'auth_user';

export interface LocalUser {
  uid: string;
  email: string;
  displayName: string;
}

let currentUser: LocalUser | null = null;
let listeners: ((user: LocalUser | null) => void)[] = [];

const notify = () => listeners.forEach((cb) => cb(currentUser));

export const initAuth = async (): Promise<LocalUser | null> => {
  const raw = await AsyncStorage.getItem(AUTH_KEY);
  currentUser = raw ? JSON.parse(raw) : null;
  return currentUser;
};

export const signUp = async (email: string, _password: string, displayName: string): Promise<LocalUser> => {
  const user: LocalUser = {
    uid: Date.now().toString(36),
    email: email.toLowerCase(),
    displayName,
  };
  await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(user));
  currentUser = user;
  notify();
  return user;
};

export const signIn = async (email: string, _password: string): Promise<LocalUser> => {
  // In offline mode, just restore or create local user
  const existing = await AsyncStorage.getItem(AUTH_KEY);
  if (existing) {
    currentUser = JSON.parse(existing);
    notify();
    return currentUser!;
  }
  // Auto-create if no account exists
  return signUp(email, '', email.split('@')[0]);
};

export const signOut = async (): Promise<void> => {
  await AsyncStorage.removeItem(AUTH_KEY);
  currentUser = null;
  notify();
};

export const resetPassword = async (_email: string): Promise<void> => {
  // No-op in offline mode
};

export const onAuthChange = (callback: (user: LocalUser | null) => void): (() => void) => {
  listeners.push(callback);
  // Fire immediately with current state
  setTimeout(() => callback(currentUser), 0);
  return () => {
    listeners = listeners.filter((cb) => cb !== callback);
  };
};

export const getCurrentUser = (): LocalUser | null => currentUser;
