/**
 * 管理后台 - 用户管理
 * 显示所有用户列表，支持分页和角色管理
 */

"use client";

import { useEffect, useState } from "react";
import styles from "../admin.module.scss";

interface User {
  id: string;
  name: string;
  email: string;
  feishu_user_id: string | null;
  is_active: boolean;
  created_at: string;
  role: string;
}

interface UsersResponse {
  users: User[];
  total: number;
  limit: number;
  offset: number;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [limit] = useState(50);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [newRole, setNewRole] = useState<string>("user");

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/admin/users?limit=${limit}&offset=${offset}`,
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const result: UsersResponse = data.data;
          setUsers(result.users);
          setTotal(result.total);
        } else {
          setError(data.error || "获取用户列表失败");
        }
      } else {
        setError("获取用户列表失败");
      }
    } catch (error) {
      console.error("获取用户列表失败:", error);
      setError("服务器错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
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

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "super_admin":
        return (
          <span className={`${styles["admin-badge"]} ${styles["danger"]}`}>
            超级管理员
          </span>
        );
      case "admin":
        return (
          <span className={`${styles["admin-badge"]} ${styles["warning"]}`}>
            管理员
          </span>
        );
      default:
        return (
          <span className={`${styles["admin-badge"]} ${styles["info"]}`}>
            普通用户
          </span>
        );
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <span className={`${styles["admin-badge"]} ${styles["success"]}`}>
        活跃
      </span>
    ) : (
      <span className={`${styles["admin-badge"]} ${styles["danger"]}`}>
        已禁用
      </span>
    );
  };

  // 切换用户状态
  const handleToggleStatus = async (user: User) => {
    const action = user.is_active ? "禁用" : "启用";
    if (!confirm(`确定要${action}用户 "${user.name}" 吗？`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !user.is_active }),
      });

      const data = await response.json();
      if (data.success) {
        await fetchUsers();
      } else {
        alert(data.error || `${action}失败`);
      }
    } catch (error) {
      console.error(`${action}用户失败:`, error);
      alert(`${action}失败，请稍后重试`);
    }
  };

  // 打开角色编辑对话框
  const handleEditRole = (user: User) => {
    setEditingUser(user);
    setNewRole(user.role);
    setShowRoleDialog(true);
  };

  // 提交角色变更
  const handleSubmitRole = async () => {
    if (!editingUser) return;

    try {
      const response = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      const data = await response.json();
      if (data.success) {
        setShowRoleDialog(false);
        setEditingUser(null);
        await fetchUsers();
      } else {
        alert(data.error || "修改角色失败");
      }
    } catch (error) {
      console.error("修改角色失败:", error);
      alert("修改角色失败，请稍后重试");
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
          <h3>用户列表 ({total})</h3>
          <button
            className={`${styles["admin-button"]} ${styles["primary"]}`}
            onClick={fetchUsers}
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

        {users.length === 0 ? (
          <div className={styles["empty-state"]}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <h3>暂无用户</h3>
            <p>系统中还没有注册用户</p>
          </div>
        ) : (
          <>
            <div className={styles["admin-table"]}>
              <table>
                <thead>
                  <tr>
                    <th>用户名</th>
                    <th>邮箱</th>
                    <th>角色</th>
                    <th>状态</th>
                    <th>注册时间</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <div
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "50%",
                              background:
                                "linear-gradient(135deg, var(--primary) 0%, #5a8fff 100%)",
                              color: "white",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: "bold",
                              marginRight: "10px",
                            }}
                          >
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          {user.name}
                        </div>
                      </td>
                      <td>{user.email || "-"}</td>
                      <td>{getRoleBadge(user.role)}</td>
                      <td>{getStatusBadge(user.is_active)}</td>
                      <td>{formatDate(user.created_at)}</td>
                      <td>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            className={`${styles["admin-button"]} ${styles["secondary"]}`}
                            style={{ padding: "6px 12px", fontSize: "12px" }}
                            onClick={() => handleEditRole(user)}
                          >
                            修改角色
                          </button>
                          <button
                            className={`${styles["admin-button"]} ${
                              user.is_active
                                ? styles["danger"]
                                : styles["primary"]
                            }`}
                            style={{ padding: "6px 12px", fontSize: "12px" }}
                            onClick={() => handleToggleStatus(user)}
                          >
                            {user.is_active ? "禁用" : "启用"}
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

      {/* 角色编辑对话框 */}
      {showRoleDialog && editingUser && (
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
          }}
          onClick={() => setShowRoleDialog(false)}
        >
          <div
            className={styles["admin-card"]}
            style={{
              width: "90%",
              maxWidth: "500px",
              margin: 0,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles["admin-card-header"]}>
              <h3>修改用户角色</h3>
            </div>

            <div style={{ marginBottom: "24px" }}>
              <p style={{ marginBottom: "16px", color: "var(--black)" }}>
                用户：<strong>{editingUser.name}</strong>
              </p>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: 600,
                  color: "var(--black)",
                }}
              >
                选择角色:
              </label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "8px",
                  border: "1.5px solid rgba(0, 0, 0, 0.1)",
                  fontSize: "14px",
                  backgroundColor: "var(--white)",
                  cursor: "pointer",
                }}
              >
                <option value="user">普通用户</option>
                <option value="admin">管理员</option>
                <option value="super_admin">超级管理员</option>
              </select>
            </div>

            <div
              style={{
                display: "flex",
                gap: "12px",
                justifyContent: "flex-end",
              }}
            >
              <button
                className={`${styles["admin-button"]} ${styles["secondary"]}`}
                onClick={() => setShowRoleDialog(false)}
              >
                取消
              </button>
              <button
                className={`${styles["admin-button"]} ${styles["primary"]}`}
                onClick={handleSubmitRole}
              >
                确认修改
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
