import { calculateOverallScore, isPassed } from "./recruitment-scoring";

/**
 * Pure result model for the recruitment funnel presentation.
 *
 * The presentation content (headlines, feedback copy, recommendation copy)
 * lives here so the score derivation stays single-sourced. All numbers are
 * derived — nothing is hardcoded per screen.
 */

export type RoleId =
  | "frontend-developer"
  | "backend-developer"
  | "qa-tester"
  | "business-analyst";

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

const ROLE_LABELS: Record<RoleId, string> = {
  "frontend-developer": "Frontend Developer",
  "backend-developer": "Backend Developer",
  "qa-tester": "QA / Tester",
  "business-analyst": "Business Analyst",
};

export function getRoleLabel(id: RoleId): string {
  return ROLE_LABELS[id];
}

/**
 * Vai trò AI Recruiter đề xuất khi ứng viên KHÔNG đạt vị trí đã chọn.
 * Nếu ứng viên trượt đúng QA / Tester thì đề xuất Business Analyst để
 * không tự đề xuất chính vị trí vừa trượt.
 */
export function getSuggestedRoleId(appliedRoleId: RoleId): RoleId {
  return appliedRoleId === "qa-tester" ? "business-analyst" : "qa-tester";
}

const RECOMMENDATION_TAGS_QA = ["Testing", "Quality", "Bug Report"] as const;

const RECOMMENDATION_REASONS_QA: readonly string[] = [
  "Bạn thể hiện sự cẩn thận, tỉ mỉ khi mô tả cách xử lý tình huống và kiểm soát rủi ro.",
  "Kiến thức kỹ năng mềm về giao tiếp, làm việc nhóm của bạn đạt mức tốt (72/100).",
  "Nhu cầu vị trí QA / Tester hiện cao và lộ trình phát triển phù hợp với thế mạnh quan sát chi tiết của bạn.",
];

const RESULT_CONTENT_PASS = {
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
} as const;

const RESULT_CONTENT_FAIL = {
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
} as const;

const RESULT_QUOTE_PASS =
  "Một bước tốt hôm nay là nền tảng cho những sprint đáng nhớ phía trước.";
const RESULT_QUOTE_FAIL =
  "Mỗi vòng phỏng vấn là một lần luyện tập — chặng kế tiếp đã có đường đi rõ ràng.";

/**
 * Dựng kết quả tuyển dụng từ điểm gốc + vai trò ứng tuyển.
 * Overall và passed luôn derive tại đây — nơi DUY NHẤT tạo Result data.
 */
export function buildRecruitmentResult(
  scores: RecruitmentScores,
  appliedRoleId: RoleId = "frontend-developer"
): RecruitmentResultData {
  const overall = calculateOverallScore(scores.technical, scores.soft);
  const passed = isPassed(overall);
  const content = passed ? RESULT_CONTENT_PASS : RESULT_CONTENT_FAIL;
  const appliedRoleLabel = getRoleLabel(appliedRoleId);
  const suggested = getSuggestedRoleId(appliedRoleId);

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
    suggestedRole: passed
      ? null
      : {
          id: suggested,
          label: getRoleLabel(suggested),
          tags: RECOMMENDATION_TAGS_QA,
          reasons: RECOMMENDATION_REASONS_QA,
        },
  };
}
