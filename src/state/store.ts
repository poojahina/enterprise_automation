import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AutomationOpportunity, Role } from '../models/types';

const normalizeOpportunityStage = (opportunity: AutomationOpportunity): AutomationOpportunity => {
  const legacyStages: Record<string, AutomationOpportunity['currentStage']> = {
    'PRD Creation': 'PDD Creation',
    'Solution Designed': 'SDD Creation',
    'Solution Design': 'SDD Creation',
  };
  const currentStage = legacyStages[String(opportunity.currentStage)] ?? opportunity.currentStage;
  return currentStage === opportunity.currentStage ? opportunity : { ...opportunity, currentStage };
};

interface StageConfig {
  id: string;
  name: string;
  order: number;
  isEnabled: boolean;
}

interface AppState {
  // ── Role ──────────────────────────────────────
  role: Role;
  setRole: (role: Role) => void;

  // ── Stages ────────────────────────────────────
  stages: StageConfig[];
  fetchStages: () => Promise<void>;

  // ── Opportunities ─────────────────────────────
  opportunities: AutomationOpportunity[];
  fetchOpportunities: () => Promise<void>;
  addOpportunity: (opp: AutomationOpportunity) => Promise<void>;
  updateOpportunity: (id: string, updates: Partial<AutomationOpportunity>) => Promise<void>;
  runWorkflowAction: (id: string, action: string, payload?: Record<string, unknown>) => Promise<AutomationOpportunity>;

  // ── Selected ──────────────────────────────────
  selectedOpportunityId: string | null;
  setSelectedOpportunityId: (id: string | null) => void;

  // ── UI State ──────────────────────────────────
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      role: 'Business User',
      setRole: (role) => set({ role }),

      stages: [],
      fetchStages: async () => {
        try {
          const res = await fetch('/api/stages');
          if (!res.ok) throw new Error('Failed to fetch stages');

          const stages = await res.json();
          set({ stages });
        } catch (error) {
          console.error("Failed to fetch stages", error);
          throw error;
        }
      },

      opportunities: [],
      fetchOpportunities: async () => {
        try {
          const res = await fetch('/api/opportunities');
          if (!res.ok) throw new Error('Failed to fetch opportunities');

          const opportunities = (await res.json()).map(normalizeOpportunityStage);
          set({ opportunities });
        } catch (error) {
          console.error("Failed to fetch opportunities", error);
          throw error;
        }
      },

      addOpportunity: async (opp) => {
        try {
          const res = await fetch('/api/opportunities', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(opp),
          });
          if (!res.ok) throw new Error('Failed to create opportunity');

          const newOpp = normalizeOpportunityStage(await res.json());
          set((state) => ({ opportunities: [...state.opportunities, newOpp] }));
        } catch (error) {
          console.error("Failed to create opportunity", error);
          throw error;
        }
      },

      updateOpportunity: async (id, updates) => {
        try {
          const res = await fetch(`/api/opportunities/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
          });
          if (!res.ok) throw new Error('Failed to update opportunity');

          const updatedOpp = normalizeOpportunityStage(await res.json());
          set((state) => ({
            opportunities: state.opportunities.map((o) =>
              o.id === id ? { ...o, ...updatedOpp } : o
            ),
          }));
        } catch (error) {
          console.error("Failed to update opportunity", error);
          throw error;
        }
      },

      runWorkflowAction: async (id, action, payload = {}) => {
        try {
          const artifactRoutes: Record<string, string> = {
            'apply-pdd': `/api/artifacts/${id}/pdd/generate`,
            'generate-solution': `/api/artifacts/${id}/sdd/generate`,
            'generate-backlog': `/api/artifacts/${id}/user-stories/generate`,
          };
          const res = await fetch(artifactRoutes[action] ?? `/api/workflow/opportunities/${id}/actions/${action}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          if (!res.ok) {
            const errorBody = await res.json().catch(() => null);
            throw new Error(errorBody?.error ?? `Failed to run ${action}`);
          }

          const updatedOpp = normalizeOpportunityStage(await res.json());
          set((state) => ({
            opportunities: state.opportunities.map((o) =>
              o.id === id ? { ...o, ...updatedOpp } : o
            ),
          }));
          return updatedOpp;
        } catch (error) {
          console.error(`Failed to run workflow action ${action}`, error);
          throw error;
        }
      },

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
