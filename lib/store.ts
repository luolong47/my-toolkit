import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ToolStats {
  clickCount: number;
  isPinned?: boolean;
}

interface AppState {
  toolStats: Record<string, ToolStats>;
  incrementClickCount: (toolId: string) => void;
  togglePin: (toolId: string) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      toolStats: {},
      incrementClickCount: (toolId) => 
        set((state) => ({
          toolStats: {
            ...state.toolStats,
            [toolId]: {
              ...state.toolStats[toolId],
              clickCount: (state.toolStats[toolId]?.clickCount || 0) + 1,
            },
          },
        })),
      togglePin: (toolId) =>
        set((state) => ({
          toolStats: {
            ...state.toolStats,
            [toolId]: {
              ...state.toolStats[toolId],
              clickCount: state.toolStats[toolId]?.clickCount || 0,
              isPinned: !state.toolStats[toolId]?.isPinned,
            },
          },
        })),
    }),
    {
      name: 'toolbox-storage',
    }
  )
);
