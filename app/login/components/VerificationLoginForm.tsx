"use client";

import React, { useState } from "react";
import styles from "../login.module.scss";
import LoadingIcon from "@/app/icons/three-dots.svg";

export function VerificationLoginForm({
  onSwitchToPassword,
}: {
  onSwitchToPassword?: () => void;
}) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const sendCode = async () => {
    setError("");
    if (!email) {
      setError("请输入邮箱地址");
      return;
    }
    // 这里只实现UI演示，接口集成留给后续
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 800);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !code) {
      setError("请输入邮箱和验证码");
      return;
    }
    setLoading(true);
    // 布局与样式还原为主，这里不接入真实登录
    setTimeout(() => {
      setLoading(false);
      // 登录完成后的跳转演示
      window.location.href = "/";
    }, 900);
  };

  const googleLogin = () => {
    // 占位：Google 登录按钮的交互
    window.location.href = "/api/auth/google/login";
  };

  return (
    <div className={styles["login-section"]}>
      <div className={styles["welcome-text"]}>
        <h1>Hi, I&#39;m LumiChat</h1>
        <p>面试训练智能助手</p>
      </div>

      {error && <div className={styles["error-message"]}>{error}</div>}

      <form onSubmit={submit} className={styles["login-form"]}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="请输入邮箱"
          disabled={loading}
          className={styles["input-field"]}
        />

        <div className={styles["input-row"]}>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="请输入验证码"
            disabled={loading}
            className={styles["input-field"]}
          />
          <button
            type="button"
            onClick={sendCode}
            className={styles["code-button"]}
            disabled={loading}
          >
            获取验证码
          </button>
        </div>

        <button
          type="submit"
          className={styles["primary-button"]}
          disabled={loading}
        >
          {loading ? <LoadingIcon /> : "登录"}
        </button>
      </form>

      <div className={styles["divider"]}>
        <span>绑定</span>
      </div>

      <button
        type="button"
        className={styles["social-button"]}
        onClick={googleLogin}
        disabled={loading}
        aria-label="使用 Google 登录"
      >
        {/* 简约的 G 图标 */}
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M10 0a10 10 0 100 20 10 10 0 000-20z" fill="#fff" />
          <path
            d="M10 8.1v3.8h5.4c-.24 1.4-1.62 4.1-5.4 4.1A6.2 6.2 0 013.8 10 6.2 6.2 0 0110 3.8c1.69 0 3.22.6 4.43 1.57l2.06-2.06A9.3 9.3 0 0010 .7C5.2.7 1.3 4.6 1.3 9.4c0 4.8 3.9 8.7 8.7 8.7 5.02 0 8.3-3.53 8.3-8.51 0-.55-.05-1.09-.14-1.6H10z"
            fill="#4285F4"
          />
        </svg>
        使用 Google 登录
      </button>

      {onSwitchToPassword && (
        <div
          style={{
            marginTop: 12,
            textAlign: "center",
            color: "#666",
            fontSize: 13,
          }}
        >
          还想用密码登录？
          <button
            type="button"
            onClick={onSwitchToPassword}
            style={{
              color: "#4B7BFF",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              marginLeft: 6,
            }}
          >
            切换到密码
          </button>
        </div>
      )}
    </div>
  );
}
