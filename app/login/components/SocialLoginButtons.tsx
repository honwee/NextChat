"use client";

import React from "react";
import styles from "../login.module.scss";

export function SocialLoginButtons() {
  const feishuLogin = () => {
    window.location.href = "/api/auth/feishu/login";
  };

  const testLogin = () => {
    window.location.href = "/api/auth/test-login";
  };

  return (
    <>
      <div className={styles["divider"]}>
        <span>或</span>
      </div>

      <button
        type="button"
        className={styles["social-button"]}
        onClick={feishuLogin}
        aria-label="使用飞书登录"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 0C4.477 0 0 4.477 0 10s4.477 10 10 10 10-4.477 10-10S15.523 0 10 0zm4.5 14.5h-9v-9h9v9z" />
        </svg>
        使用飞书登录
      </button>

      {process.env.NODE_ENV !== "production" && (
        <>
          <div className={styles["divider"]}>
            <span>开发测试</span>
          </div>
          <button
            type="button"
            className={styles["social-button"]}
            onClick={testLogin}
            aria-label="快速测试登录"
          >
            快速登录（测试用）
          </button>
        </>
      )}
    </>
  );
}
