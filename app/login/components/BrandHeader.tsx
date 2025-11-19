"use client";

import React from "react";
import styles from "../login.module.scss";
import LogoIcon from "@/app/icons/logo.svg";

type Stat = {
  value: string;
  label: string;
};

export function BrandHeader({
  brandName = "NextChat",
  stats = [],
}: {
  brandName?: string;
  stats?: Stat[];
}) {
  return (
    <div className={styles["brand-section"]}>
      <div className={styles["brand-logo"]}>
        <LogoIcon width={40} height={40} />
        <span className={styles["brand-name"]}>{brandName}</span>
      </div>
      {stats?.length > 0 && (
        <div className={styles["stats"]}>
          {stats.map((s, idx) => (
            <div className={styles["stat-item"]} key={`${s.label}-${idx}`}>
              <div className={styles["stat-value"]}>{s.value}</div>
              <div className={styles["stat-label"]}>{s.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
