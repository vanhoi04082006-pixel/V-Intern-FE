import type { LucideIcon } from "lucide-react";
import {
  Award,
  Bot,
  Bug,
  ClipboardList,
  CodeXml,
  Compass,
  Database,
  FileSearch,
  ListChecks,
  MessagesSquare,
  Sparkles,
  Target,
  Users,
} from "lucide-react";

import {
  calculateOverallScore,
  isPassed,
} from "../recruitment-scoring";
import type { InternTone } from "../../intern-ui-tones";

/**
 * Mock/presentation data cho Intern Onboarding / AI Recruitment flow
 * (/intern/onboarding/*) — dựng UI theo 5 reference screens:
 * Welcome → Chọn vai trò → Phỏng vấn AI Recruiter → Kết quả Đạt / Chưa đạt.
 *
 * QUAN TRỌNG:
 * - Toàn bộ là dữ liệu trình bày tĩnh (mock-only). KHÔNG map vào backend
 *   endpoint nào, KHÔNG gọi API recruitment/interview/roles — BE hiện chưa
 *   có domain này. Các hành động chỉ đổi in-memory mock state phía client.
 * - Role options (Frontend/Backend/QA/BA) là lựa chọn UI mock cho task này,
 *   KHÔNG phải enum/domain contract cuối cùng của BE.
 * - Overall KHÔNG được hardcode: luôn derive qua `buildRecruitmentResult`
 *   → `calculateOverallScore` (70% Technical + 30% Soft Skill, ngưỡng 70).
 * - Khi BE có API recruitment thật, thay các builder dưới đây bằng data
 *   fetch — component UI không cần đổi shape hiển thị.
 */

/* --------------------------------- Types ---------------------------------- */

/** ID lựa chọn vai trò ứng tuyển (mock UI — chưa phải contract BE). */
export type RoleId =
  | "frontend-developer"
  | "backend-developer"
  | "qa-tester"
  | "business-analyst";

export interface RecruitmentRole {
  id: RoleId;
  label: string;
  tagline: string;
  tags: readonly string[];
  icon: LucideIcon;
  tone: InternTone;
}

export type QuestionCategory = "Technical" | "Soft Skill";

export interface InterviewQuestion {
  id: string;
  category: QuestionCategory;
  /** Có thể chứa placeholder `{role}` — format bằng `formatQuestionPrompt`. */
  prompt: string;
  /**
   * Tiêu đề ngắn hiển thị trong rail danh sách câu hỏi (reference màn 3:
   * mỗi item gồm 1 dòng ngắn + nhãn category — KHÔNG dùng prompt dài).
   * Thuần nhãn hiển thị cho layout compact — không đổi nội dung câu hỏi.
   */
  shortTitle: string;
  /** Gợi ý ngắn hiển thị dưới câu hỏi (mô phỏng "hint" của AI Recruiter). */
  hint?: string;
}

export interface RecruitmentScores {
  technical: number;
  soft: number;
}

export interface RecruitmentNextStep {
  title: string;
  description: string;
}

export interface SuggestedRole {
  id: RoleId;
  label: string;
  tags: readonly string[];
  reasons: readonly string[];
}

/**
 * Kết quả tuyển dụng — dùng chung cho Đạt/Chưa đạt (pass/fail là 2 DATA
 * STATE của cùng một Result screen, không phải 2 product khác nhau).
 */
export interface RecruitmentResultData {
  status: "pass" | "fail";
  appliedRoleId: RoleId;
  appliedRoleLabel: string;
  scores: RecruitmentScores;
  /** Derive qua calculateOverallScore — không bao giờ hardcode. */
  overall: number;
  /** Derive qua isPassed(overall) — ngưỡng 70. */
  passed: boolean;
  headline: string;
  subtitle: string;
  feedback: readonly string[];
  nextSteps: readonly RecruitmentNextStep[];
  notes: readonly string[];
  quote: string;
  /** Chỉ có khi fail — vai trò AI Recruiter đề xuất. */
  suggestedRole: SuggestedRole | null;
}

/* --------------------------------- User ----------------------------------- */

/** Intern mock dùng chung cho topbar + phần chào (khớp intern-mock-data). */
export const ONBOARDING_USER = {
  name: "Nguyễn Văn A",
  roleLabel: "Sinh viên",
  initials: "NA",
} as const;

/* ------------------------------ Step model -------------------------------- */

export const ONBOARDING_STEP_COUNT = 4;

export interface OnboardingStep {
  id: string;
  /** Nhãn stepper ngang (welcome/role) và dọc (interview/result). */
  label: string;
  /** Mô tả ngắn cho stepper dọc. */
  description: string;
}

export const ONBOARDING_STEPS: readonly OnboardingStep[] = [
  { id: "welcome", label: "Chào mừng", description: "Giới thiệu quy trình" },
  { id: "role", label: "Chọn vai trò", description: "Vị trí ứng tuyển" },
  {
    id: "interview",
    label: "Phỏng vấn AI Recruiter",
    description: "Đánh giá năng lực",
  },
  {
    id: "result",
    label: "Nhận kết quả",
    description: "Xem kết quả tuyển dụng",
  },
];

/* --------------------------------- Roles ---------------------------------- */

export const DEFAULT_ROLE_ID: RoleId = "frontend-developer";

export const RECRUITMENT_ROLES: readonly RecruitmentRole[] = [
  {
    id: "frontend-developer",
    label: "Frontend Developer",
    tagline: "Xây dựng giao diện, trải nghiệm người dùng mượt mà.",
    tags: ["React", "TypeScript", "UI/UX", "Web API"],
    icon: CodeXml,
    tone: "blue",
  },
  {
    id: "backend-developer",
    label: "Backend Developer",
    tagline: "Thiết kế API, dữ liệu và logic nghiệp vụ.",
    tags: ["API", "Database", "Logic"],
    icon: Database,
    tone: "violet",
  },
  {
    id: "qa-tester",
    label: "QA / Tester",
    tagline: "Đảm bảo chất lượng sản phẩm bằng kiểm thử chặt chẽ.",
    tags: ["Testing", "Quality", "Bug Report"],
    icon: Bug,
    tone: "green",
  },
  {
    id: "business-analyst",
    label: "Business Analyst",
    tagline: "Phân tích yêu cầu, bridge giữa nghiệp vụ và dev team.",
    tags: ["Requirement", "User Story", "Documentation"],
    icon: ClipboardList,
    tone: "amber",
  },
];

export function getRoleLabel(id: RoleId): string {
  return (
    RECRUITMENT_ROLES.find((role) => role.id === id)?.label ?? "Frontend Developer"
  );
}

/**
 * Vai trò AI Recruiter đề xuất khi ứng viên KHÔNG đạt vị trí đã chọn.
 * Mock story theo reference: fail Frontend → QA / Tester. Nếu ứng viên
 * trượt đúng QA / Tester thì đề xuất Business Analyst để không tự đề xuất
 * chính vị trí vừa trượt.
 */
export function getSuggestedRoleId(appliedRoleId: RoleId): RoleId {
  return appliedRoleId === "qa-tester" ? "business-analyst" : "qa-tester";
}

/* ------------------------------ Welcome step ------------------------------ */

export const WELCOME_BREADCRUMB = ["Student Entry", "Onboarding"] as const;

export interface WelcomeInfoItem {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  tone: InternTone;
}

export const WELCOME_HEADING = "Chào mừng bạn đến với V-Intern!";
export const WELCOME_SUBTITLE =
  "Trước khi bước vào không gian làm việc thực tập, bạn sẽ trải qua một vòng tuyển dụng ngắn cùng AI Recruiter để xác định vị trí phù hợp nhất.";

export const WELCOME_INFO_QUESTION = "Bạn sắp trải qua điều gì?";

export const WELCOME_INFO_ITEMS: readonly WelcomeInfoItem[] = [
  {
    id: "kham-pha",
    title: "Khám phá môi trường V-Intern",
    description:
      "Tìm hiểu cách V-Intern đồng hành cùng sinh viên qua dự án thực tế, sprint và review như một team thật.",
    icon: Compass,
    tone: "sky",
  },
  {
    id: "chon-vai-tro",
    title: "Chọn vị trí ứng tuyển",
    description:
      "Chọn một trong bốn vị trí phù hợp với thế mạnh: Frontend, Backend, QA / Tester hoặc Business Analyst.",
    icon: Target,
    tone: "violet",
  },
  {
    id: "phong-van",
    title: "Hoàn thành phỏng vấn đánh giá",
    description:
      "Trả lời 8 câu hỏi cùng AI Recruiter, kết hợp cả Technical và Soft Skill trong khoảng 30 phút.",
    icon: Bot,
    tone: "blue",
  },
  {
    id: "ket-qua",
    title: "Nhận kết quả tuyển dụng",
    description:
      "Xem điểm Overall theo công thức 70% Technical + 30% Soft Skill và đề xuất phù hợp từ AI Recruiter.",
    icon: Award,
    tone: "amber",
  },
];

export const WELCOME_GUIDANCE_TITLE = "Hướng dẫn nhanh";
export const WELCOME_GUIDANCE_ITEMS: readonly string[] = [
  "Toàn bộ quy trình gồm 4 bước và bạn có thể theo dõi tiến độ trên thanh trạng thái phía trên.",
  "Phỏng vấn gồm 8 câu hỏi — trả lời bằng văn bản, câu trả lời được ghi nhận ngay khi gửi.",
  "Điểm Overall được tính = 70% Technical + 30% Soft Skill; đạt từ 70/100 trở lên để trúng tuyển vị trí đã chọn.",
  "Nếu chưa đạt, AI Recruiter sẽ đề xuất một vị trí phù hợp hơn để bạn tiếp tục.",
];

/* ------------------------------- Role step -------------------------------- */

export const ROLE_STEP_HEADING = "Chọn vị trí ứng tuyển";
export const ROLE_STEP_SUBTITLE =
  "Chọn đúng thế mạnh của bạn — AI Recruiter sẽ đánh giá năng lực theo vị trí này.";
export const ROLE_STEP_EXPLAIN_TITLE =
  "Sau khi chọn vai trò, điều gì sẽ xảy ra?";
export const ROLE_STEP_NOTE =
  "Bạn có thể thay đổi lựa chọn vai trò trước khi bắt đầu phỏng vấn.";

export const ROLE_STEP_EXPLAIN_ITEMS: readonly string[] = [
  "Bạn trả lời 8 câu hỏi phỏng vấn cùng AI Recruiter — gồm cả Technical và Soft Skill.",
  "Điểm Overall được tính = 70% Technical + 30% Soft Skill.",
  "Overall ≥ 70 → bạn trúng tuyển vị trí đã chọn và chờ giảng viên phân công.",
  "Overall < 70 → AI Recruiter đề xuất một vị trí phù hợp hơn để bạn tiếp tục.",
];

/* ----------------------------- Interview step ----------------------------- */

export const INTERVIEW_HEADING = "Phỏng vấn cùng AI Recruiter";

/** Timer mock tĩnh theo reference — KHÔNG đếm ngược thật (tránh fake realtime). */
export const INTERVIEW_TIMER_LABEL = "18:24";
export const INTERVIEW_TOTAL_MINUTES = 30;

/** Giới hạn ký tự của ô trả lời (mock, khớp reference "0/2000"). */
export const INTERVIEW_MAX_ANSWER_LENGTH = 2000;

/**
 * 8 câu hỏi mock theo cấu trúc reference: 5 Technical + 3 Soft Skill.
 * `- Chữ "Câu n" hiển thị trên UI derive từ vị trí trong mảng (1-based).
 */
export const INTERVIEW_QUESTIONS: readonly InterviewQuestion[] = [
  {
    id: "q1",
    category: "Technical",
    shortTitle: "Kiến thức nền tảng",
    prompt:
      "Hãy trình bày những kiến thức nền tảng bạn thấy chắc chắn nhất khi làm web (HTML, CSS, JavaScript/TypeScript) và cách bạn tự luyện tập chúng.",
    hint: "Nêu ví dụ cụ thể bạn từng làm thay vì liệt kê công nghệ.",
  },
  {
    id: "q2",
    category: "Technical",
    shortTitle: "Vì sao chọn vị trí này",
    prompt:
      "Tại sao bạn chọn vị trí {role}? Bạn hiểu gì về công việc hằng ngày của vị trí này?",
    hint: "Kết nối thế mạnh cá nhân với đặc thù của vị trí.",
  },
  {
    id: "q3",
    category: "Technical",
    shortTitle: "Xử lý validation form",
    prompt:
      "Khi xây dựng một form, bạn xử lý validation ở client và server như thế nào? Ưu và nhược điểm của từng mức?",
    hint: "Nêu ví dụ: bắt buộc nhập email, kiểm tra độ dài mật khẩu...",
  },
  {
    id: "q4",
    category: "Technical",
    shortTitle: "Quản lý state",
    prompt:
      "Với một ứng dụng vừa phải, bạn chọn chiến lược quản lý state nào (useState, context, thư viện ngoài...) và vì sao?",
    hint: "Cân nhắc giữa độ phức tạp và khả năng bảo trì.",
  },
  {
    id: "q5",
    category: "Technical",
    shortTitle: "Xử lý lỗi ứng dụng",
    prompt:
      "Khi gọi API thất bại giữa chừng, bạn xử lý lỗi phía frontend ra sao để người dùng không bị kẹt?",
    hint: "Nghĩ về loading, thông báo lỗi, thử lại.",
  },
  {
    id: "q6",
    category: "Soft Skill",
    shortTitle: "Làm việc nhóm",
    prompt:
      "Kể về một lần làm việc nhóm có mâu thuẫn về hướng giải pháp. Bạn đã xử lý thế nào?",
    hint: "Mô tả tình huống – hành động – kết quả.",
  },
  {
    id: "q7",
    category: "Soft Skill",
    shortTitle: "Tình huống thực tế",
    prompt:
      "Nếu bạn nhận một task nhưng thời gian quá gấp so với khối lượng, bạn sẽ làm gì?",
    hint: "Ưu tiên giao tiếp sớm với người giao việc.",
  },
  {
    id: "q8",
    category: "Soft Skill",
    shortTitle: "Định hướng nghề nghiệp",
    prompt: "Định hướng nghề nghiệp của bạn trong 2 năm tới là gì?",
    hint: "Chia sẻ mục tiêu học tập và công việc cụ thể.",
  },
];

/** Số câu trả lời đã ghi nhận trước khi vào màn phỏng vấn (mock story: Q1–Q2). */
export const INTERVIEW_ANSWERED_SEED = 2;

/** Câu trả lời mock đã ghi nhận cho Q1–Q2 (giống nội dung người dùng đã gửi). */
export const INTERVIEW_SEED_ANSWERS: Readonly<Record<string, string>> = {
  q1: "Em nắm vững HTML/CSS và TypeScript: tự làm lại landing page bằng flexbox/grid, luyện thuật toán mỗi tuần và viết small components bằng React + TypeScript để quen kiểu hóa.",
  q2: "Em chọn vị trí này vì em thích biến thiết kế thành giao diện chạy thật. Em hiểu công việc hằng ngày gồm dựng UI từ design, tích hợp API và tối ưu trải nghiệm người dùng.",
};

/** Format prompt, thay `{role}` bằng label vị trí đang ứng tuyển. */
export function formatQuestionPrompt(
  question: InterviewQuestion,
  roleLabel: string
): string {
  return question.prompt.replaceAll("{role}", roleLabel);
}

/* -------------------------------- Result ---------------------------------- */

const RESULT_QUOTE_PASS =
  "Một bước tốt hôm nay là nền tảng cho những sprint đáng nhớ phía trước.";
const RESULT_QUOTE_FAIL =
  "Mỗi vòng phỏng vấn là một lần luyện tập — chặng kế tiếp đã có đường đi rõ ràng.";

const RECOMMENDATION_REASONS_QA: readonly string[] = [
  "Bạn thể hiện sự cẩn thận, tỉ mỉ khi mô tả cách xử lý tình huống và kiểm soát rủi ro.",
  "Kiến thức kỹ năng mềm về giao tiếp, làm việc nhóm của bạn đạt mức tốt (72/100).",
  "Nhu cầu vị trí QA / Tester hiện cao và lộ trình phát triển phù hợp với thế mạnh quan sát chi tiết của bạn.",
];

const RECOMMENDATION_TAGS_QA: readonly string[] = [
  "Testing",
  "Quality",
  "Bug Report",
];

/** Dataset điểm gốc của 2 kịch bản — Overall luôn derive, không hardcode. */
const RESULT_SCORES_PASS: RecruitmentScores = { technical: 85, soft: 72 };
const RESULT_SCORES_FAIL: RecruitmentScores = { technical: 58, soft: 72 };

interface RecruitmentResultContent {
  headline: string;
  subtitle: string;
  feedback: readonly string[];
  nextSteps: readonly RecruitmentNextStep[];
  notes: readonly string[];
}

const RESULT_CONTENT_PASS: RecruitmentResultContent = {
  headline: "Chúc mừng bạn!",
  subtitle:
    "Bạn đã vượt qua vòng phỏng vấn AI Recruiter và chính thức trúng tuyển vị trí Frontend Developer tại V-Intern.",
  feedback: [
    "Bạn trình bày rõ ràng cách tách validation client/server, hiểu Trade-off giữa trải nghiệm và an toàn dữ liệu — điểm Technical 85/100 thuộc nhóm cao.",
    "Kỹ năng mềm tốt (72/100): cách bạn kể tình huống nhóm có cấu trúc, biết lắng nghe và điều chỉnh hướng giải pháp khi mâu thuẫn.",
    "Bước tiếp theo nên rèn thêm: viết test cho component và trình bày quyết định kỹ thuật ngắn gọn hơn trong thời gian giới hạn.",
  ],
  nextSteps: [
    {
      title: "Chờ giảng viên phân công",
      description:
        "Giảng viên sẽ gán bạn vào một Project và Internship Session phù hợp với vị trí Frontend Developer.",
    },
    {
      title: "Nhận thông báo phân công",
      description:
        "Khi được phân công, bạn nhận thông báo qua email và trong Workspace.",
    },
    {
      title: "Làm quen quy trình V-Intern",
      description:
        "Sau khi vào Workspace, bạn sẽ thấy Sprint, Task Board, AI Mentor và quy trình review PR.",
    },
  ],
  notes: [
    "Chưa có Project nào được phân công — mọi thông tin phân công sẽ do giảng viên quyết định.",
    "Điểm kết quả chỉ mang tính mô phỏng để trình bày UI.",
  ],
};

const RESULT_CONTENT_FAIL: RecruitmentResultContent = {
  headline: "Kết quả tuyển dụng",
  subtitle:
    "Bạn chưa đạt yêu cầu tuyển dụng vị trí Frontend Developer trong lần này — nhưng AI Recruiter có một đề xuất phù hợp hơn cho bạn.",
  feedback: [
    "Phần Technical (58/100) cho thấy nền tảng còn lỗ hổng: cách bạn mô tả validation và quản lý state chưa nêu rõ Trade-off và ví dụ thực tế.",
    "Kỹ năng mềm của bạn tốt (72/100): giao tiếp mạch lạc, thái độ tích cực khi xử lý tình huống khó.",
    "Dựa trên toàn bộ câu trả lời, AI Recruiter đánh giá bạn phù hợp hơn với công việc kiểm thử, nơi sự cẩn thận và giao tiếp rõ ràng là lợi thế lớn.",
  ],
  nextSteps: [
    {
      title: "Xem lại tiêu chí đánh giá",
      description:
        "Ôn lại các mục Technical còn yếu: validation, state management và xử lý lỗi.",
    },
    {
      title: "Tiếp tục với vị trí được đề xuất",
      description:
        "Chọn vị trí AI Recruiter đề xuất để bắt đầu lại vòng phỏng vấn cho vai trò mới.",
    },
    {
      title: "Thử lại trong kỳ sau",
      description:
        "Bạn có thể đăng ký phỏng vấn lại vị trí mong muốn trong kỳ tuyển dụng tiếp theo.",
    },
  ],
  notes: [
    "Đề xuất của AI Recruiter chỉ là gợi ý UI — bạn hoàn toàn chọn lại vai trò khác ở bước Chọn vị trí.",
    "Điểm kết quả chỉ mang tính mô phỏng để trình bày UI.",
  ],
};

/**
 * Dựng kết quả tuyển dụng từ điểm gốc + vai trò ứng tuyển.
 * Overall và passed luôn derive tại đây — nơi DUY NHẤT tạo Result data.
 */
export function buildRecruitmentResult(
  scores: RecruitmentScores,
  appliedRoleId: RoleId = DEFAULT_ROLE_ID
): RecruitmentResultData {
  const overall = calculateOverallScore(scores.technical, scores.soft);
  const passed = isPassed(overall);
  const content = passed ? RESULT_CONTENT_PASS : RESULT_CONTENT_FAIL;
  const appliedRoleLabel = getRoleLabel(appliedRoleId);

  const suggestedRole: SuggestedRole | null = passed
    ? null
    : {
        id: getSuggestedRoleId(appliedRoleId),
        label: getRoleLabel(getSuggestedRoleId(appliedRoleId)),
        tags: RECOMMENDATION_TAGS_QA,
        reasons: RECOMMENDATION_REASONS_QA,
      };

  return {
    status: passed ? "pass" : "fail",
    appliedRoleId,
    appliedRoleLabel,
    scores,
    overall,
    passed,
    headline: content.headline,
    subtitle: content.subtitle,
    feedback: content.feedback,
    nextSteps: content.nextSteps,
    notes: content.notes,
    quote: passed ? RESULT_QUOTE_PASS : RESULT_QUOTE_FAIL,
    suggestedRole,
  };
}

/** Kịch bản pass mock — dùng cho flow mặc định và `?_preview=pass`. */
export const RECRUITMENT_RESULT_PASS = buildRecruitmentResult(
  RESULT_SCORES_PASS
);

/** Kịch bản fail mock — dùng cho `?_preview=fail` (dev-only). */
export const RECRUITMENT_RESULT_FAIL = buildRecruitmentResult(
  RESULT_SCORES_FAIL
);

/**
 * Chọn Result data theo preview (dev-only) hoặc mặc định flow.
 * - Preview là cơ chế dev để xem cả 2 trạng thái của cùng một screen.
 * - Mặc định (không preview): dataset pass — story "vừa hoàn thành phỏng
 *   vấn và đậu". Khi BE có API, hàm này sẽ nhận kết quả thật từ backend.
 */
export function resolveRecruitmentResult(
  preview: "pass" | "fail" | null
): RecruitmentResultData {
  if (preview === "fail") return RECRUITMENT_RESULT_FAIL;
  return RECRUITMENT_RESULT_PASS;
}

/* --------------------------- Shared icon exports --------------------------- */

/** Icon dùng chung cho các card giải thích/phần thưởng (tránh re-import lẻ). */
export const ONBOARDING_SHARED_ICONS = {
  messages: MessagesSquare,
  checkList: ListChecks,
  fileSearch: FileSearch,
  sparkles: Sparkles,
  users: Users,
} as const;
