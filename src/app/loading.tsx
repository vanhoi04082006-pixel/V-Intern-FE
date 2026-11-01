/** Loading toàn cục (Lớp 6) — trang sổ tay đang mở: bút mực viết dần một dòng
 *  trên giấy kẻ, phía dưới là các dòng chì phác trong khung đường cắt giấy.
 *  Server component thuần; keyframe nhét cục bộ vì không được đụng globals.css. */
export default function Loading() {
  return (
    <div className="app-surface flex min-h-dvh items-center justify-center bg-background p-6">
      <style>{`
        .nb-ink-line {
          position: relative;
          height: 14px;
          border-bottom: 1.5px solid var(--line);
        }
        .nb-ink-stroke {
          position: absolute;
          left: 0;
          bottom: -1.25px;
          height: 2.5px;
          width: 0;
          border-radius: 2px;
          background: linear-gradient(90deg, transparent, var(--primary) 14%, var(--primary));
          animation: nb-ink-write 1.8s cubic-bezier(0.3, 0.6, 0.4, 1) infinite;
        }
        @keyframes nb-ink-write {
          0% { width: 0; opacity: 0; }
          12% { opacity: 1; }
          70% { width: 100%; opacity: 1; }
          100% { width: 100%; opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .nb-ink-stroke {
            animation: none;
            width: 38%;
            opacity: 0.85;
          }
        }
      `}</style>
      <div
        role="status"
        aria-label="Đang mở trang sổ tay"
        className="dashed-cut w-full max-w-md rounded-xl bg-raised p-6 sm:p-8"
      >
        <div className="flex items-center justify-center gap-3 text-ink-soft">
          <span className="spinner-hand size-5 text-blue" aria-hidden="true" />
          <span className="font-hand text-body">Đang mở trang sổ tay…</span>
        </div>
        {/* Dòng mực đang được viết trên giấy kẻ */}
        <div className="nb-ink-line mt-6" aria-hidden="true">
          <span className="nb-ink-stroke" />
        </div>
        <div className="mt-3 space-y-3" aria-hidden="true">
          <div className="skeleton-pencil h-4 w-11/12" />
          <div className="skeleton-pencil h-4 w-9/12" />
          <div className="skeleton-pencil h-4 w-10/12" />
        </div>
      </div>
    </div>
  );
}
