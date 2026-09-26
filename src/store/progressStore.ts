import { create } from 'zustand';
import { apiClient } from '@/lib/apiClient';

export interface ModuleProgress {
  module: string;
  current: number;
  target: number;
  completed: boolean;
  certificateEarned: boolean;
}

export interface Certificate {
  id: string;
  module: string;
  code: string;
  issuedAt: string;
}

export interface ModuleRecommendation {
  module: string;
  reason: 'closest_to_completion' | 'not_started';
}

interface ProgressState {
  summary: ModuleProgress[];
  certificates: Certificate[];
  recommendation: ModuleRecommendation | null;
  fetchSummary: () => Promise<void>;
  fetchCertificates: () => Promise<void>;
}

export const useProgressStore = create<ProgressState>((set) => ({
  summary: [],
  certificates: [],
  recommendation: null,

  fetchSummary: async () => {
    try {
      const { summary, recommendation } = await apiClient.getProgressSummary();
      set({ summary: summary ?? [], recommendation: recommendation ?? null });
    } catch (error) {
      console.error('Failed to fetch progress summary:', error);
    }
  },

  fetchCertificates: async () => {
    try {
      const { certificates } = await apiClient.getCertificates();
      set({ certificates: certificates ?? [] });
    } catch (error) {
      console.error('Failed to fetch certificates:', error);
    }
  }
}));
