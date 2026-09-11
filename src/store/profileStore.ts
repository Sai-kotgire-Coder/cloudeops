import { create } from 'zustand';
import { toast } from 'sonner';
import { apiClient } from '@/lib/apiClient';
import { ALL_MODULE_IDS } from '@/data/moduleCatalog';

export interface ProfileFields {
  fullName: string;
  phone: string;
  linkedinUrl: string;
  instagramHandle: string;
  dateOfBirth: string; // ISO date (yyyy-mm-dd), '' if unset
  institute: string;
  occupation: string; // 'student' | 'professional' | 'other' | ''
}

export interface PlanInfo {
  isPro: boolean;
  planType: string;
  planExpiry: string | null;
}

interface ProfileState extends ProfileFields {
  selectedModules: string[];
  onboardingComplete: boolean;
  plan: PlanInfo | null;
  hydrated: boolean;

  hydrate: (data: Record<string, unknown>) => void;
  hydratePlan: (data: Record<string, unknown>) => void;
  saveProfile: (fields: Partial<ProfileFields>) => Promise<void>;
  toggleModule: (id: string) => void;
  completeOnboarding: (fields: Partial<ProfileFields>, modules: string[]) => Promise<void>;
}

const EMPTY_FIELDS: ProfileFields = {
  fullName: '',
  phone: '',
  linkedinUrl: '',
  instagramHandle: '',
  dateOfBirth: '',
  institute: '',
  occupation: '',
};

function fieldsFromBackend(data: Record<string, unknown>): ProfileFields {
  return {
    fullName: (data.fullName as string) ?? '',
    phone: (data.phone as string) ?? '',
    linkedinUrl: (data.linkedinUrl as string) ?? '',
    instagramHandle: (data.instagramHandle as string) ?? '',
    dateOfBirth: data.dateOfBirth ? String(data.dateOfBirth).slice(0, 10) : '',
    institute: (data.institute as string) ?? '',
    occupation: (data.occupation as string) ?? '',
  };
}

export const useProfileStore = create<ProfileState>()((set, get) => ({
  ...EMPTY_FIELDS,
  selectedModules: ALL_MODULE_IDS,
  onboardingComplete: true,
  plan: null,
  hydrated: false,

  hydrate: (data) => {
    set({
      ...fieldsFromBackend(data),
      selectedModules: Array.isArray(data.selectedModules) ? (data.selectedModules as string[]) : ALL_MODULE_IDS,
      onboardingComplete: data.onboardingComplete !== false,
      hydrated: true,
    });
  },

  hydratePlan: (data) => {
    set({
      plan: {
        isPro: !!data.isPro,
        planType: (data.planType as string) ?? 'free',
        planExpiry: (data.planExpiry as string) ?? null,
      },
    });
  },

  saveProfile: async (fields) => {
    set(fields);
    try {
      await apiClient.updateProfile(fields);
      toast.success('Profile saved');
    } catch (err) {
      console.error('Failed to save profile:', err);
      toast.error('Failed to save profile');
    }
  },

  toggleModule: (id) => {
    set((s) => ({
      selectedModules: s.selectedModules.includes(id)
        ? s.selectedModules.filter((m) => m !== id)
        : [...s.selectedModules, id],
    }));
    apiClient
      .updateProfile({ selectedModules: get().selectedModules })
      .catch((err) => console.error('Failed to sync selected modules:', err));
  },

  completeOnboarding: async (fields, modules) => {
    set({ ...fields, selectedModules: modules, onboardingComplete: true });
    try {
      await apiClient.updateProfile({ ...fields, selectedModules: modules, onboardingComplete: true });
    } catch (err) {
      console.error('Failed to save onboarding:', err);
      toast.error('Failed to save your setup — you can finish it later from My Account');
    }
  },
}));
