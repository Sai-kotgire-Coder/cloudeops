import { create } from 'zustand';

interface UpgradeModalState {
  isOpen: boolean;
  resourceType: string;
  current: number;
  limit: number;
  upgradeUrl: string;
  isPro: boolean;
  
  // Actions
  openUpgradeModal: (resourceType: string, current?: number, limit?: number, upgradeUrl?: string, isPro?: boolean) => void;
  closeUpgradeModal: () => void;
}

/**
 * Store for managing upgrade/payment UI modals
 */
export const usePaymentStore = create<UpgradeModalState>((set) => ({
  isOpen: false,
  resourceType: 'resources',
  current: 0,
  limit: 1,
  upgradeUrl: '/pricing',
  isPro: false,

  openUpgradeModal: (resourceType: string, current = 0, limit = 1, upgradeUrl = '/pricing', isPro = false) => {
    set({
      isOpen: true,
      resourceType,
      current,
      limit,
      upgradeUrl,
      isPro
    });
  },

  closeUpgradeModal: () => {
    set({ isOpen: false });
  }
}));
