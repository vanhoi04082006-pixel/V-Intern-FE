"use client";

/**
 * COMMAND PALETTE — ⌘K / Ctrl+K / "/" (bảng lệnh nhanh kiểu notebook).
 * Cổng từ sandbox `src/components/shell/app-shell.tsx` (section
 * "COMMAND PALETTE") sang repo thật, không phụ thuộc cmdk/Radix (repo thật
 * không có gói đó): tự quản lọc + điều hướng bàn phím trên <dialog> native
 * theo đúng mẫu Modal của repo (`trapDialogFocus` + onCancel + click nền).
 *
 * - Điều hướng: `useRouter().push()` sang route THẬT theo vai trò — danh
 *   mục `SECTIONS` khớp cây `src/app/{intern,instructor,admin}` hiện có.
 * - Vai trò: shell truyền `role` (ProductShell.role; intern-topbar luôn là
 *   intern vì workspace đó được WorkspaceGuard khóa theo vai trò). Khi
 *   thiếu prop, palette tự derive từ session thật
 *   (`getSessionUser().roles` — cùng thứ tự ưu tiên
 *   `getWorkspacePathForRoles` của `@/lib/auth/role-landing`).
 * - "Đăng xuất": tái dùng đúng cơ chế LogoutButton — `logout()` từ
 *   `@/lib/auth/auth-service` rồi `router.replace("/login")`.
 * - Phím tắt (tự chứa trong component — shell chỉ cần render + nút bấm):
 *   ⌘K/Ctrl+K bật/tắt, "/" mở khi không đang gõ trong
 *   input/textarea/select/contenteditable (guard gốc của sandbox);
 *   Escape đóng qua cancel native của <dialog>. Shell nào đã dùng "/"
 *   cho việc khác thì truyền `enableSlash={false}` (intern topbar).
 * - Icon: bộ VIcons (176 icon) — không dùng lucide.
 */

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { logout } from "@/lib/auth/auth-service";
import {
  getSessionUser,
  subscribeSession,
  type SessionUser,
} from "@/lib/auth/session";
import { trapDialogFocus } from "@/lib/ui/dialog-focus";
import { cn } from "@/lib/utils";
import {
  VAward,
  VBell,
  VBook,
  VBot,
  VCalendarCheck,
  VChartColumn,
  VClipboardCheck,
  VCoins,
  VDatabase,
  VFileText,
  VFolderKanban,
  VGithub,
  VGraduation,
  VHome,
  VHistory,
  VKanban,
  VLayers,
  VLightbulb,
  VListTodo,
  VLogoMark,
  VLogout,
  VMail,
  VSearch,
  VServer,
  VSettings,
  VShield,
  VShapes,
  VSparkles,
  VTrend,
  VUser,
  VUserSearch,
  VUsers,
  VWallet,
  type VIconComponent,
} from "@/components/icons/v-icons";

/* =====================================================================
 * Danh mục lệnh theo vai trò — mọi href là route thật của repo.
 * ===================================================================== */

export type PaletteRole = "intern" | "instructor" | "admin";

type PaletteCommand =
  | {
      key: string;
      label: string;
      icon: VIconComponent;
      /** Từ khóa phụ cho tìm kiếm (không hiển thị). */
      keywords?: string;
      kind: "route";
      href: string;
    }
  | {
      key: string;
      label: string;
      icon: VIconComponent;
      keywords?: string;
      kind: "logout";
    };

type PaletteSection = {
  id: string;
  heading: string;
  commands: PaletteCommand[];
};

/** Helper cho lệnh điều hướng — tránh lặp object literal dài. */
function nav(
  key: string,
  label: string,
  icon: VIconComponent,
  href: string,
  keywords?: string,
): PaletteCommand {
  return { key, label, icon, href, keywords, kind: "route" };
}

/** Nhóm chung cho mọi vai trò: về landing + đăng xuất. */
const COMMON_SECTION: PaletteSection = {
  id: "common",
  heading: "Chung",
  commands: [
    nav("landing", "Về trang chủ", VLogoMark, "/", "landing home v-intern trang chủ công khai"),
    {
      key: "logout",
      label: "Đăng xuất",
      icon: VLogout,
      keywords: "logout thoát tài khoản",
      kind: "logout",
    },
  ],
};

const SECTIONS: Record<PaletteRole, PaletteSection[]> = {
  intern: [
    {
      id: "workspace",
      heading: "Không gian làm việc",
      commands: [
        nav("overview", "Tổng quan", VHome, "/intern", "tổng quan home dashboard"),
        nav("work", "Công việc của tôi", VListTodo, "/intern/work", "công việc task nhiệm vụ"),
        nav("sprint", "Sprint Board", VKanban, "/intern/sprint", "sprint board kanban"),
        nav("project", "Dự án", VFolderKanban, "/intern/project", "dự án project"),
        nav("mentor", "AI Mentor", VBot, "/intern/mentor", "mentor trợ lý ai"),
      ],
    },
    {
      id: "outcomes",
      heading: "Kết quả & phát triển",
      commands: [
        nav("evaluations", "Đánh giá", VClipboardCheck, "/intern/evaluations", "đánh giá evaluation review"),
        nav("performance", "Hiệu suất", VTrend, "/intern/performance", "hiệu suất performance"),
        nav("kpi", "KPI", VChartColumn, "/intern/kpi", "kpi chỉ số"),
        nav("virtual-salary", "Lương ảo", VWallet, "/intern/virtual-salary", "lương ảo salary virtual"),
        nav("certificates", "Chứng nhận", VAward, "/intern/certificates", "chứng nhận certificate"),
        nav("recommendations", "Gợi ý phát triển", VLightbulb, "/intern/recommendations", "gợi ý khuyến nghị recommendation"),
      ],
    },
    {
      id: "personal",
      heading: "Cá nhân",
      commands: [
        nav("participation", "Thời hạn & ghi nhận", VCalendarCheck, "/intern/participation", "thời hạn deadline ghi nhận participation"),
        nav("github", "GitHub", VGithub, "/intern/github"),
        nav("notifications", "Thông báo", VBell, "/intern/notifications", "thông báo notification"),
        nav("profile", "Hồ sơ", VUser, "/intern/profile", "hồ sơ profile"),
      ],
    },
  ],
  instructor: [
    {
      id: "organization",
      heading: "Tổ chức thực tập",
      commands: [
        nav("overview", "Tổng quan", VHome, "/instructor", "tổng quan home dashboard"),
        nav("recruitment-rounds", "Hồ sơ CV & lịch tuyển", VUserSearch, "/instructor/recruitment-rounds", "cv tuyển dụng recruitment"),
        nav("sessions", "Phiên thực tập", VLayers, "/instructor/sessions", "phiên session"),
        nav("sprints", "Sprint & Task", VKanban, "/instructor/sprints", "sprint task"),
      ],
    },
    {
      id: "projects",
      heading: "Dự án & đánh giá",
      commands: [
        nav("projects", "Thư viện dự án", VFolderKanban, "/instructor/projects", "thư viện dự án project"),
        nav("evaluations", "Đánh giá AI", VClipboardCheck, "/instructor/evaluations", "đánh giá evaluation ai"),
        nav("performance", "Hiệu suất thành viên", VTrend, "/instructor/performance", "hiệu suất performance thành viên"),
      ],
    },
    {
      id: "reports",
      heading: "Báo cáo & kết nối",
      commands: [
        nav("participation", "Thời hạn & kỷ luật", VCalendarCheck, "/instructor/participation", "thời hạn kỷ luật participation"),
        nav("reports", "Báo cáo", VFileText, "/instructor/reports", "báo cáo report"),
        nav("github", "Kết nối GitHub", VGithub, "/instructor/github", "github kết nối"),
      ],
    },
    {
      id: "personal",
      heading: "Cá nhân",
      commands: [
        nav("notifications", "Thông báo", VBell, "/instructor/notifications", "thông báo notification"),
        nav("profile", "Hồ sơ", VUser, "/instructor/profile", "hồ sơ profile"),
      ],
    },
  ],
  admin: [
    {
      id: "people",
      heading: "Con người",
      commands: [
        nav("overview", "Tổng quan", VHome, "/admin", "tổng quan home dashboard"),
        nav("users", "Người dùng", VUsers, "/admin/users", "người dùng user"),
        nav("roles", "Vai trò & quyền", VShield, "/admin/roles", "vai trò quyền role permission"),
        nav("groups", "Nhóm người dùng", VUsers, "/admin/groups", "nhóm group"),
      ],
    },
    {
      id: "learning",
      heading: "Học tập",
      commands: [
        nav("sessions", "Phiên thực tập", VLayers, "/admin/sessions", "phiên session"),
        nav("sprints", "Sprint & Task", VKanban, "/admin/sprints", "sprint task"),
        nav("tasks", "Nhiệm vụ", VListTodo, "/admin/tasks", "nhiệm vụ task"),
        nav("templates", "Project template", VShapes, "/admin/templates", "mẫu template"),
        nav("questions", "Ngân hàng câu hỏi", VBook, "/admin/questions", "câu hỏi question"),
        nav("knowledge", "Kho tri thức Agent", VDatabase, "/admin/knowledge", "tri thức knowledge agent"),
        nav("career-roles", "Thư viện nghề nghiệp", VGraduation, "/admin/career-roles", "nghề nghiệp career"),
        nav("recruitment-rounds", "Hồ sơ CV & lịch tuyển", VUserSearch, "/admin/recruitment-rounds", "cv tuyển dụng recruitment"),
      ],
    },
    {
      id: "analytics",
      heading: "Phân tích",
      commands: [
        nav("performance", "Hiệu suất sinh viên", VTrend, "/admin/performance", "hiệu suất performance"),
        nav("kpi", "Kỳ KPI", VChartColumn, "/admin/kpi", "kpi kỳ chỉ số"),
        nav("salary", "Lương ảo", VCoins, "/admin/salary", "lương ảo salary"),
        nav("certificates", "Chứng nhận", VAward, "/admin/certificates", "chứng nhận certificate"),
        nav("reports", "Báo cáo", VFileText, "/admin/reports", "báo cáo report"),
      ],
    },
    {
      id: "system",
      heading: "Hệ thống",
      commands: [
        nav("ai", "Cấu hình AI", VSparkles, "/admin/ai", "ai cấu hình"),
        nav("services", "Trạng thái dịch vụ", VServer, "/admin/services", "dịch vụ service"),
        nav("communications", "Email & lịch gửi", VMail, "/admin/communications", "email thư lịch gửi"),
        nav("settings", "Cài đặt hệ thống", VSettings, "/admin/settings", "cài đặt setting"),
        nav("activity", "Hoạt động gần đây", VHistory, "/admin/activity", "hoạt động activity"),
        nav("audit", "Audit log", VFileText, "/admin/audit", "audit nhật ký log"),
      ],
    },
    {
      id: "personal",
      heading: "Cá nhân",
      commands: [
        nav("notifications", "Thông báo", VBell, "/admin/notifications", "thông báo notification"),
        nav("profile", "Hồ sơ", VUser, "/admin/profile", "hồ sơ profile"),
      ],
    },
  ],
};

const ROLE_LABEL: Record<PaletteRole, string> = {
  intern: "Sinh viên",
  instructor: "Giảng viên",
  admin: "Quản trị viên",
};

/* =====================================================================
 * Tiện ích nội bộ
 * ===================================================================== */

/* Guard phím "/" của sandbox — chỉ mở khi con trỏ không đang ở ô nhập. */
const SEARCH_TARGET_TAGS = ["INPUT", "TEXTAREA", "SELECT"];

function isTypingTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (SEARCH_TARGET_TAGS.includes(target.tagName) || target.isContentEditable)
  );
}

/** So khớp không dấu tiếng Việt — "danh gia" vẫn tìm ra "Đánh giá". */
function normalizeText(value: string): string {
  return value
    .toLocaleLowerCase("vi")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Nguồn vai trò: prop từ shell là chuẩn (layout đã xác định không gian
 * đang xem); thiếu prop thì derive từ session thật theo cùng thứ tự ưu
 * tiên của `getWorkspacePathForRoles`.
 */
function resolvePaletteRole(
  explicit: PaletteRole | undefined,
  user: SessionUser | null,
): PaletteRole {
  if (explicit) return explicit;
  if (user) {
    const fromSession = user.roles.find(
      (candidate) =>
        candidate === "admin" ||
        candidate === "instructor" ||
        candidate === "intern",
    );
    if (fromSession) return fromSession;
  }
  return "intern";
}

/* Style item/heading — mirror các hằng PALETTE_*_CLS của sandbox. */
const OPTION_CLS =
  "flex min-h-11 cursor-pointer items-center gap-2.5 rounded-[9px_11px_9px_11px] px-3 py-2.5 text-[0.85rem] font-semibold text-[var(--ink)] transition-colors";
const OPTION_ACTIVE_CLS = "bg-[var(--blue-mist)]";

/* =====================================================================
 * TRIGGER — nút ⌘K đặt vào topbar của các shell.
 * ===================================================================== */

/** Nút "Bảng lệnh nhanh" — mirror nút ⌘K của Topbar sandbox (VIcons). */
export function CommandPaletteTrigger({
  onOpen,
  slashHint = true,
  className,
}: {
  onOpen: () => void;
  /**
   * Tắt gợi ý "/" khi shell đã dùng phím đó cho việc khác (topbar sinh
   * viên dùng "/" để focus ô tìm kiếm riêng) — khi đó title chỉ ghi ⌘K.
   */
  slashHint?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label="Mở bảng lệnh nhanh"
      aria-keyshortcuts="Control+K"
      title={slashHint ? "Bảng lệnh nhanh — ⌘K hoặc /" : "Bảng lệnh nhanh — ⌘K"}
      className={cn(
        "focus-ink inline-flex h-10 shrink-0 items-center gap-2 rounded-full border-2 border-[var(--ink)] bg-[var(--paper-raised)] px-3.5 text-[var(--ink)] shadow-ink-2 transition-all hover:-translate-y-0.5 hover:bg-[var(--blue-mist)]",
        className,
      )}
    >
      <VSearch size={16} className="shrink-0" aria-hidden="true" />
      <kbd className="hidden rounded-md border-2 border-[color-mix(in_srgb,var(--ink)_45%,transparent)] px-1.5 py-px font-mono text-[0.62rem] font-bold text-[var(--ink-soft)] sm:inline-block">
        ⌘K
      </kbd>
    </button>
  );
}

/* =====================================================================
 * PALETTE — dialog native + combobox/listbox tự quản.
 *
 * Tách 2 lớp để vừa giữ listener phím tắt luôn luôn chạy, vừa reset từ
 * khóa mỗi lần mở mà không setState trong effect (rule react-hooks):
 * - CommandPalette (outer, luôn mounted): lắng nghe ⌘K/"/", xác định
 *   vai trò, chỉ render PaletteDialog khi `open`.
 * - PaletteDialog (inner, mount lại mỗi lần mở): state query/activeIndex
 *   khởi tạo mới ngay khi mount — không cần reset bằng effect.
 * ===================================================================== */

export function CommandPalette({
  open,
  onOpenChange,
  role,
  enableSlash = true,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Vai trò quyết định danh mục route; mặc định derive từ session. */
  role?: PaletteRole;
  /**
   * Bật phím "/" mở palette (mặc định). Shell đã gán "/" cho hành vi khác
   * (ô tìm kiếm của intern-topbar) truyền false để không đè hành vi cũ.
   */
  enableSlash?: boolean;
}) {
  /* Session thật — nguồn vai trò fallback (biết ngay khi đăng xuất). */
  const sessionUser = useSyncExternalStore(
    subscribeSession,
    getSessionUser,
    getSessionUser,
  );
  const resolvedRole = resolvePaletteRole(role, sessionUser);
  const sections = useMemo(
    () => [...SECTIONS[resolvedRole], COMMON_SECTION],
    [resolvedRole],
  );

  /* ⌘K / Ctrl+K bật–tắt · "/" mở khi con trỏ không ở ô nhập. */
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        onOpenChange(!open);
        return;
      }
      if (enableSlash && event.key === "/" && !isTypingTarget(event.target)) {
        event.preventDefault();
        onOpenChange(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange, enableSlash]);

  /* Đóng thì không render gì — không đụng a11y tree/DOM của trang. */
  if (!open) return null;
  return (
    <PaletteDialog
      onOpenChange={onOpenChange}
      role={resolvedRole}
      sections={sections}
      enableSlash={enableSlash}
    />
  );
}

function PaletteDialog({
  onOpenChange,
  role,
  sections,
  enableSlash,
}: {
  onOpenChange: (open: boolean) => void;
  role: PaletteRole;
  sections: PaletteSection[];
  enableSlash: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const listId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  /* Lọc theo từ khóa (label + keywords), giữ thứ tự nhóm. */
  const filtered = useMemo(() => {
    const q = normalizeText(query);
    return sections.map((section) => ({
      section,
      commands: section.commands.filter(
        (command) =>
          !q ||
          normalizeText(`${command.label} ${command.keywords ?? ""}`).includes(q),
      ),
    }));
  }, [sections, query]);

  const flat = useMemo(
    () => filtered.flatMap((group) => group.commands),
    [filtered],
  );

  /* Mở: showModal + focus ô tìm; đóng/unmount: trả focus cũ. */
  useEffect(() => {
    const dialog = dialogRef.current;
    const previous = document.activeElement;
    dialog?.showModal();
    inputRef.current?.focus();
    return () => {
      dialog?.close();
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, []);

  /* Giữ mục active trong khung nhìn (danh sách admin dài). */
  useEffect(() => {
    dialogRef.current
      ?.querySelector<HTMLElement>(`[data-palette-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, flat]);

  const close = () => onOpenChange(false);

  const runCommand = (command: PaletteCommand) => {
    close();
    if (command.kind === "logout") {
      /* Cùng cơ chế LogoutButton: logout() rồi replace về /login. */
      void (async () => {
        try {
          await logout();
        } finally {
          router.replace("/login");
        }
      })();
      return;
    }
    router.push(command.href);
  };

  const onInputKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      if (flat.length === 0) return;
      event.preventDefault();
      const delta = event.key === "ArrowDown" ? 1 : -1;
      setActiveIndex((index) => (index + delta + flat.length) % flat.length);
      return;
    }
    if (event.key === "Home" && flat.length > 0) {
      event.preventDefault();
      setActiveIndex(0);
      return;
    }
    if (event.key === "End" && flat.length > 0) {
      event.preventDefault();
      setActiveIndex(flat.length - 1);
      return;
    }
    if (event.key === "Enter") {
      const active = flat[Math.min(activeIndex, flat.length - 1)];
      if (!active) return;
      event.preventDefault();
      runCommand(active);
    }
  };

  /* Bóp index về khoảng hợp lệ sau khi danh sách co lại. */
  const index = Math.min(activeIndex, flat.length - 1);
  const activeDescendant =
    flat.length > 0 ? `${listId}-opt-${flat[index].key}` : undefined;

  const isCurrent = (command: PaletteCommand) =>
    command.kind === "route" &&
    (pathname === command.href ||
      (command.href !== "/" && pathname.startsWith(command.href + "/")));

  return (
    <dialog
      ref={dialogRef}
      onKeyDown={trapDialogFocus}
      onClick={(event) => {
        if (event.target === dialogRef.current) close();
      }}
      onCancel={(event) => {
        event.preventDefault();
        event.stopPropagation();
        close();
      }}
      aria-label={`Bảng lệnh nhanh — ${ROLE_LABEL[role]}`}
      className={cn(
        "cmd-palette-dialog fixed top-[12%] bottom-auto mx-auto w-[min(34rem,calc(100vw-1.5rem))]",
        "overflow-hidden rounded-[14px_18px_14px_18px] border-2 border-[var(--ink)] bg-[var(--paper)] p-0 text-[var(--ink)] shadow-ink-6",
      )}
    >
      {/* Vùng tìm kiếm — viền mực 2px trên nền giấy nổi (mirror CommandInput). */}
      <div className="flex h-12 shrink-0 items-center gap-2.5 border-b-2 border-[var(--ink)] bg-[var(--paper-raised)] px-4">
        <VSearch size={16} className="shrink-0 text-[var(--ink-soft)]" aria-hidden="true" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(0);
          }}
          onKeyDown={onInputKeyDown}
          role="combobox"
          aria-expanded="true"
          aria-controls={listId}
          aria-activedescendant={activeDescendant}
          aria-autocomplete="list"
          aria-label="Tìm trang hoặc thao tác"
          placeholder={
            enableSlash
              ? "Tìm trang hoặc thao tác… (phím / cũng mở được)"
              : "Tìm trang hoặc thao tác…"
          }
          autoComplete="off"
          spellCheck={false}
          className="h-full min-w-0 flex-1 bg-transparent text-[0.92rem] font-semibold text-[var(--ink)] outline-none placeholder:font-normal placeholder:text-[var(--ink-faint)]"
        />
      </div>

      {/* Danh sách lọc theo nhóm — cuộn mảnh khi dài (admin ~27 mục). */}
      <div
        id={listId}
        role="listbox"
        aria-label={`Lệnh theo vai trò ${ROLE_LABEL[role]}`}
        className="cmd-palette-list max-h-[min(22rem,60vh)] overflow-y-auto p-1.5"
      >
        {flat.length === 0 ? (
          <p
            role="status"
            className="py-8 text-center font-hand text-[0.95rem] leading-relaxed text-[var(--ink-soft)]"
          >
            Không tìm thấy trang nào — thử gõ từ khóa khác nhé ✎
          </p>
        ) : (
          filtered.map(({ section, commands }) =>
            commands.length === 0 ? null : (
              <div
                key={section.id}
                role="group"
                aria-labelledby={`${listId}-${section.id}`}
                className="mb-1.5 last:mb-0"
              >
                <p
                  id={`${listId}-${section.id}`}
                  className="mb-1 px-2 font-hand text-[0.72rem] tracking-wide text-[var(--ink-soft)]"
                >
                  {section.heading}
                </p>
                {commands.map((command) => {
                  const commandIndex = flat.indexOf(command);
                  const isActive = commandIndex === index;
                  const Icon = command.icon;
                  return (
                    <div
                      key={command.key}
                      id={`${listId}-opt-${command.key}`}
                      role="option"
                      aria-selected={isActive}
                      data-palette-index={commandIndex}
                      tabIndex={-1}
                      onClick={() => runCommand(command)}
                      onMouseEnter={() => setActiveIndex(commandIndex)}
                      className={cn(
                        OPTION_CLS,
                        isActive && OPTION_ACTIVE_CLS,
                      )}
                    >
                      <Icon size={17} className="shrink-0" aria-hidden="true" />
                      <span className="min-w-0 flex-1 truncate">{command.label}</span>
                      {isCurrent(command) && (
                        <span className="ml-auto shrink-0 font-hand text-[0.65rem] text-[var(--royal)]">
                          đang xem
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ),
          )
        )}
      </div>

      {/* Gợi ý phím — mirror footer của sandbox. */}
      <p className="flex shrink-0 items-center justify-center gap-2 border-t-2 border-dashed border-[color-mix(in_srgb,var(--ink)_25%,transparent)] px-4 py-2 text-[0.65rem] text-[var(--ink-soft)]">
        <kbd className="rounded border border-[var(--ink-soft)] px-1 font-mono text-[0.58rem]">
          esc
        </kbd>
        <span>đóng</span>
        <span aria-hidden="true">·</span>
        <kbd className="rounded border border-[var(--ink-soft)] px-1 font-mono text-[0.58rem]">
          ↵
        </kbd>
        <span>mở trang</span>
      </p>
    </dialog>
  );
}
