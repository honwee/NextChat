import { createPersistStore } from "../utils/store";

export interface Agent {
  id: string;
  name: string;
  dashscope_app_id: string;
  description?: string;
  system_prompt?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface AgentStore {
  agents: Agent[];
  selectedAgentId: string | null;
  loading: boolean;

  setAgents: (agents: Agent[]) => void;
  selectAgent: (agentId: string | null) => void;
  setLoading: (loading: boolean) => void;
  fetchAgents: () => Promise<void>;
}

export const useAgentStore = createPersistStore(
  {
    agents: [] as Agent[],
    selectedAgentId: null as string | null,
    loading: false,
  },
  (set, get) => ({
    setAgents(agents: Agent[]) {
      set({ agents });
    },

    selectAgent(agentId: string | null) {
      set({ selectedAgentId: agentId });
    },

    setLoading(loading: boolean) {
      set({ loading });
    },

    async fetchAgents() {
      try {
        set({ loading: true });
        const response = await fetch("/api/admin/agents", {
          method: "GET",
          credentials: "include",
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data.agents) {
            set({ agents: result.data.agents });
          }
        }
      } catch (error) {
        console.error("Failed to fetch agents:", error);
      } finally {
        set({ loading: false });
      }
    },
  }),
  {
    name: "agent-store",
    version: 1.0,
  },
);
