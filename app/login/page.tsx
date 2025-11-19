"use client";

import styles from "./login.module.scss";
import { BrandHeader } from "./components/BrandHeader";
import { PasswordLoginForm } from "./components/PasswordLoginForm";
import { SocialLoginButtons } from "./components/SocialLoginButtons";
// 保持组件化，避免将所有逻辑放在一个文件中

export default function LoginPage() {
  return (
    <div className={styles["login-page"]}>
      <div className={styles["login-card"]}>
        <BrandHeader brandName="LumiChat" />

        <div className={styles["login-section"]}>
          <PasswordLoginForm />
        </div>

        <div style={{ padding: "0 60px 32px" }}>
          <SocialLoginButtons />
        </div>
      </div>
    </div>
  );
}
