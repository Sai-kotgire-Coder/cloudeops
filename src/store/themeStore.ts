import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { toast } from 'sonner';

export type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'dark',

      toggleTheme: () => {
        const newTheme = get().theme === 'dark' ? 'light' : 'dark';
        set({ theme: newTheme });
        
        // Apply to document
        document.documentElement.classList.remove('dark', 'light');
        document.documentElement.classList.add(newTheme);
        
        // Show notification
        toast.success(`Theme changed to ${newTheme === 'dark' ? 'Dark' : 'Light'} Mode`, {
          duration: 2000,
        });
      },

      setTheme: (theme) => {
        set({ theme });
        document.documentElement.classList.remove('dark', 'light');
        document.documentElement.classList.add(theme);
      },
    }),
    {
      name: 'cloudops-theme',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => {
        return (state) => {
          if (state) {
            // Apply theme immediately on restore
            document.documentElement.classList.remove('dark', 'light');
            document.documentElement.classList.add(state.theme);
          }
        };
      },
    }
  )
);

// Initialize theme on module load
if (typeof window !== 'undefined') {
  const stored = localStorage.getItem('cloudops-theme');
  if (stored) {
    try {
      const { state } = JSON.parse(stored);
      if (state?.theme) {
        document.documentElement.classList.add(state.theme);
      }
    } catch (e) {
      // Fallback to dark
      document.documentElement.classList.add('dark');
    }
  } else {
    // Check system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.add(prefersDark ? 'dark' : 'light');
  }
}
