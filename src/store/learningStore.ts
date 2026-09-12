import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type TopicId = 
  | 'instances' 
  | 'load_balancer' 
  | 'auto_scaling' 
  | 'pods' 
  | 'iam' 
  | 'cpu_memory' 
  | 'traffic' 
  | 'errors'
  | 'deployments'
  | 'services'
  | 'containers'
  | 'networking'
  | 'ingress'
  | 'load_balancing'
  | 'iac'
  | 'config_management'
  | 'secrets_management'
  | 'kubectl_cli'
  | 'gitops'
  | 'monitoring';

interface LearningState {
  sidebarOpen: boolean;
  activeTopic: TopicId | null;
  viewedTopics: TopicId[];
  beginnerMode: boolean;
  
  openTopic: (id: TopicId) => void;
  closeSidebar: () => void;
  toggleBeginnerMode: () => void;
  resetProgress: () => void;
}

export const useLearningStore = create<LearningState>()(
  persist(
    (set, get) => ({
      sidebarOpen: false,
      activeTopic: null,
      viewedTopics: [],
      beginnerMode: true,

      openTopic: (id) => {
        set((state) => ({
          sidebarOpen: true,
          activeTopic: id,
          viewedTopics: state.viewedTopics.includes(id) 
            ? state.viewedTopics 
            : [...state.viewedTopics, id]
        }));
      },

      closeSidebar: () => set({ sidebarOpen: false }),

      toggleBeginnerMode: () => set((state) => ({ beginnerMode: !state.beginnerMode })),

      resetProgress: () => set({ viewedTopics: [] }),
    }),
    {
      name: 'learning-store',
    }
  )
);
