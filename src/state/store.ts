import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AutomationOpportunity, Role } from '../models/types';
import { mockOpportunities } from '../services/mockData';

interface AppState {
  // ── Role ──────────────────────────────────────
  role: Role;
  setRole: (role: Role) => void;

  // ── Opportunities ─────────────────────────────
  opportunities: AutomationOpportunity[];
  setOpportunities: (opps: AutomationOpportunity[]) => void;
  addOpportunity: (opp: AutomationOpportunity) => void;
  updateOpportunity: (id: string, updates: Partial<AutomationOpportunity>) => void;

  // ── Selected ──────────────────────────────────
  selectedOpportunityId: string | null;
  setSelectedOpportunityId: (id: string | null) => void;

  // ── UI State ──────────────────────────────────
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      role: 'Business User',
      setRole: (role) => set({ role }),

      opportunities: mockOpportunities,
      setOpportunities: (opportunities) => set({ opportunities }),
      addOpportunity: (opp) =>
        set((state) => ({ opportunities: [...state.opportunities, opp] })),
      updateOpportunity: (id, updates) =>
        set((state) => ({
          opportunities: state.opportunities.map((o) =>
            o.id === id ? { ...o, ...updates } : o
          ),
        })),

      selectedOpportunityId: null,
      setSelectedOpportunityId: (id) => set({ selectedOpportunityId: id }),

      sidebarCollapsed: false,
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    }),
    {
      name: 'automation-intake-store',
      partialize: (state) => ({
        role: state.role,
        selectedOpportunityId: state.selectedOpportunityId,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);
