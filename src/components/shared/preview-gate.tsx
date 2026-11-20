"use client";

import { useEffect, useState, type ComponentType } from "react";


/**
 * CỔNG MOUNT PREVIEW SWITCHER — tách bạch bundle:
 * import động nằm trong nhánh điều kiện inline; production build (NODE_ENV
 * production, không đặt NEXT_PUBLIC_PREVIEW) gập nhánh thành false nên cả
 * switcher lẫn chuỗi module mock (store, accounts, router, data, transport)
 * đều bị dead-code elimination khỏi bundle client.
 * Bằng chứng bằng grep chuỗi marker: scripts/verify-preview-isolation.mjs.
 */
export function PreviewGate() {
  const [Switcher, setSwitcher] = useState<ComponentType | null>(null);
  useEffect(() => {
    /* Inline literal như apiFetch: production build gập false → nhánh chết →
       switcher + chuỗi module mock rời khỏi bundle client. */
    if (
      process.env.NEXT_PUBLIC_PREVIEW !== "1" ||
      process.env.NODE_ENV === "production"
    )
      return;
    void import("@/components/shared/preview-switcher").then((mod) => {
      setSwitcher(() => mod.PreviewSwitcher);
    });
  }, []);
  if (!Switcher) return null;
  return <Switcher />;
}
