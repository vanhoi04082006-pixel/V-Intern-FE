import Link from "next/link";

/**
 * AuthTabs — cặp tab "Đăng nhập / Đăng ký" trên card.
 * Đây là điều hướng giữa 2 route thật (/login, /register), không phải
 * tab ẩn/hiện trong cùng một component, nên dùng semantics nav + link
 * với aria-current thay vì role="tab" (không có tabpanel thật).
 * Gạch chân mục đang mở là nét lượn vẽ tay (support.css `.auth-tabs`).
 */
const TABS = [
  { key: "login", label: "Đăng nhập", href: "/login" },
  { key: "register", label: "Đăng ký", href: "/register" },
] as const;

export type AuthTabKey = (typeof TABS)[number]["key"];

export function AuthTabs({ active }: { active: AuthTabKey }) {
  return (
    <nav
      aria-label="Chuyển giữa đăng nhập và đăng ký"
      className="auth-tabs mb-4 border-b border-border"
    >
      <ul className="flex gap-9">
        {TABS.map((tab) => {
          const isActive = tab.key === active;
          return (
            <li key={tab.key}>
              <Link
                href={tab.href}
                aria-current={isActive ? "page" : undefined}
                className={`relative block rounded-sm pb-3 text-body font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
