"use client";

import React, { useState } from "react";
import styles from "../login.module.scss";
import LoadingIcon from "@/app/icons/three-dots.svg";

export function PasswordLoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [usernameFocused, setUsernameFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username.trim()) {
      setError("请输入账号");
      return;
    }

    if (!password.trim()) {
      setError("请输入密码");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/password/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const contentType = response.headers.get("content-type") || "";
      let result: any = null;
      if (contentType.includes("application/json")) {
        try {
          result = await response.json();
        } catch (parseErr) {
          console.warn("无法解析 JSON 响应:", parseErr);
        }
      } else {
        const text = await response.text();
        result = { success: false, error: text };
      }

      if (response.ok && result?.success) {
        window.location.href = "/";
      } else {
        setError(result?.error || "登录失败");
      }
    } catch (err) {
      console.error("Password login error:", err);
      setError("登录失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles["login-section"]}>
      <div className={styles["welcome-text"]}>
        <h1>Hi, I&#39;m LumiChat</h1>
        <p>面试训练智能助手</p>
      </div>

      {error && <div className={styles["error-message"]}>{error}</div>}

      <form
        onSubmit={submit}
        className={styles["login-form"]}
        style={{ width: "100%", maxWidth: "100%" }}
      >
        <div style={{ position: "relative", width: "100%" }}>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="请输入账号"
            disabled={loading}
            className={styles["input-field"]}
            autoComplete="username"
            aria-label="账号"
            onFocus={() => setUsernameFocused(true)}
            onBlur={() => setUsernameFocused(false)}
          />
          {username && (
            <button
              type="button"
              onClick={() => setUsername("")}
              style={{
                position: "absolute",
                right: "16px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#94a3b8",
                opacity: username ? 1 : 0,
                transition: "all 0.2s ease",
                zIndex: 10,
              }}
              aria-label="清除账号"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
            </button>
          )}
        </div>

        <div style={{ position: "relative", width: "100%" }}>
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="请输入密码"
            disabled={loading}
            className={styles["input-field"]}
            autoComplete="current-password"
            aria-label="密码"
            onFocus={() => setPasswordFocused(true)}
            onBlur={() => setPasswordFocused(false)}
            style={{ paddingRight: "48px" }}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: "absolute",
              right: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#64748b",
              transition: "all 0.2s ease",
              zIndex: 10,
              width: "36px",
              height: "36px",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#4B7BFF")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#64748b")}
            aria-label={showPassword ? "隐藏密码" : "显示密码"}
          >
            {showPassword ? (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.45 18.45 0 0 1-5.06 5.94M1 1l22 22"></path>
              </svg>
            ) : (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            )}
          </button>
        </div>

        <button
          type="submit"
          className={styles["primary-button"]}
          disabled={loading}
          aria-busy={loading}
        >
          {loading ? <LoadingIcon /> : "登录"}
        </button>
      </form>
    </div>
  );
}
