import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient, User } from '@/lib/apiClient';
import { hydrateUserData, clearUserData } from '@/lib/dataHydration';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  restoreSession: () => Promise<void>;
  setAuthState: (user: User, token: string) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true, // Start as true to prevent redirect before session check
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.login(email, password);
          
          // Store token in localStorage
          localStorage.setItem('auth_token', response.token);

          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            isLoading: false,
          });

          // Hydrate user data from backend
          await hydrateUserData();
        } catch (error: any) {
          set({
            error: error.message || 'Login failed',
            isLoading: false,
            isAuthenticated: false,
          });
          throw error;
        }
      },

      register: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          // Note: Register now returns a different response (OTP verification required)
          // This method is kept for backward compatibility but may not be used
          const response = await apiClient.register(email, password);
          
          // Registration successful but requires OTP verification
          // No token is returned at this stage
          set({
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          set({
            error: error.message || 'Registration failed',
            isLoading: false,
          });
          throw error;
        }
      },

      logout: () => {
        localStorage.removeItem('auth_token');
        clearUserData();
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      },

      restoreSession: async () => {
        const token = localStorage.getItem('auth_token');
        
        if (!token) {
          set({ 
            isAuthenticated: false, 
            isLoading: false,
            user: null,
            token: null 
          });
          return;
        }

        set({ isLoading: true });
        try {
          const user = await apiClient.getCurrentUser();
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });

          // Hydrate user data from backend
          await hydrateUserData();
        } catch (error) {
          // Token is invalid or expired
          console.error('Session restore failed:', error);
          localStorage.removeItem('auth_token');
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      setAuthState: async (user: User, token: string) => {
        localStorage.setItem('auth_token', token);
        
        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });

        // Hydrate user data from backend
        await hydrateUserData();
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => {
        return (state, error) => {
          if (error) {
            console.error('Failed to rehydrate auth state:', error);
          }
          // After rehydration, if we have a token, we need to validate it
          // The isLoading will be set to false by restoreSession()
        };
      },
    }
  )
);
