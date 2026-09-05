import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { localDb } from '../services/offlineDb';
import { authService, SocialProvider, ServiceResult } from '../services/authService';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  defaultCurrency: string;
  monthlyBudget: number;
  createdAt?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isProfileModalOpen: boolean;
  setIsProfileModalOpen: (open: boolean) => void;
  login: (email: string, pass: string) => Promise<ServiceResult<any>>;
  register: (name: string, email: string, pass: string, currency?: string) => Promise<ServiceResult<any>>;
  socialLogin: (provider: SocialProvider, email: string, name?: string, defaultCurrency?: string) => Promise<ServiceResult<any>>;
  updateUserProfile: (data: { name?: string; defaultCurrency?: string; monthlyBudget?: number }) => Promise<ServiceResult<UserProfile>>;
  refreshUserProfile: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(authService.getToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);

  // Hydrate user profile on load
  useEffect(() => {
    let isMounted = true;

    const hydrateUser = async () => {
      const savedToken = authService.getToken();
      if (!savedToken) {
        if (isMounted) setIsLoading(false);
        return;
      }

      const res = await authService.getMe(savedToken);
      if (!isMounted) return;

      if (res.success && res.data) {
        setUser(res.data);
        setToken(savedToken);
      } else {
        await logout();
      }
      setIsLoading(false);
    };

    hydrateUser();
    return () => {
      isMounted = false;
    };
  }, []);

  const refreshUserProfile = async () => {
    const savedToken = token || authService.getToken();
    if (!savedToken) return;

    const res = await authService.getMe(savedToken);
    if (res.success && res.data) {
      setUser(res.data);
    }
  };

  const login = async (email: string, pass: string) => {
    const res = await authService.login(email, pass);
    if (res.success && res.data) {
      setToken(res.data.token);
      setUser(res.data.user);
    }
    return res;
  };

  const register = async (name: string, email: string, pass: string, defaultCurrency = 'BDT') => {
    const res = await authService.register(name, email, pass, defaultCurrency);
    if (res.success && res.data) {
      setToken(res.data.token);
      setUser(res.data.user);
    }
    return res;
  };

  const socialLogin = async (
    provider: SocialProvider,
    email: string,
    name?: string,
    defaultCurrency = 'BDT'
  ) => {
    const res = await authService.socialLogin(provider, email, name, defaultCurrency);
    if (res.success && res.data) {
      setToken(res.data.token);
      setUser(res.data.user);
    }
    return res;
  };

  const updateUserProfile = async (data: { name?: string; defaultCurrency?: string; monthlyBudget?: number }) => {
    const res = await authService.updateProfile(data, token || undefined);
    if (res.success && res.data) {
      setUser((prev) => (prev ? { ...prev, ...res.data } : res.data!));
    }
    return res;
  };

  const logout = async () => {
    authService.clearToken();
    setToken(null);
    setUser(null);
    setIsProfileModalOpen(false);

    try {
      await localDb.transactions.clear();
      await localDb.categories.clear();
      await localDb.accounts.clear();
      await localDb.syncQueue.clear();
    } catch (err) {
      console.warn('[Auth] Error clearing local cache on logout:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(token),
        isLoading,
        isProfileModalOpen,
        setIsProfileModalOpen,
        login,
        register,
        socialLogin,
        updateUserProfile,
        refreshUserProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

const fallbackAuthContext: AuthContextType = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  isProfileModalOpen: false,
  setIsProfileModalOpen: () => {},
  login: async () => ({ success: false, message: 'Auth not initialized' }),
  register: async () => ({ success: false, message: 'Auth not initialized' }),
  socialLogin: async () => ({ success: false, message: 'Auth not initialized' }),
  updateUserProfile: async () => ({ success: false, message: 'Auth not initialized' }),
  refreshUserProfile: async () => {},
  logout: async () => {},
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    console.warn('[useAuth] Context accessed outside AuthProvider; returning safe fallback.');
    return fallbackAuthContext;
  }
  return context;
};
