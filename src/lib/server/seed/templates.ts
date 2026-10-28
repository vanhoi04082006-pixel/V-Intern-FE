import type { ProjectTemplate } from "../types";
import { daysAgo } from "../util";

export function seedTemplates(): ProjectTemplate[] {
  const tecom: ProjectTemplate = {
    id: "tpl_ecom",
    code: "TPL-ECOM",
    name: "Sàn TMĐT EduMart",
    category: "E-commerce",
    difficulty: "intermediate",
    status: "active",
    version: 3,
    techStack: ["Next.js", "Node.js", "PostgreSQL", "Redis"],
    roles: ["frontend", "backend", "fullstack", "qa", "business_analyst"],
    teamSize: { min: 4, max: 6 },
    sprintCount: 4,
    description:
      "Xây dựng sàn thương mại điện tử chuyên bán học liệu: danh mục sản phẩm, giỏ hàng, checkout, tích hợp thanh toán sandbox, quản lý đơn hàng và báo cáo doanh thu. Dự án mẫu tốt cho đội 4-6 thực tập sinh muốn trải nghiệm trọn vòng đời sản phẩm.",
    createdAt: daysAgo(90),
    blueprint: {
      overview:
        "EduMart là phiên bản rút gọn của một sàn TMĐT thực tế với trọng tâm: trải nghiệm mua hàng mượt (SSR + ISR), API chuẩn REST có versioning, thanh toán sandbox, bộ kiểm thử hồi quy tự động và báo cáo vận hành. Đội ngũ làm theo Scrum, mỗi sprint 2 tuần có demo cuối sprint.",
      roleDetails: [
        {
          code: "frontend",
          label: "Lập trình viên Frontend",
          countMin: 1,
          countMax: 2,
          skills: ["React", "Next.js", "TailwindCSS", "Zustand", "Playwright (cơ bản)"],
          responsibilities: [
            "Xây dựng các trang mua hàng theo design system",
            "Tối ưu hiệu năng render danh sách và form nhiều bước",
            "Bắt API chuẩn hợp đồng với backend, xử lý trạng thái loading/error",
            "Viết unit test cho component và tiện ích",
          ],
        },
        {
          code: "backend",
          label: "Lập trình viên Backend",
          countMin: 1,
          countMax: 2,
          skills: ["Node.js", "Express", "PostgreSQL", "Redis", "REST API"],
          responsibilities: [
            "Thiết kế schema CSDL và migration",
            "Xây dựng REST API cho sản phẩm, giỏ hàng, đơn hàng",
            "Tích hợp cổng thanh toán sandbox",
            "Viết test tích hợp và đảm bảo an toàn API",
          ],
        },
        {
          code: "fullstack",
          label: "Lập trình viên Full-stack",
          countMin: 1,
          countMax: 1,
          skills: ["Next.js", "API Route", "PostgreSQL", "Vercel/CI"],
          responsibilities: [
            "Phát triển tính năng trọn gói từ UI đến API",
            "Cấu hình CI/CD và pipeline kiểm tra chất lượng",
            "Hỗ trợ kết nối các phần giao tiếp giữa FE-BE",
          ],
        },
        {
          code: "qa",
          label: "Kỹ sư kiểm thử (QA)",
          countMin: 1,
          countMax: 1,
          skills: ["Test plan", "Playwright", "Postman", "Jira"],
          responsibilities: [
            "Viết test plan và bộ kịch bản hồi quy",
            "Tự động hóa luồng E2E chính (duyệt — giỏ — thanh toán)",
            "Báo cáo bug kèm bằng chứng tái hiện rõ ràng",
          ],
        },
        {
          code: "business_analyst",
          label: "Chuyên viên phân tích nghiệp vụ (BA)",
          countMin: 0,
          countMax: 1,
          skills: ["User story", "UML", "Figma", "Jira"],
          responsibilities: [
            "Bám sát yêu cầu, viết user story kèm tiêu chí nghiệm thu",
            "Tổng hợp tài liệu hướng dẫn sử dụng cho demo cuối kỳ",
            "Là cầu nối giữa đội dev và mentor/nhà đầu tư giả định",
          ],
        },
      ],
      sprints: [
        {
          code: "SPR-01",
          name: "Sprint 1 — Nền tảng & Danh mục sản phẩm",
          goal: "Dựng nền dự án chuẩn, chạy được luồng duyệt danh mục sản phẩm end-to-end.",
          tasks: [
            { title: "Khởi tạo dự án Next.js và cấu hình chuẩn code (ESLint, Prettier, CI)", priority: "high", storyPoints: 2, role: "fullstack" },
            { title: "Thiết kế schema CSDL PostgreSQL cho sản phẩm, danh mục và đơn hàng", priority: "high", storyPoints: 5, role: "backend" },
            { title: "Xây dựng layout chung và điều hướng cửa hàng", priority: "high", storyPoints: 3, role: "frontend" },
            { title: "Xây dựng trang danh mục sản phẩm kèm bộ lọc", priority: "high", storyPoints: 5, role: "frontend" },
            { title: "Component ProductCard và lưới hiển thị đáp ứng", priority: "medium", storyPoints: 3, role: "frontend" },
            { title: "API CRUD sản phẩm kèm seed dữ liệu mẫu", priority: "high", storyPoints: 5, role: "backend" },
            { title: "Viết kịch bản test smoke luồng duyệt sản phẩm", priority: "medium", storyPoints: 3, role: "qa" },
            { title: "Viết user story và tài liệu phạm vi MVP", priority: "medium", storyPoints: 2, role: "business_analyst" },
          ],
        },
        {
          code: "SPR-02",
          name: "Sprint 2 — Giỏ hàng & Thanh toán",
          goal: "Người dùng thêm vào giỏ, đi qua checkout và thanh toán sandbox thành công.",
          tasks: [
            { title: "Xây dựng trang giỏ hàng", priority: "high", storyPoints: 3, role: "frontend" },
            { title: "Tích hợp API giỏ hàng và trạng thái client (Zustand)", priority: "high", storyPoints: 3, role: "frontend" },
            { title: "Trang checkout nhiều bước — thông tin giao hàng", priority: "high", storyPoints: 2, role: "frontend" },
            { title: "Xử lý trạng thái trống và lỗi tải giỏ hàng", priority: "medium", storyPoints: 2, role: "frontend" },
            { title: "API thanh toán và xác thực đơn hàng", priority: "critical", storyPoints: 5, role: "backend" },
            { title: "API áp dụng khuyến mãi tại giỏ hàng", priority: "medium", storyPoints: 3, role: "backend" },
            { title: "Widget khuyến mãi hiển thị tại giỏ", priority: "medium", storyPoints: 3, role: "fullstack" },
            { title: "Kiểm thử tự động luồng thêm vào giỏ", priority: "high", storyPoints: 3, role: "qa" },
          ],
        },
        {
          code: "SPR-03",
          name: "Sprint 3 — Đơn hàng & Vận hành",
          goal: "Người dùng theo dõi được đơn hàng; vận hành xử lý đơn qua trang quản trị nội bộ.",
          tasks: [
            { title: "Trang lịch sử đơn hàng của người dùng", priority: "high", storyPoints: 5, role: "frontend" },
            { title: "Trang quản trị nội bộ cho vận hành (xử lý đơn)", priority: "high", storyPoints: 5, role: "frontend" },
            { title: "API quản lý trạng thái đơn hàng", priority: "high", storyPoints: 5, role: "backend" },
            { title: "Tối ưu truy vấn báo cáo bằng indexing", priority: "medium", storyPoints: 3, role: "backend" },
            { title: "Xây dựng luồng email xác nhận đơn (mock)", priority: "medium", storyPoints: 3, role: "fullstack" },
            { title: "Bộ kiểm thử hồi quy luồng đặt hàng", priority: "high", storyPoints: 5, role: "qa" },
          ],
        },
        {
          code: "SPR-04",
          name: "Sprint 4 — Báo cáo & Tối ưu",
          goal: "Có số liệu vận hành, hiệu năng đạt chuẩn và nghiệm thu sản phẩm.",
          tasks: [
            { title: "API thống kê doanh thu theo danh mục", priority: "high", storyPoints: 5, role: "backend" },
            { title: "Dashboard báo cáo doanh thu cho mentor", priority: "medium", storyPoints: 5, role: "frontend" },
            { title: "Chuẩn hóa accessibility cho toàn bộ trang", priority: "medium", storyPoints: 2, role: "frontend" },
            { title: "Kiểm thử hiệu năng và sửa lỗi phát hiện", priority: "medium", storyPoints: 3, role: "qa" },
            { title: "Tổng hợp tài liệu hướng dẫn sử dụng", priority: "medium", storyPoints: 3, role: "business_analyst" },
          ],
        },
      ],
      milestones: [
        { title: "Chốt thiết kế CSDL và hợp đồng API", dueOffsetDays: 7 },
        { title: "Demo MVP: duyệt danh mục + giỏ hàng", dueOffsetDays: 21 },
        { title: "Tích hợp thanh toán sandbox chạy được", dueOffsetDays: 42 },
        { title: "Trang quản trị vận hành bàn giao", dueOffsetDays: 63 },
        { title: "Nghiệm thu cuối kỳ & bảo vệ đồ án", dueOffsetDays: 84 },
      ],
    },
  };

  const ttask: ProjectTemplate = {
    id: "tpl_task",
    code: "TPL-TASK",
    name: "Quản lý công việc SaaS",
    category: "Web App",
    difficulty: "beginner",
    status: "active",
    version: 2,
    techStack: ["React", "Node.js", "SQLite"],
    roles: ["frontend", "backend", "fullstack"],
    teamSize: { min: 3, max: 5 },
    sprintCount: 3,
    description:
      "Dự án quản lý công việc kiểu SaaS mini: bảng kanban, gán việc, nhắc hạn, thống kê cá nhân. Phù hợp đội 3-5 thực tập sinh lần đầu làm sản phẩm, công nghệ gọn, dễ triển khai.",
    createdAt: daysAgo(60),
    blueprint: {
      overview:
        "Một bản rút gọn của Trello/Jira: đăng nhập, dự án, bảng kanban kéo-thả, comment, due date và thống kê heatmap cá nhân. Tập trung rèn quy trình Scrum, Git flow và chất lượng code hơn là độ phức tạp.",
      roleDetails: [
        {
          code: "frontend",
          label: "Lập trình viên Frontend",
          countMin: 1,
          countMax: 2,
          skills: ["React", "TailwindCSS", "dnd-kit", "Recharts"],
          responsibilities: [
            "Xây dựng giao diện kanban kéo-thả",
            "Làm dashboard thống kê cá nhân",
            "Viết component tái sử dụng theo design system",
          ],
        },
        {
          code: "backend",
          label: "Lập trình viên Backend",
          countMin: 1,
          countMax: 1,
          skills: ["Node.js", "Express", "SQLite", "JWT"],
          responsibilities: [
            "Thiết kế schema và REST API cho task/dự án",
            "Xây dựng xác thực JWT và phân quyền thành viên",
            "Viết seed dữ liệu và test tích hợp",
          ],
        },
        {
          code: "fullstack",
          label: "Lập trình viên Full-stack",
          countMin: 1,
          countMax: 2,
          skills: ["React", "Express", "Vite", "Deploy"],
          responsibilities: [
            "Làm trọn tính năng nhỏ từ UI tới API",
            "Cấu hình deploy bản demo lên môi trường miễn phí",
            "Chuẩn bị kịch bản demo cuối kỳ",
          ],
        },
      ],
      sprints: [
        {
          code: "SPR-01",
          name: "Sprint 1 — Xác thực & Dự án",
          goal: "Người dùng đăng nhập, tạo dự án và mời thành viên.",
          tasks: [
            { title: "Khởi tạo repo và chuẩn code (lint, format)", priority: "high", storyPoints: 2, role: "fullstack" },
            { title: "Thiết kế schema SQLite cho user, project, task", priority: "high", storyPoints: 3, role: "backend" },
            { title: "API xác thực JWT (đăng ký, đăng nhập)", priority: "high", storyPoints: 3, role: "backend" },
            { title: "Trang đăng nhập và đăng ký", priority: "high", storyPoints: 3, role: "frontend" },
            { title: "Trang tạo dự án và danh sách dự án", priority: "medium", storyPoints: 3, role: "frontend" },
            { title: "API mời thành viên vào dự án", priority: "medium", storyPoints: 2, role: "backend" },
          ],
        },
        {
          code: "SPR-02",
          name: "Sprint 2 — Kanban & Tương tác",
          goal: "Bảng kanban hoạt động đầy đủ: kéo-thả, comment, due date.",
          tasks: [
            { title: "API CRUD task và di chuyển cột", priority: "high", storyPoints: 5, role: "backend" },
            { title: "Bảng kanban kéo-thả với dnd-kit", priority: "high", storyPoints: 5, role: "frontend" },
            { title: "Chi tiết task và comment", priority: "medium", storyPoints: 3, role: "frontend" },
            { title: "Nhắc hạn due date bằng toast", priority: "medium", storyPoints: 2, role: "fullstack" },
            { title: "Sửa lỗi và polish UI sau demo giữa kỳ", priority: "medium", storyPoints: 3, role: "fullstack" },
          ],
        },
        {
          code: "SPR-03",
          name: "Sprint 3 — Thống kê & Bàn giao",
          goal: "Dashboard thống kê cá nhân, tối ưu và chuẩn bị nghiệm thu.",
          tasks: [
            { title: "API thống kê công việc theo tuần", priority: "high", storyPoints: 3, role: "backend" },
            { title: "Dashboard biểu đồ heatmap cá nhân", priority: "high", storyPoints: 5, role: "frontend" },
            { title: "Trang hồ sơ và tùy chọn cá nhân", priority: "low", storyPoints: 2, role: "frontend" },
            { title: "Viết README và tài liệu triển khai", priority: "medium", storyPoints: 2, role: "fullstack" },
            { title: "Kiểm thử và sửa lỗi trước nghiệm thu", priority: "high", storyPoints: 3, role: "fullstack" },
          ],
        },
      ],
      milestones: [
        { title: "Chốt schema CSDL", dueOffsetDays: 5 },
        { title: "Demo đăng nhập + dự án", dueOffsetDays: 14 },
        { title: "Demo kanban đầy đủ", dueOffsetDays: 35 },
        { title: "Nghiệm thu sản phẩm", dueOffsetDays: 56 },
      ],
    },
  };

  const tedu: ProjectTemplate = {
    id: "tpl_edu",
    code: "TPL-EDU",
    name: "Cổng thông tin sinh viên",
    category: "Education",
    difficulty: "intermediate",
    status: "active",
    version: 1,
    techStack: ["Next.js", "Node.js", "PostgreSQL"],
    roles: ["frontend", "backend", "qa", "business_analyst"],
    teamSize: { min: 3, max: 5 },
    sprintCount: 3,
    description:
      "Cổng thông tin sinh viên cho khoa: lịch học, điểm số, đăng ký môn học và thông báo. Dữ liệu giả lập bảo mật, nhấn mạnh chất lượng nghiệp vụ và kiểm thử.",
    createdAt: daysAgo(45),
    blueprint: {
      overview:
        "Hệ thống quản lý học tập mini: sinh viên tra cứu lịch học, xem điểm theo học kỳ, đăng ký tín chỉ trong window mở lớp, nhận thông báo từ khoa. Có trang quản trị cho văn phòng khoa (seed dữ liệu).",
      roleDetails: [
        {
          code: "frontend",
          label: "Lập trình viên Frontend",
          countMin: 1,
          countMax: 2,
          skills: ["React", "Next.js", "TailwindCSS", "TanStack Query"],
          responsibilities: [
            "Xây trang lịch học dạng tuần/tháng",
            "Bảng điểm theo học kỳ với filter",
            "Luồng đăng ký môn có xác nhận",
          ],
        },
        {
          code: "backend",
          label: "Lập trình viên Backend",
          countMin: 1,
          countMax: 2,
          skills: ["Node.js", "PostgreSQL", "REST", "CSV import"],
          responsibilities: [
            "Schema sinh viên — lớp — môn — điểm",
            "API đăng ký môn có kiểm tra điều kiện tiên quyết",
            "Import dữ liệu lớp từ CSV",
          ],
        },
        {
          code: "qa",
          label: "Kỹ sư kiểm thử (QA)",
          countMin: 0,
          countMax: 1,
          skills: ["Test plan", "API test", "Playwright"],
          responsibilities: [
            "Bộ test cho luồng đăng ký môn",
            "Kiểm thử dữ liệu import CSV",
            "Regression trước mỗi demo",
          ],
        },
        {
          code: "business_analyst",
          label: "Chuyên viên phân tích nghiệp vụ (BA)",
          countMin: 0,
          countMax: 1,
          skills: ["UML", "User story", "Quy trình"],
          responsibilities: [
            "Mô hình hóa quy trình đăng ký tín chỉ",
            "Chuẩn hóa nghiệp vụ quy đổi điểm",
            "Viết tài liệu hướng dẫn cho văn phòng khoa",
          ],
        },
      ],
      sprints: [
        {
          code: "SPR-01",
          name: "Sprint 1 — Nền móng & Thông tin cơ bản",
          goal: "Sinh viên đăng nhập được và tra cứu thông tin cơ bản.",
          tasks: [
            { title: "Khởi tạo dự án và chuẩn code", priority: "high", storyPoints: 2, role: "backend" },
            { title: "Schema sinh viên — môn — lớp — điểm", priority: "high", storyPoints: 5, role: "backend" },
            { title: "Đăng nhập sinh viên bằng mã số + mật khẩu", priority: "high", storyPoints: 3, role: "frontend" },
            { title: "Trang thông tin cá nhân sinh viên", priority: "medium", storyPoints: 3, role: "frontend" },
            { title: "Viết user story nghiệp vụ điểm số", priority: "medium", storyPoints: 2, role: "business_analyst" },
          ],
        },
        {
          code: "SPR-02",
          name: "Sprint 2 — Lịch học & Điểm số",
          goal: "Tra cứu lịch học theo tuần và bảng điểm theo học kỳ.",
          tasks: [
            { title: "API lịch học và điểm số", priority: "high", storyPoints: 5, role: "backend" },
            { title: "Trang lịch học dạng tuần", priority: "high", storyPoints: 5, role: "frontend" },
            { title: "Bảng điểm với filter học kỳ", priority: "high", storyPoints: 3, role: "frontend" },
            { title: "Import điểm từ CSV cho văn phòng khoa", priority: "medium", storyPoints: 3, role: "backend" },
            { title: "Kiểm thử API điểm số", priority: "medium", storyPoints: 3, role: "qa" },
          ],
        },
        {
          code: "SPR-03",
          name: "Sprint 3 — Đăng ký môn & Thông báo",
          goal: "Đăng ký tín chỉ trong window và nhận thông báo khoa.",
          tasks: [
            { title: "API đăng ký môn kèm điều kiện tiên quyết", priority: "critical", storyPoints: 5, role: "backend" },
            { title: "Luồng UI đăng ký môn có xác nhận", priority: "high", storyPoints: 5, role: "frontend" },
            { title: "Hệ thống thông báo trong app", priority: "medium", storyPoints: 3, role: "frontend" },
            { title: "Kiểm thử luồng đăng ký E2E", priority: "high", storyPoints: 3, role: "qa" },
            { title: "Tài liệu nghiệp vụ bàn giao", priority: "medium", storyPoints: 2, role: "business_analyst" },
          ],
        },
      ],
      milestones: [
        { title: "Chốt schema và dữ liệu mẫu", dueOffsetDays: 7 },
        { title: "Demo tra cứu lịch + điểm", dueOffsetDays: 21 },
        { title: "Demo đăng ký môn", dueOffsetDays: 42 },
        { title: "Nghiệm thu cổng thông tin", dueOffsetDays: 56 },
      ],
    },
  };

  return [tecom, ttask, tedu];
}
