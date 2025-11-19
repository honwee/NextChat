/**
 * 管理后台 - 对话记录查看
 * 显示所有用户的对话记录，支持查看消息详情
 */

"use client";

import { useEffect, useState } from "react";
import styles from "../admin.module.scss";

interface Conversation {
  id: string;
  user_id: string;
  user_name: string;
  agent_id: string | null;
  agent_name: string | null;
  title: string;
  message_count: number;
  created_at: string;
  updated_at: string;
}

interface Message {
  id: string;
  conversation_id: string;
  role: string;
  content: string;
  created_at: string;
}

interface ConversationsResponse {
  conversations: Conversation[];
  total: number;
  limit: number;
  offset: number;
}

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [total, setTotal] = useState(0);
  const [limit] = useState(50);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [showMessagesDialog, setShowMessagesDialog] = useState(false);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/admin/conversations?limit=${limit}&offset=${offset}`,
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const result: ConversationsResponse = data.data;
          setConversations(result.conversations);
          setTotal(result.total);
        } else {
          setError(data.error || "获取对话列表失败");
        }
      } else {
        setError("获取对话列表失败");
      }
    } catch (error) {
      console.error("获取对话列表失败:", error);
      setError("服务器错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
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

  const handleViewMessages = async (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setShowMessagesDialog(true);
    setLoadingMessages(true);

    try {
      const response = await fetch(
        `/api/admin/conversations/${conversation.id}/messages`,
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMessages(data.data.messages);
        } else {
          alert(data.error || "获取消息失败");
        }
      } else {
        alert("获取消息失败");
      }
    } catch (error) {
      console.error("获取消息失败:", error);
      alert("服务器错误，请稍后重试");
    } finally {
      setLoadingMessages(false);
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
          <h3>对话记录 ({total})</h3>
          <button
            className={`${styles["admin-button"]} ${styles["primary"]}`}
            onClick={fetchConversations}
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

        {conversations.length === 0 ? (
          <div className={styles["empty-state"]}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <h3>暂无对话记录</h3>
            <p>系统中还没有用户对话</p>
          </div>
        ) : (
          <>
            <div className={styles["admin-table"]}>
              <table>
                <thead>
                  <tr>
                    <th>对话标题</th>
                    <th>用户</th>
                    <th>智能体</th>
                    <th>消息数</th>
                    <th>创建时间</th>
                    <th>最后更新</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {conversations.map((conversation) => (
                    <tr key={conversation.id}>
                      <td>
                        <div
                          style={{
                            maxWidth: "300px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {conversation.title || "无标题"}
                        </div>
                      </td>
                      <td>{conversation.user_name}</td>
                      <td>
                        {conversation.agent_name ? (
                          <span
                            className={`${styles["admin-badge"]} ${styles["info"]}`}
                          >
                            {conversation.agent_name}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td>
                        <span
                          className={`${styles["admin-badge"]} ${styles["success"]}`}
                        >
                          {conversation.message_count} 条
                        </span>
                      </td>
                      <td>{formatDate(conversation.created_at)}</td>
                      <td>{formatDate(conversation.updated_at)}</td>
                      <td>
                        <button
                          className={`${styles["admin-button"]} ${styles["primary"]}`}
                          style={{ padding: "6px 12px", fontSize: "12px" }}
                          onClick={() => handleViewMessages(conversation)}
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                          查看消息
                        </button>
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

      {/* 消息详情对话框 */}
      {showMessagesDialog && selectedConversation && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
          onClick={() => {
            setShowMessagesDialog(false);
            setSelectedConversation(null);
            setMessages([]);
          }}
        >
          <div
            className={styles["admin-card"]}
            style={{
              width: "100%",
              maxWidth: "900px",
              maxHeight: "85vh",
              margin: 0,
              display: "flex",
              flexDirection: "column",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles["admin-card-header"]}>
              <div>
                <h3 style={{ marginBottom: "8px" }}>
                  {selectedConversation.title || "无标题"}
                </h3>
                <p
                  style={{
                    margin: 0,
                    fontSize: "13px",
                    color: "var(--black)",
                    opacity: 0.6,
                  }}
                >
                  用户：{selectedConversation.user_name} | 创建时间：
                  {formatDate(selectedConversation.created_at)}
                </p>
              </div>
              <button
                className={`${styles["admin-button"]} ${styles["secondary"]}`}
                onClick={() => {
                  setShowMessagesDialog(false);
                  setSelectedConversation(null);
                  setMessages([]);
                }}
              >
                关闭
              </button>
            </div>

            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "20px 0",
              }}
            >
              {loadingMessages ? (
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
              ) : messages.length === 0 ? (
                <div className={styles["empty-state"]}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  <h3>暂无消息</h3>
                  <p>该对话还没有消息记录</p>
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                  }}
                >
                  {messages.map((message, index) => (
                    <div
                      key={message.id}
                      style={{
                        padding: "16px",
                        borderRadius: "12px",
                        background:
                          message.role === "user"
                            ? "linear-gradient(135deg, rgba(75, 123, 255, 0.08) 0%, rgba(75, 123, 255, 0.04) 100%)"
                            : "linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, rgba(34, 197, 94, 0.04) 100%)",
                        border:
                          message.role === "user"
                            ? "1.5px solid rgba(75, 123, 255, 0.1)"
                            : "1.5px solid rgba(34, 197, 94, 0.1)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          marginBottom: "8px",
                          gap: "8px",
                        }}
                      >
                        <span
                          className={`${styles["admin-badge"]} ${
                            message.role === "user"
                              ? styles["info"]
                              : styles["success"]
                          }`}
                        >
                          {message.role === "user" ? "用户" : "助手"}
                        </span>
                        <span
                          style={{
                            fontSize: "12px",
                            color: "var(--black)",
                            opacity: 0.6,
                          }}
                        >
                          {formatDate(message.created_at)}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: "14px",
                          lineHeight: "1.6",
                          color: "var(--black)",
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                        }}
                      >
                        {message.content}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
