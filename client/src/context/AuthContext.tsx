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
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
        const res = await fetch(`${(import.meta as any).env?.VITE_API_URL || 'http://localhost:5001/api'}/auth/me`, {
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
        // If server offline, keep saved token
      } finally {
        setIsLoading(false);
      }
    };

    hydrateUser();
  }, []);

  const login = async (email: string, pass: string) => {
    try {
      const res = await fetch(`${(import.meta as any).env?.VITE_API_URL || 'http://localhost:5001/api'}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        localStorage.setItem('zenith_token', data.data.token);
        setToken(data.data.token);
        setUser(data.data.user);
        return { success: true };
      }
      return { success: false, message: data.message || 'Login failed' };
    } catch {
      return { success: false, message: 'Server is unreachable' };
    }
  };

  const register = async (name: string, email: string, pass: string, defaultCurrency = 'BDT') => {
    try {
      const res = await fetch(`${(import.meta as any).env?.VITE_API_URL || 'http://localhost:5001/api'}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password: pass, defaultCurrency }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        localStorage.setItem('zenith_token', data.data.token);
        setToken(data.data.token);
        setUser(data.data.user);
        return { success: true };
      }
      return { success: false, message: data.message || 'Registration failed' };
    } catch {
      return { success: false, message: 'Server is unreachable' };
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
