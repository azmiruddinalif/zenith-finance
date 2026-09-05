declare global {
  interface Window {
    google?: any;
  }
}

// Google Identity Services (GIS) Service for Zenith Finance
// Implements real OAuth 2.0 multi-user account selection with One Tap & Token Client

export interface GoogleUserInfo {
  sub: string;
  email: string;
  name: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
  email_verified?: boolean;
}

export interface GoogleAuthResult {
  success: boolean;
  user?: GoogleUserInfo;
  message?: string;
}

class GoogleAuthService {
  private defaultClientId = '1050289688020-f1jo0q8g0us5gvjarukoulj3nd1mqeji.apps.googleusercontent.com';
  private onCredentialCallback: ((user: GoogleUserInfo) => void) | null = null;
  private isInitialized = false;

  public getClientId(): string {
    const envId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID;
    if (envId && typeof envId === 'string' && envId.trim().length > 10) {
      return envId.trim();
    }
    return this.defaultClientId;
  }

  /**
   * Parse Google ID JWT credential into GoogleUserInfo
   */
  public parseJwtPayload(jwtToken: string): GoogleUserInfo | null {
    try {
      const base64Url = jwtToken.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const data = JSON.parse(jsonPayload);
      return {
        sub: data.sub || '',
        email: data.email || '',
        name: data.name || data.email?.split('@')[0] || 'Google User',
        picture: data.picture,
        given_name: data.given_name,
        family_name: data.family_name,
        email_verified: Boolean(data.email_verified),
      };
    } catch (e) {
      console.warn('[GoogleAuth] Failed to parse JWT payload:', e);
      return null;
    }
  }

  /**
   * Ensures GIS script is loaded
   */
  public async ensureGisLoaded(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    if ((window as any).google?.accounts?.id || (window as any).google?.accounts?.oauth2) {
      return true;
    }

    return new Promise((resolve) => {
      let script = document.querySelector('script[src*="accounts.google.com/gsi/client"]') as HTMLScriptElement;
      if (!script) {
        script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }

      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if ((window as any).google?.accounts?.id || (window as any).google?.accounts?.oauth2) {
          clearInterval(interval);
          resolve(true);
        } else if (attempts > 30) {
          clearInterval(interval);
          resolve(false);
        }
      }, 100);
    });
  }

  /**
   * Initializes Google One Tap and renders Google button if container provided
   */
  public async initializeOneTap(onSuccess: (user: GoogleUserInfo) => void): Promise<void> {
    this.onCredentialCallback = onSuccess;

    const loaded = await this.ensureGisLoaded();
    if (!loaded || !(window as any).google?.accounts?.id) return;

    try {
      (window as any).google.accounts.id.initialize({
        client_id: this.getClientId(),
        callback: (res: { credential?: string }) => {
          if (res?.credential) {
            const user = this.parseJwtPayload(res.credential);
            if (user && user.email) {
              if (this.onCredentialCallback) {
                this.onCredentialCallback(user);
              }
            }
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      });
      this.isInitialized = true;

      // Trigger One Tap prompt (non-intrusive for browsers with active Google sessions)
      (window as any).google.accounts.id.prompt();
    } catch (err) {
      console.warn('[GoogleAuth] One Tap init error:', err);
    }
  }

  /**
   * Trigger Google Account selector popup via GIS Token Client
   */
  public async signInWithGoogle(): Promise<GoogleAuthResult> {
    const loaded = await this.ensureGisLoaded();
    if (!loaded) {
      return {
        success: false,
        message: 'Google Identity Service failed to load. Please check your internet connection.',
      };
    }

    const clientId = this.getClientId();

    return new Promise((resolve) => {
      let resolved = false;

      // Try GIS OAuth2 Token Client
      if ((window as any).google?.accounts?.oauth2) {
        try {
          const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: 'openid email profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
            prompt: 'select_account',
            callback: async (tokenResponse: any) => {
              if (resolved) return;

              if (tokenResponse.error) {
                resolved = true;
                return resolve({
                  success: false,
                  message: tokenResponse.error_description || tokenResponse.error || 'Google Sign-In was cancelled.',
                });
              }

              if (!tokenResponse.access_token) {
                resolved = true;
                return resolve({
                  success: false,
                  message: 'No access token received from Google.',
                });
              }

              // Fetch authentic user profile from Google's userinfo endpoint
              try {
                const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                });

                if (!res.ok) {
                  resolved = true;
                  return resolve({
                    success: false,
                    message: `Google API responded with status ${res.status}`,
                  });
                }

                const userInfo: GoogleUserInfo = await res.json();
                if (!userInfo.email) {
                  resolved = true;
                  return resolve({
                    success: false,
                    message: 'No email found in Google account profile.',
                  });
                }

                resolved = true;
                return resolve({
                  success: true,
                  user: userInfo,
                });
              } catch (err: any) {
                resolved = true;
                return resolve({
                  success: false,
                  message: err.message || 'Failed to retrieve profile from Google.',
                });
              }
            },
            error_callback: (err: any) => {
              if (resolved) return;
              resolved = true;
              resolve({
                success: false,
                message: err?.message || 'Google popup closed or blocked.',
              });
            },
          });

          tokenClient.requestAccessToken({ prompt: 'select_account' });
          return;
        } catch (err: any) {
          console.warn('[GoogleAuth] Token client init failed:', err);
        }
      }

      // If token client couldn't be initialized
      if (!resolved) {
        resolved = true;
        resolve({
          success: false,
          message: 'Google Sign-In popup could not be opened.',
        });
      }
    });
  }
}

export const googleAuthService = new GoogleAuthService();
