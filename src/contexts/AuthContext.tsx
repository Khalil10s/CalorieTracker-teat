import React, { createContext, useContext, useEffect, useState } from 'react';
import { LocalUser, initAuth, onAuthChange } from '../services/localAuthService';
import { getProfile, saveProfile } from '../services/firestoreService';
import { UserProfile, DEFAULT_PROFILE } from '../types';

interface AuthContextType {
  user: LocalUser | null;
  profile: UserProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  refreshProfile: async () => {},
  updateProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const boot = async () => {
      const restored = await initAuth();
      setUser(restored);
      if (restored) {
        let p = await getProfile(restored.uid);
        if (!p) {
          p = {
            uid: restored.uid,
            displayName: restored.displayName || '',
            email: restored.email || '',
            ...DEFAULT_PROFILE,
          };
          await saveProfile(p);
        }
        setProfile(p);
      }
      setLoading(false);
    };
    boot();

    const unsubscribe = onAuthChange(async (localUser) => {
      setUser(localUser);
      if (localUser) {
        let p = await getProfile(localUser.uid);
        if (!p) {
          p = {
            uid: localUser.uid,
            displayName: localUser.displayName || '',
            email: localUser.email || '',
            ...DEFAULT_PROFILE,
          };
          await saveProfile(p);
        }
        setProfile(p);
      } else {
        setProfile(null);
      }
    });
    return unsubscribe;
  }, []);

  const refreshProfile = async () => {
    if (user) {
      const p = await getProfile(user.uid);
      setProfile(p);
    }
  };

  const updateProfileFn = async (updates: Partial<UserProfile>) => {
    if (profile) {
      const updated = { ...profile, ...updates };
      await saveProfile(updated);
      setProfile(updated);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, refreshProfile, updateProfile: updateProfileFn }}>
      {children}
    </AuthContext.Provider>
  );
};
