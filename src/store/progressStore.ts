import { create } from 'zustand';
import { apiClient } from '@/lib/apiClient';

export interface ModuleProgress {
  module: string;
  current: number;
  target: number;
  completed: boolean;
}

export interface Certificate {
  id: string;
  module: string;
  code: string;
  issuedAt: string;
}

interface ProgressState {
  summary: ModuleProgress[];
  certificates: Certificate[];
  fetchSummary: () => Promise<void>;
  fetchCertificates: () => Promise<void>;
}

export const useProgressStore = create<ProgressState>((set) => ({
  summary: [],
  certificates: [],

  fetchSummary: async () => {
    try {
      const { summary } = await apiClient.getProgressSummary();
      set({ summary: summary ?? [] });
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
