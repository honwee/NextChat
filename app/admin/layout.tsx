/**
 * 管理后台布局组件
 * 包含侧边栏导航、顶部栏和内容区域
 */

"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./admin.module.scss";

// 导航菜单项
const navItems = [
  {
    path: "/admin",
    label: "数据统计",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
    ),
  },
  {
    path: "/admin/users",
    label: "用户管理",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
        />
      </svg>
    ),
  },
  {
    path: "/admin/conversations",
    label: "对话记录",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>
    ),
  },
  {
    path: "/admin/agents",
    label: "智能体管理",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      </svg>
    ),
  },
];

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // 验证管理员身份
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/admin/me");
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setUser(data.data.user);
          } else {
            router.push("/login");
          }
        } else {
          router.push("/login");
        }
      } catch (error) {
        console.error("验证管理员身份失败:", error);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch (error) {
      console.error("退出登录失败:", error);
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

  if (!user) {
    return null;
  }

  return (
    <div className={styles["admin-container"]}>
      {/* 侧边栏 */}
      <aside
        className={`${styles["admin-sidebar"]} ${
          sidebarOpen ? styles["mobile-open"] : ""
        }`}
      >
        {/* 侧边栏头部 */}
        <div className={styles["admin-sidebar-header"]}>
          <h1>LumiChat</h1>
          <p>管理后台</p>
        </div>

        {/* 导航菜单 */}
        <nav className={styles["admin-nav"]}>
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`${styles["admin-nav-item"]} ${
                  isActive ? styles["active"] : ""
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* 侧边栏底部 - 用户信息 */}
        <div className={styles["admin-sidebar-footer"]}>
          <div className={styles["admin-user-info"]}>
            <div className={styles["user-avatar"]}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className={styles["user-details"]}>
              <p className={styles["user-name"]}>{user.name}</p>
              <p className={styles["user-role"]}>
                {user.role === "super_admin" ? "超级管理员" : "管理员"}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* 主内容区域 */}
      <main className={styles["admin-main"]}>
        {/* 顶部栏 */}
        <header className={styles["admin-header"]}>
          <h2>
            {navItems.find((item) => item.path === pathname)?.label ||
              "管理后台"}
          </h2>
          <div className={styles["admin-header-actions"]}>
            <button
              className={`${styles["admin-button"]} ${styles["secondary"]}`}
              onClick={() => router.push("/")}
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
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              返回首页
            </button>
            <button
              className={`${styles["admin-button"]} ${styles["danger"]}`}
              onClick={handleLogout}
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
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              退出登录
            </button>
          </div>
        </header>

        {/* 页面内容 */}
        <div className={styles["admin-content"]}>{children}</div>
      </main>

      {/* 移动端侧边栏遮罩 */}
      {sidebarOpen && (
        <div
          className={styles["sidebar-overlay"]}
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
