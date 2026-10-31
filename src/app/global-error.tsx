"use client";
import { useEffect } from "react";
import Link from "next/link";

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

  const linkStyle: Record<string, string | number> = {
    ...buttonStyle,
    background: "#ffffff",
    color: "#17171c",
    textDecoration: "none",
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
          backgroundImage:
            "linear-gradient(rgba(23,23,28,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(23,23,28,0.05) 1px, transparent 1px)",
          backgroundSize: "30px 30px",
          color: "#17171c",
          fontFamily:
            "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
          padding: "24px",
        }}
      >
        {/* Focus ring + nhấn lún cho nút — inline vì không tải được global CSS */}
        <style>{`
          .nb-global-error-btn:focus-visible {
            outline: 3px solid #2060f0;
            outline-offset: 2px;
          }
          .nb-global-error-btn:active:not(:disabled) {
            transform: translateY(1px);
            box-shadow: 1px 1px 0 rgba(23, 23, 28, 0.35);
          }
          @media (prefers-reduced-motion: reduce) {
            .nb-global-error-btn:active:not(:disabled) { transform: none; }
          }
        `}</style>
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
          {error.digest && (
            <p
              style={{
                margin: "12px 0 0",
                fontSize: "0.75rem",
                color: "#70707b",
              }}
            >
              Mã lỗi:{" "}
              <span style={{ fontFamily: "ui-monospace, monospace" }}>
                {error.digest}
              </span>
            </p>
          )}
          <div
            style={{
              marginTop: "24px",
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: "12px",
            }}
          >
            <button
              type="button"
              onClick={() => retry()}
              style={buttonStyle}
              className="nb-global-error-btn"
            >
              Tải lại trang
            </button>
            <Link href="/" style={linkStyle} className="nb-global-error-btn">
              Về trang chính
            </Link>
          </div>
        </main>
      </body>
    </html>
  );
}
