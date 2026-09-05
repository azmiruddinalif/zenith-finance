import { UserProfile } from '../context/AuthContext';

export type SocialProvider = 'google' | 'facebook' | 'apple' | 'github';

export interface AuthResponseData {
  token: string;
  user: UserProfile;
}

export interface ServiceResult<T> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface IAuthService {
  getToken(): string | null;
  setToken(token: string): void;
  clearToken(): void;
  getMe(token?: string): Promise<ServiceResult<UserProfile>>;
  login(email: string, pass: string): Promise<ServiceResult<AuthResponseData>>;
  register(name: string, email: string, pass: string, defaultCurrency?: string): Promise<ServiceResult<AuthResponseData>>;
  socialLogin(provider: SocialProvider, email: string, name?: string, defaultCurrency?: string): Promise<ServiceResult<AuthResponseData>>;
  updateProfile(data: { name?: string; defaultCurrency?: string; monthlyBudget?: number }, token?: string): Promise<ServiceResult<UserProfile>>;
}

class AuthService implements IAuthService {
  private readonly TOKEN_KEY = 'zenith_token';

  private getApiBase(): string {
    const envUrl = (import.meta as any).env?.VITE_API_URL;
    if (envUrl && typeof envUrl === 'string' && envUrl.startsWith('http')) {
      return envUrl.replace(/\/+$/, '');
    }
    return 'https://server-ashy-xi-93.vercel.app/api';
  }

  public getToken(): string | null {
    try {
      return localStorage.getItem(this.TOKEN_KEY);
    } catch {
      return null;
    }
  }

  public setToken(token: string): void {
    try {
      localStorage.setItem(this.TOKEN_KEY, token);
    } catch (e) {
      console.warn('[AuthService] Could not persist token:', e);
    }
  }

  public clearToken(): void {
    try {
      localStorage.removeItem(this.TOKEN_KEY);
    } catch (e) {
      console.warn('[AuthService] Could not clear token:', e);
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ServiceResult<T>> {
    const url = `${this.getApiBase()}${endpoint}`;
    try {
      const res = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
      });

      let json: any = {};
      try {
        json = await res.json();
      } catch {
        return { success: false, message: 'Server returned an invalid non-JSON response' };
      }

      if (res.ok && json.success) {
        return { success: true, data: json.data, message: json.message };
      }

      return { success: false, message: json.message || `HTTP error ${res.status}` };
    } catch (err: any) {
      return { success: false, message: err.message || 'Unable to connect to server' };
    }
  }

  public async getMe(providedToken?: string): Promise<ServiceResult<UserProfile>> {
    const token = providedToken || this.getToken();
    if (!token) return { success: false, message: 'No active session' };

    return this.request<UserProfile>('/auth/me', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  public async login(email: string, pass: string): Promise<ServiceResult<AuthResponseData>> {
    const result = await this.request<AuthResponseData>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: email.trim(), password: pass }),
    });

    if (result.success && result.data?.token) {
      this.setToken(result.data.token);
    }
    return result;
  }

  public async register(
    name: string,
    email: string,
    pass: string,
    defaultCurrency = 'BDT'
  ): Promise<ServiceResult<AuthResponseData>> {
    const result = await this.request<AuthResponseData>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: name.trim(), email: email.trim(), password: pass, defaultCurrency }),
    });

    if (result.success && result.data?.token) {
      this.setToken(result.data.token);
    }
    return result;
  }

  public async socialLogin(
    provider: SocialProvider,
    email: string,
    name?: string,
    defaultCurrency = 'BDT'
  ): Promise<ServiceResult<AuthResponseData>> {
    const result = await this.request<AuthResponseData>('/auth/social-login', {
      method: 'POST',
      body: JSON.stringify({ provider, email: email.trim(), name: name?.trim(), defaultCurrency }),
    });

    if (result.success && result.data?.token) {
      this.setToken(result.data.token);
    }
    return result;
  }

  public async updateProfile(
    data: { name?: string; defaultCurrency?: string; monthlyBudget?: number },
    providedToken?: string
  ): Promise<ServiceResult<UserProfile>> {
    const token = providedToken || this.getToken();
    if (!token) return { success: false, message: 'Not authenticated' };

    return this.request<UserProfile>('/auth/profile', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  }
}

export const authService = new AuthService();
