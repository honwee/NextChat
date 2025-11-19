/**
 * 管理后台 - 智能体管理
 * 管理系统中的所有智能体（AI Agent）
 */

"use client";

import { useEffect, useState } from "react";
import styles from "../admin.module.scss";

interface Agent {
  id: string;
  name: string;
  description: string;
  prompt: string;
  model: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface AgentsResponse {
  agents: Agent[];
  total: number;
  limit: number;
  offset: number;
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [total, setTotal] = useState(0);
  const [limit] = useState(50);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/admin/agents?limit=${limit}&offset=${offset}`,
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const result: AgentsResponse = data.data;
          setAgents(result.agents);
          setTotal(result.total);
        } else {
          setError(data.error || "获取智能体列表失败");
        }
      } else {
        setError("获取智能体列表失败");
      }
    } catch (error) {
      console.error("获取智能体列表失败:", error);
      setError("服务器错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, [offset]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <span className={`${styles["admin-badge"]} ${styles["success"]}`}>
        启用
      </span>
    ) : (
      <span className={`${styles["admin-badge"]} ${styles["danger"]}`}>
        禁用
      </span>
    );
  };

  const handleCreateAgent = () => {
    alert(
      "创建智能体功能开发中\n\n将打开一个表单让您填写:\n- 智能体名称\n- 描述\n- 系统提示词\n- 使用的模型\n- 是否启用",
    );
  };

  const handleEditAgent = (agent: Agent) => {
    alert(
      `编辑智能体功能开发中\n\nID: ${agent.id}\n名称: ${agent.name}\n描述: ${agent.description}\n模型: ${agent.model}`,
    );
  };

  const handleToggleStatus = async (agent: Agent) => {
    if (
      confirm(
        `确定要${agent.is_active ? "禁用" : "启用"}智能体 "${agent.name}" 吗？`,
      )
    ) {
      alert("切换状态功能开发中");
      // 这里添加切换状态的API调用
    }
  };

  const handleDeleteAgent = async (agent: Agent) => {
    if (confirm(`确定要删除智能体 "${agent.name}" 吗？此操作不可恢复！`)) {
      alert("删除功能开发中");
      // 这里添加删除的API调用
    }
  };

  const handlePrevPage = () => {
    if (offset > 0) {
      setOffset(Math.max(0, offset - limit));
    }
  };

  const handleNextPage = () => {
    if (offset + limit < total) {
      setOffset(offset + limit);
    }
  };

  if (loading) {
    return (
      <div className={styles["loading-spinner"]}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle
            cx="12"
            cy="12"
            r="10"
            strokeWidth="4"
            strokeDasharray="32"
            strokeDashoffset="32"
          />
        </svg>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles["empty-state"]}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <h3>加载失败</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <>
      <div className={styles["admin-card"]}>
        <div className={styles["admin-card-header"]}>
          <h3>智能体列表 ({total})</h3>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              className={`${styles["admin-button"]} ${styles["primary"]}`}
              onClick={handleCreateAgent}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              创建智能体
            </button>
            <button
              className={`${styles["admin-button"]} ${styles["secondary"]}`}
              onClick={fetchAgents}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              刷新
            </button>
          </div>
        </div>

        {agents.length === 0 ? (
          <div className={styles["empty-state"]}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <h3>暂无智能体</h3>
            <p>点击上方按钮创建第一个智能体</p>
          </div>
        ) : (
          <>
            <div className={styles["admin-table"]}>
              <table>
                <thead>
                  <tr>
                    <th>名称</th>
                    <th>描述</th>
                    <th>模型</th>
                    <th>状态</th>
                    <th>创建时间</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {agents.map((agent) => (
                    <tr key={agent.id}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{agent.name}</div>
                      </td>
                      <td>
                        <div
                          style={{
                            maxWidth: "300px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {agent.description || "-"}
                        </div>
                      </td>
                      <td>
                        <span
                          className={`${styles["admin-badge"]} ${styles["info"]}`}
                        >
                          {agent.model}
                        </span>
                      </td>
                      <td>{getStatusBadge(agent.is_active)}</td>
                      <td>{formatDate(agent.created_at)}</td>
                      <td>
                        <div style={{ display: "flex", gap: "5px" }}>
                          <button
                            className={`${styles["admin-button"]} ${styles["secondary"]}`}
                            style={{ padding: "6px 12px", fontSize: "12px" }}
                            onClick={() => handleEditAgent(agent)}
                          >
                            编辑
                          </button>
                          <button
                            className={`${styles["admin-button"]} ${
                              agent.is_active
                                ? styles["secondary"]
                                : styles["primary"]
                            }`}
                            style={{ padding: "6px 12px", fontSize: "12px" }}
                            onClick={() => handleToggleStatus(agent)}
                          >
                            {agent.is_active ? "禁用" : "启用"}
                          </button>
                          <button
                            className={`${styles["admin-button"]} ${styles["danger"]}`}
                            style={{ padding: "6px 12px", fontSize: "12px" }}
                            onClick={() => handleDeleteAgent(agent)}
                          >
                            删除
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 分页控件 */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: "20px",
                paddingTop: "20px",
                borderTop: "var(--border-in-light)",
              }}
            >
              <div style={{ fontSize: "14px", color: "var(--black)" }}>
                显示 {offset + 1} - {Math.min(offset + limit, total)} / 共{" "}
                {total} 条
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  className={`${styles["admin-button"]} ${styles["secondary"]}`}
                  onClick={handlePrevPage}
                  disabled={offset === 0}
                >
                  上一页
                </button>
                <button
                  className={`${styles["admin-button"]} ${styles["secondary"]}`}
                  onClick={handleNextPage}
                  disabled={offset + limit >= total}
                >
                  下一页
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 智能体详情卡片 */}
      {agents.length > 0 && (
        <div className={styles["admin-card"]}>
          <div className={styles["admin-card-header"]}>
            <h3>智能体说明</h3>
          </div>
          <div style={{ fontSize: "14px", lineHeight: "1.6" }}>
            <p style={{ margin: "0 0 10px 0", color: "var(--black)" }}>
              智能体是系统中预定义的 AI
              助手，每个智能体都有特定的角色和能力。您可以：
            </p>
            <ul
              style={{
                margin: "0",
                paddingLeft: "20px",
                color: "var(--black)",
              }}
            >
              <li>创建新的智能体并配置其系统提示词</li>
              <li>编辑现有智能体的配置信息</li>
              <li>启用或禁用智能体</li>
              <li>删除不再需要的智能体</li>
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
