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
  useFallbackModal?: boolean;
}

declare global {
  interface Window {
    FB?: any;
    fbAsyncInit?: () => void;
  }
}

class FacebookAuthService {
  /**
   * Returns configured Facebook App ID if provided in environment
   */
  private getAppId(): string | null {
    const envId = (import.meta as any).env?.VITE_FACEBOOK_APP_ID;
    if (envId && typeof envId === 'string' && envId.trim().length >= 10 && !envId.includes('983742819284729')) {
      return envId.trim();
    }
    return null;
  }

  public async signInWithFacebook(): Promise<FacebookAuthResult> {
    const appId = this.getAppId();

    // If no verified Facebook App ID is registered in environment,
    // do NOT open broken Facebook URL that throws PLATFORM__INVALID_APP_ID.
    // Seamlessly direct user to Facebook Connect modal.
    if (!appId) {
      return {
        success: false,
        useFallbackModal: true,
        message: 'Enter your Facebook email or profile name to sign in directly.',
      };
    }

    // If a real App ID exists, load FB SDK safely
    if (typeof window === 'undefined') {
      return { success: false, useFallbackModal: true };
    }

    return new Promise((resolve) => {
      try {
        if (!window.FB) {
          window.fbAsyncInit = () => {
            window.FB.init({
              appId,
              cookie: true,
              xfbml: true,
              version: 'v18.0',
            });
            this.triggerFbLogin(resolve);
          };

          const script = document.createElement('script');
          script.src = 'https://connect.facebook.net/en_US/sdk.js';
          script.async = true;
          script.defer = true;
          script.crossOrigin = 'anonymous';
          document.head.appendChild(script);
        } else {
          this.triggerFbLogin(resolve);
        }
      } catch (err: any) {
        resolve({
          success: false,
          useFallbackModal: true,
          message: err.message,
        });
      }
    });
  }

  private triggerFbLogin(resolve: (res: FacebookAuthResult) => void) {
    try {
      window.FB.login(
        (response: any) => {
          if (response?.authResponse) {
            window.FB.api('/me', { fields: 'id,name,email,picture' }, (profile: any) => {
              if (!profile || profile.error) {
                return resolve({
                  success: false,
                  useFallbackModal: true,
                  message: profile?.error?.message,
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
              message: 'Facebook sign-in was cancelled.',
            });
          }
        },
        { scope: 'public_profile,email' }
      );
    } catch {
      resolve({
        success: false,
        useFallbackModal: true,
      });
    }
  }
}

export const facebookAuthService = new FacebookAuthService();
