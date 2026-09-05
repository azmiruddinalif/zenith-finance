// Facebook SDK Auth Service for Zenith Finance
// Multi-user authentication support

export interface FacebookUserInfo {
  id: string;
  name: string;
  email?: string;
  picture?: string;
}

export interface FacebookAuthResult {
  success: boolean;
  user?: FacebookUserInfo;
  message?: string;
}

declare global {
  interface Window {
    FB?: any;
    fbAsyncInit?: () => void;
  }
}

class FacebookAuthService {
  private appId: string = '983742819284729'; // Default/placeholder App ID or can be overridden by env

  private getAppId(): string {
    const envId = (import.meta as any).env?.VITE_FACEBOOK_APP_ID;
    if (envId && typeof envId === 'string' && envId.trim().length > 4) {
      return envId.trim();
    }
    return this.appId;
  }

  public async ensureFbLoaded(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    if (window.FB) return true;

    return new Promise((resolve) => {
      window.fbAsyncInit = () => {
        try {
          window.FB.init({
            appId: this.getAppId(),
            cookie: true,
            xfbml: true,
            version: 'v18.0',
          });
          resolve(true);
        } catch {
          resolve(false);
        }
      };

      let script = document.querySelector('script[src*="connect.facebook.net"]') as HTMLScriptElement;
      if (!script) {
        script = document.createElement('script');
        script.src = 'https://connect.facebook.net/en_US/sdk.js';
        script.async = true;
        script.defer = true;
        script.crossOrigin = 'anonymous';
        document.head.appendChild(script);
      }

      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if (window.FB) {
          clearInterval(interval);
          resolve(true);
        } else if (attempts > 25) {
          clearInterval(interval);
          resolve(false);
        }
      }, 100);
    });
  }

  public async signInWithFacebook(): Promise<FacebookAuthResult> {
    const loaded = await this.ensureFbLoaded();
    if (!loaded || !window.FB) {
      return {
        success: false,
        message: 'Facebook SDK is not available. Please use email sign-in or manual account connect.',
      };
    }

    return new Promise((resolve) => {
      try {
        window.FB.login(
          (response: any) => {
            if (response.authResponse) {
              window.FB.api('/me', { fields: 'id,name,email,picture' }, (profile: any) => {
                if (!profile || profile.error) {
                  return resolve({
                    success: false,
                    message: profile?.error?.message || 'Failed to get Facebook profile',
                  });
                }

                resolve({
                  success: true,
                  user: {
                    id: profile.id,
                    name: profile.name,
                    email: profile.email || `fb_${profile.id}@facebook.user`,
                    picture: profile.picture?.data?.url,
                  },
                });
              });
            } else {
              resolve({
                success: false,
                message: 'Facebook login was cancelled by the user.',
              });
            }
          },
          { scope: 'public_profile,email' }
        );
      } catch (err: any) {
        resolve({
          success: false,
          message: err.message || 'Error opening Facebook login dialog',
        });
      }
    });
  }
}

export const facebookAuthService = new FacebookAuthService();
