import type { LucideIcon } from "lucide-react";
import {
  Award,
  Bot,
  Bug,
  ClipboardList,
  CodeXml,
  Compass,
  Database,
  Target,
} from "lucide-react";
import type { InternTone } from "../intern-ui-tones";
import type { RecruitmentRole as RoleCode } from "@/lib/api/workspace";
export interface RecruitmentRole {
  id: RoleCode;
  label: string;
  tagline: string;
  tags: readonly string[];
  icon: LucideIcon;
  tone: InternTone;
}
export const RECRUITMENT_ROLES: readonly RecruitmentRole[] = [
  {
    id: "frontend",
    label: "Frontend Developer",
    tagline: "Xây dựng giao diện và trải nghiệm người dùng.",
    tags: ["React", "TypeScript", "UI/UX"],
    icon: CodeXml,
    tone: "blue",
  },
  {
    id: "backend",
    label: "Backend Developer",
    tagline: "Thiết kế API, dữ liệu và logic nghiệp vụ.",
    tags: ["API", "Database", "Logic"],
    icon: Database,
    tone: "violet",
  },
  {
    id: "qa",
    label: "QA Tester",
    tagline: "Đảm bảo chất lượng sản phẩm qua kiểm thử.",
    tags: ["Testing", "Quality", "Bug Report"],
    icon: Bug,
    tone: "green",
  },
  {
    id: 'fullstack', label: 'Fullstack Developer',
    tagline: 'Kết nối giao diện, API và dữ liệu thành một sản phẩm hoàn chỉnh.',
    tags: ['React', 'API', 'Database'], icon: CodeXml, tone: 'sky',
  },
  {
    id: "business_analyst",
    label: "Business Analyst",
    tagline: "Phân tích yêu cầu và kết nối nghiệp vụ với nhóm phát triển.",
    tags: ["Requirement", "User Story"],
    icon: ClipboardList,
    tone: "amber",
  },
];
/** Legacy entries supply icon/art direction only, never the selectable catalog. */
export function presentCareer(role: { code: string; label: string; description: string; requiredSkills: string[] }): RecruitmentRole {
  const visual = RECRUITMENT_ROLES.find(item => item.id === role.code);
  return { id: role.code, label: role.label, tagline: role.description || visual?.tagline || 'Khám phá yêu cầu và kỹ năng cho vị trí này.', tags: role.requiredSkills.slice(0, 3), icon: visual?.icon ?? Compass, tone: visual?.tone ?? 'blue' };
}
export const ONBOARDING_STEPS = [
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
export const WELCOME_BREADCRUMB = ["Student Entry", "Onboarding"];
export const WELCOME_HEADING = "Chào mừng bạn đến với V-Intern!";
export const WELCOME_SUBTITLE =
  "Trước khi bước vào không gian thực tập, bạn sẽ trải qua vòng tuyển dụng cùng AI Recruiter để xác định vị trí phù hợp.";
export const WELCOME_INFO_QUESTION = "Bạn sắp trải qua điều gì?";
export const WELCOME_INFO_ITEMS = [
  {
    id: "explore",
    title: "Khám phá môi trường V-Intern",
    description: "Tìm hiểu môi trường thực tập qua dự án, Sprint và review.",
    icon: Compass,
    tone: "sky" as const,
  },
  {
    id: "role",
    title: "Chọn vị trí ứng tuyển",
    description: "Chọn Frontend, Backend, Fullstack, QA Tester hoặc Business Analyst.",
    icon: Target,
    tone: "violet" as const,
  },
  {
    id: "interview",
    title: "Hoàn thành phỏng vấn đánh giá",
    description:
      "Trả lời câu hỏi kỹ thuật và kỹ năng mềm. Thời gian được hệ thống xác định khi bắt đầu.",
    icon: Bot,
    tone: "blue" as const,
  },
  {
    id: "result",
    title: "Nhận kết quả tuyển dụng",
    description: "Xem điểm và quyết định tuyển dụng do hệ thống trả về.",
    icon: Award,
    tone: "amber" as const,
  },
];
export const WELCOME_GUIDANCE_TITLE = "Hướng dẫn nhanh";
export const WELCOME_GUIDANCE_ITEMS = [
  "Theo dõi quy trình qua bốn bước phía trên.",
  "Câu trả lời được lưu vào hệ thống khi bạn gửi.",
  "Điểm và quyết định tuyển dụng được xử lý trên hệ thống.",
  "Dưới 50 điểm: chưa đạt. Từ 50 đến 70: AI đề xuất vai trò khác. Trên 70: đậu.",
  "Tối đa 3 lượt tổng cộng; đổi vai trò không đặt lại lượt. Thời gian chờ được hiển thị trước lần tiếp theo.",
];
