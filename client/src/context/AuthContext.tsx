import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  defaultCurrency: string;
  monthlyBudget: number;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; message?: string }>;
  register: (name: string, email: string, pass: string, currency?: string) => Promise<{ success: boolean; message?: string }>;
  socialLogin: (provider: 'google' | 'facebook', email: string, name?: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getApiBase = (): string => {
  const envUrl = (import.meta as any).env?.VITE_API_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.startsWith('http')) {
    return envUrl.replace(/\/+$/, '');
  }
  return 'https://server-ashy-xi-93.vercel.app/api';
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('zenith_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Hydrate user profile on load
  useEffect(() => {
    const hydrateUser = async () => {
      const savedToken = localStorage.getItem('zenith_token');
      if (!savedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch(`${getApiBase()}/auth/me`, {
          headers: { Authorization: `Bearer ${savedToken}` },
        });
        const data = await res.json();
        if (data.success && data.data) {
          setUser(data.data);
          setToken(savedToken);
        } else {
          logout();
        }
      } catch {
        // If server temporarily offline, retain saved session
      } finally {
        setIsLoading(false);
      }
    };

    hydrateUser();
  }, []);

  const login = async (email: string, pass: string) => {
    try {
      const res = await fetch(`${getApiBase()}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password: pass }),
      });
      let data: any = {};
      try {
        data = await res.json();
      } catch {
        return { success: false, message: 'Server returned an invalid response' };
      }
      if (data.success && data.data) {
        localStorage.setItem('zenith_token', data.data.token);
        setToken(data.data.token);
        setUser(data.data.user);
        return { success: true };
      }
      return { success: false, message: data.message || 'Invalid email or password' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Unable to connect to server' };
    }
  };

  const register = async (name: string, email: string, pass: string, defaultCurrency = 'BDT') => {
    try {
      const res = await fetch(`${getApiBase()}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password: pass, defaultCurrency }),
      });
      let data: any = {};
      try {
        data = await res.json();
      } catch {
        return { success: false, message: 'Server returned an invalid response' };
      }
      if (data.success && data.data) {
        localStorage.setItem('zenith_token', data.data.token);
        setToken(data.data.token);
        setUser(data.data.user);
        return { success: true };
      }
      return { success: false, message: data.message || 'Registration failed' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Unable to connect to server' };
    }
  };

  const socialLogin = async (provider: 'google' | 'facebook', email: string, name?: string) => {
    try {
      const res = await fetch(`${getApiBase()}/auth/social-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, email: email.trim(), name: name?.trim() }),
      });
      let data: any = {};
      try {
        data = await res.json();
      } catch {
        return { success: false, message: 'Server returned an invalid response' };
      }
      if (data.success && data.data) {
        localStorage.setItem('zenith_token', data.data.token);
        setToken(data.data.token);
        setUser(data.data.user);
        return { success: true };
      }
      return { success: false, message: data.message || `${provider} sign-in failed` };
    } catch (err: any) {
      return { success: false, message: err.message || 'Unable to connect to server' };
    }
  };

  const logout = () => {
    localStorage.removeItem('zenith_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(token),
        isLoading,
        login,
        register,
        socialLogin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
