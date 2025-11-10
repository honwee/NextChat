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
    // 固定使用默认智能体（环境变量中的 DASHSCOPE_APP_ID）
    selectedAgentId: "default" as string | null,
    loading: false,
  },
  (set, get) => ({
    setAgents(agents: Agent[]) {
      set({ agents });

      // 如果没有选中的智能体，自动选择第一个激活的智能体
      if (!get().selectedAgentId && agents.length > 0) {
        const firstActive = agents.find((a) => a.is_active);
        if (firstActive) {
          set({ selectedAgentId: firstActive.id });
        }
      }
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
            get().setAgents(result.data.agents);
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
    version: 1.1, // 升级版本以重置持久化数据
  },
);
