"use client";
import { useEffect } from "react";

/**
 * Global error boundary (Lớp 6) — thay cả root layout nên phải tự render
 * <html>/<body> và dùng inline style (global CSS không được nạp ở đây).
 * Luôn dùng palette giấy sáng vì không đọc được theme ở tầng này.
 */
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const stampStyle: Record<string, string | number> = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "132px",
    padding: "10px 22px",
    border: "3px solid #c0272d",
    borderRadius: "47% 53% 50% 50% / 52% 48% 53% 47%",
    color: "#c0272d",
    fontWeight: 800,
    fontStyle: "italic",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    fontSize: "0.8rem",
    transform: "rotate(-7deg)",
    lineHeight: 1.2,
  };

  const buttonStyle: Record<string, string | number> = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    minHeight: "44px",
    padding: "10px 22px",
    border: "2px solid #17171c",
    borderRadius: "9px",
    background: "#2060f0",
    color: "#ffffff",
    fontFamily: "inherit",
    fontSize: "0.9rem",
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "3px 3px 0 rgba(23, 23, 28, 0.35)",
  };

  return (
    <html lang="vi">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#fbfaf4",
          color: "#17171c",
          fontFamily:
            "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
          padding: "24px",
        }}
      >
        <main
          style={{
            width: "100%",
            maxWidth: "460px",
            textAlign: "center",
            background: "#ffffff",
            border: "2px solid #17171c",
            borderRadius: "12px 15px 13px 14px",
            boxShadow: "6px 6px 0 rgba(23, 23, 28, 0.18)",
            padding: "40px 32px",
          }}
        >
          <span style={stampStyle}>Lỗi hệ thống</span>
          <h1
            style={{
              margin: "20px 0 0",
              fontSize: "1.5rem",
              fontWeight: 700,
              lineHeight: 1.25,
            }}
          >
            V-Intern tạm dừng một nhịp
          </h1>
          <p
            style={{
              margin: "10px 0 0",
              fontSize: "0.9rem",
              lineHeight: 1.6,
              color: "#5a5a64",
            }}
          >
            Đã xảy ra lỗi ở tầng hệ thống. Bạn hãy thử tải lại trang; nếu lỗi
            còn tiếp diễn, hãy quay lại sau ít phút.
          </p>
          <button type="button" onClick={() => retry()} style={buttonStyle}>
            Tải lại trang
          </button>
        </main>
      </body>
    </html>
  );
}
