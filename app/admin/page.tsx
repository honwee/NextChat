/**
 * 管理后台 - 数据统计看板
 * 显示系统关键指标
 */

"use client";

import { useEffect, useState } from "react";
import styles from "./admin.module.scss";

interface Statistics {
  totalUsers: number;
  activeUsers: number;
  totalConversations: number;
  totalMessages: number;
  totalAgents: number;
  todayConversations: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        const response = await fetch("/api/admin/statistics");
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setStats(data.data);
          } else {
            setError(data.error || "获取统计数据失败");
          }
        } else {
          setError("获取统计数据失败");
        }
      } catch (error) {
        console.error("获取统计数据失败:", error);
        setError("服务器错误，请稍后重试");
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, []);

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

  if (!stats) {
    return null;
  }

  return (
    <>
      {/* 统计卡片网格 */}
      <div className={styles["stats-grid"]}>
        {/* 总用户数 */}
        <div className={styles["stat-card"]}>
          <div className={`${styles["stat-icon"]} ${styles["blue"]}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          </div>
          <p className={styles["stat-value"]}>{stats.totalUsers}</p>
          <p className={styles["stat-label"]}>总用户数</p>
        </div>

        {/* 活跃用户数 */}
        <div className={styles["stat-card"]}>
          <div className={`${styles["stat-icon"]} ${styles["green"]}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <p className={styles["stat-value"]}>{stats.activeUsers}</p>
          <p className={styles["stat-label"]}>活跃用户</p>
        </div>

        {/* 总对话数 */}
        <div className={styles["stat-card"]}>
          <div className={`${styles["stat-icon"]} ${styles["purple"]}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <p className={styles["stat-value"]}>{stats.totalConversations}</p>
          <p className={styles["stat-label"]}>总对话数</p>
        </div>

        {/* 总消息数 */}
        <div className={styles["stat-card"]}>
          <div className={`${styles["stat-icon"]} ${styles["orange"]}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
              />
            </svg>
          </div>
          <p className={styles["stat-value"]}>{stats.totalMessages}</p>
          <p className={styles["stat-label"]}>总消息数</p>
        </div>
      </div>

      {/* 详细信息卡片 */}
      <div className={styles["admin-card"]}>
        <div className={styles["admin-card-header"]}>
          <h3>系统概览</h3>
        </div>

        <div className={styles["admin-table"]}>
          <table>
            <tbody>
              <tr>
                <td style={{ fontWeight: 500 }}>智能体总数</td>
                <td>{stats.totalAgents}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 500 }}>今日对话数</td>
                <td>{stats.todayConversations}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 500 }}>平均对话长度</td>
                <td>
                  {stats.totalConversations > 0
                    ? Math.round(stats.totalMessages / stats.totalConversations)
                    : 0}{" "}
                  条消息
                </td>
              </tr>
              <tr>
                <td style={{ fontWeight: 500 }}>用户活跃率</td>
                <td>
                  {stats.totalUsers > 0
                    ? Math.round((stats.activeUsers / stats.totalUsers) * 100)
                    : 0}
                  %
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 快捷操作 */}
      <div className={styles["admin-card"]}>
        <div className={styles["admin-card-header"]}>
          <h3>快捷操作</h3>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button
            className={`${styles["admin-button"]} ${styles["primary"]}`}
            onClick={() => (window.location.href = "/admin/users")}
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
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
            管理用户
          </button>

          <button
            className={`${styles["admin-button"]} ${styles["primary"]}`}
            onClick={() => (window.location.href = "/admin/conversations")}
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
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            查看对话
          </button>

          <button
            className={`${styles["admin-button"]} ${styles["primary"]}`}
            onClick={() => (window.location.href = "/admin/agents")}
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
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            管理智能体
          </button>
        </div>
      </div>
    </>
  );
}
