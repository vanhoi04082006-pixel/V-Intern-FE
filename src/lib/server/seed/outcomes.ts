import type {
  Certificate,
  Evaluation,
  EvaluationCycle,
  Criterion,
  KpiRecord,
  MentorConversation,
  MentorMessage,
  RecommendationSet,
  SalaryEntry,
} from "../types";
import { daysAgo, randomId } from "../util";

export function seedCycles(): EvaluationCycle[] {
  return [
    { id: "cyc_01", name: "Đánh giá giữa kỳ S1", status: "open", startDate: daysAgo(21), endDate: daysAgo(-7), createdAt: daysAgo(24) },
    { id: "cyc_02", name: "Đánh giá cuối kỳ S1", status: "draft", startDate: daysAgo(-14), endDate: daysAgo(-40), createdAt: daysAgo(3) },
    { id: "cyc_03", name: "Đánh giá kỳ Xuân 2024", status: "archived", startDate: daysAgo(380), endDate: daysAgo(310), createdAt: daysAgo(385) },
  ];
}

const CRITERIA_SEEDS: [string, string, number][] = [
  ["TECH_FOUNDATION", "Nền tảng kỹ thuật", 0.3],
  ["TASK_DELIVERY", "Bàn giao & tiến độ", 0.25],
  ["TEAMWORK", "Làm việc nhóm", 0.15],
  ["COMMUNICATION", "Giao tiếp & báo cáo", 0.15],
  ["GROWTH", "Tăng trưởng kỹ năng", 0.15],
];

export function seedCriteria(): Criterion[] {
  const out: Criterion[] = [];
  for (const cycle of ["cyc_01", "cyc_02", "cyc_03"]) {
    CRITERIA_SEEDS.forEach(([code, label, weight], i) => {
      out.push({ id: `cri_${cycle.replace("cyc_", "")}_${i + 1}`, cycleId: cycle, code, label, weight, maxScore: 100 });
    });
  }
  return out;
}

export function seedEvaluations(): Evaluation[] {
  const mk = (
    id: string,
    cycleId: string,
    cycleName: string,
    internId: string,
    internName: string,
    status: Evaluation["status"],
    scores: (number | null)[],
    comments: (string | null)[],
    summary: string | null,
    createdAtDays: number,
    actionDays: number
  ): Evaluation => {
    const cri = CRITERIA_SEEDS.map(([code, label, weight], i) => ({
      criterionId: `cri_${cycleId.replace("cyc_", "")}_${i + 1}`,
      criterionCode: code,
      label,
      weight,
      score: scores[i],
      comment: comments[i],
    }));
    const filled = cri.filter((s) => s.score != null);
    const overall =
      filled.length === 0
        ? null
        : Math.round(filled.reduce((acc, s) => acc + (s.score as number) * s.weight, 0) / filled.reduce((acc, s) => acc + s.weight, 0));
    return {
      id,
      cycleId,
      cycleName,
      internId,
      internName,
      status,
      overallScore: overall,
      summary,
      evaluatorId: "usr_hong",
      evaluatorName: "Hồng Lê",
      scores: cri,
      createdAt: daysAgo(createdAtDays),
      updatedAt: daysAgo(actionDays),
      submittedAt: status !== "draft" ? daysAgo(actionDays, 4) : null,
      finalizedAt: status === "finalized" ? daysAgo(actionDays) : null,
    };
  };

  return [
    mk("ev_01", "cyc_01", "Đánh giá giữa kỳ S1", "usr_an", "An Nguyễn", "finalized",
      [85, 82, 80, 84, 88],
      ["Nắm chắc React và Next.js, code dễ đọc", "Bàn giao đều, có 1 task trễ hạn nhỏ", "Tích cực hỗ trợ bạn cùng nhóm UI", "Báo cáo tuần rõ ràng, chủ động", "Tiến bộ rõ về testing"],
      "An có nền tảng kỹ thuật tốt, làm việc chủ động và tiến bộ rõ rệt qua 2 sprint đầu. Cần chú ý hơn về deadline.", 22, 18),
    mk("ev_02", "cyc_01", "Đánh giá giữa kỳ S1", "usr_minhha", "Minh Hà Trần", "finalized",
      [82, 80, 78, 82, 83],
      ["Thiết kế API chuẩn REST, schema tốt", "Tiến độ ổn", "Phối hợp tốt với frontend", "Giao tiếp rõ", "Học nhanh"],
      "Minh Hà có tư duy backend tốt và tiến độ ổn định.", 22, 18),
    mk("ev_03", "cyc_01", "Đánh giá giữa kỳ S1", "usr_lam", "Lam Phạm", "submitted",
      [74, 75, 78, 77, 78],
      ["Fullstack khá toàn diện", "Bàn giao đúng hạn", "Sẵn sàng support mọi người", "Báo cáo ổn", "Tiến bộ đều"],
      "Lam làm việc đều và hỗ trợ nhóm tốt, cần sâu hơn về chất lượng test.", 21, 15),
    mk("ev_04", "cyc_01", "Đánh giá giữa kỳ S1", "usr_khanh", "Khánh Đoàn", "draft",
      [72, null, 70, null, null],
      ["Kịch bản test tốt", null, "Phối hợp ổn", null, null],
      null, 20, 10),
    mk("ev_05", "cyc_02", "Đánh giá cuối kỳ S1", "usr_an", "An Nguyễn", "submitted",
      [83, 80, 78, 82, 86],
      ["Kỹ năng frontend vững, tối ưu tốt", "Sprint 2 có task phải rework 1 lần", "Hỗ trợ Khánh viết E2E", "Báo cáo tốt", "Tự học thêm testing"],
      "Đợt này An tiến bộ về chất lượng code, chú ý giữ nhịp deadline ở sprint cuối.", 3, 1),
    mk("ev_06", "cyc_02", "Đánh giá cuối kỳ S1", "usr_thao", "Thảo Nguyễn", "draft",
      [null, null, null, null, null],
      [null, null, null, null, null],
      null, 3, 3),
  ];
}

export function seedKpis(): KpiRecord[] {
  return [
    {
      id: "kpi_an_q2",
      userId: "usr_an",
      period: "2025-Q2",
      status: "calculated",
      finalScore: 81.9,
      calculatedAt: daysAgo(5),
      metrics: [
        { metricCode: "TASK_COMPLETION", label: "Tỷ lệ hoàn thành task", sourceValue: 57.1, configuredWeight: 0.3, effectiveWeight: 0.3, weightedContribution: 17.1, sourceJson: { completedTasks: 8, totalTasks: 14 } },
        { metricCode: "ON_TIME_DELIVERY", label: "Tỷ lệ giao đúng hạn", sourceValue: 87.5, configuredWeight: 0.25, effectiveWeight: 0.25, weightedContribution: 21.9, sourceJson: { onTime: 7, totalDone: 8 } },
        { metricCode: "CODE_QUALITY", label: "Chất lượng code (AI review + mentor)", sourceValue: 92, configuredWeight: 0.2, effectiveWeight: 0.2, weightedContribution: 18.4, sourceJson: { avgInstructorScore: 92, avgAiScore: 81 } },
        { metricCode: "MENTOR_ENGAGEMENT", label: "Tương tác với AI Mentor", sourceValue: 95, configuredWeight: 0.1, effectiveWeight: 0.1, weightedContribution: 9.5, sourceJson: { conversations: 4, questionsAsked: 9, avgResponseRating: 4.8 } },
        { metricCode: "PEER_COLLABORATION", label: "Phối hợp ngang hàng", sourceValue: 100, configuredWeight: 0.15, effectiveWeight: 0.15, weightedContribution: 15.0, sourceJson: { commentsReceived: 6, helpfulVotes: 5 } },
      ],
    },
  ];
}

export function seedSalary(): SalaryEntry[] {
  const e = (id: string, type: SalaryEntry["type"], amount: number, description: string, days: number): SalaryEntry => ({
    id,
    userId: "usr_an",
    type,
    amount,
    description,
    at: daysAgo(days),
  });
  return [
    e("led_01", "kpi_earning", 420000, "Thu nhập theo KPI — tuần 14", 84),
    e("led_02", "kpi_earning", 480000, "Thu nhập theo KPI — tuần 15", 77),
    e("led_03", "bonus", 300000, "Thưởng hoàn thành sớm Sprint 1", 70),
    e("led_04", "kpi_earning", 520000, "Thu nhập theo KPI — tuần 16", 63),
    e("led_05", "kpi_earning", 560000, "Thu nhập theo KPI — tuần 17", 56),
    e("led_06", "penalty", -80000, "Trừ do trễ hạn TSK-04", 49),
    e("led_07", "kpi_earning", 600000, "Thu nhập theo KPI — tuần 18", 42),
    e("led_08", "kpi_earning", 640000, "Thu nhập theo KPI — tuần 19", 35),
    e("led_09", "bonus", 250000, "Thưởng chất lượng code được mentor nhắc tên", 28),
    e("led_10", "kpi_earning", 680000, "Thu nhập theo KPI — tuần 20", 21),
    e("led_11", "kpi_earning", 720000, "Thu nhập theo KPI — tuần 21", 14),
    e("led_12", "kpi_earning", 660000, "Thu nhập theo KPI — tuần 22", 7),
    e("led_13", "adjustment", 730000, "Điều chỉnh thu nhập kỳ hiện tại theo KPI Q2 (81.9)", 2),
  ];
}

export function seedCertificates(): Certificate[] {
  return [
    {
      id: "crt_01",
      userId: "usr_an",
      certificateNumber: "CERT-2025-0142",
      status: "issued",
      issuedAt: daysAgo(3),
      projectName: "Sàn TMĐT EduMart",
      sessionName: "Thực tập Xuân 2025",
      completedAt: daysAgo(5),
      policyCode: "CERT-SILVER",
      verificationCode: "VIT-2025-0142",
      revokedAt: null,
      revokeReason: null,
    },
    {
      id: "crt_02",
      userId: "usr_thao",
      certificateNumber: "CERT-2024-0087",
      status: "revoked",
      issuedAt: daysAgo(200),
      projectName: "Cổng thông tin sự kiện sinh viên",
      sessionName: "Thực tập Thu 2024",
      completedAt: daysAgo(205),
      policyCode: "CERT-BRONZE",
      verificationCode: "VIT-2024-0087",
      revokedAt: daysAgo(30),
      revokeReason: "Xác minh danh tính người nhận không thành công.",
    },
  ];
}

export function seedRecommendations(): RecommendationSet[] {
  return [
    {
      id: "rec_an_01",
      userId: "usr_an",
      createdAt: daysAgo(4),
      summary: "Dựa trên 14 nhiệm vụ, 7 bài nộp và KPI Q2 (81.9), AI đề xuất 4 hành động ưu tiên cho 4 tuần tới.",
      recommendations: [
        {
          type: "skill",
          priority: "high",
          title: "Nâng cấp kỹ năng testing với React Testing Library",
          reason: "Điểm rubric 'testing' trung bình 68/100 — hạng mục thấp nhất trong các bài nộp của bạn.",
          actions: ["Viết test cho 2 component đang thiếu (Cart, Checkout Step1)", "Áp dụng testing vào 3 task Sprint 3", "Đọc tài liệu RTL 2 buổi/tuần và áp dụng ngay"],
          evidenceMetricCodes: ["CODE_QUALITY"],
        },
        {
          type: "process",
          priority: "medium",
          title: "Chủ động báo cáo rủi ro deadline sớm hơn",
          reason: "Sprint 2 có 1 task trễ hạn và 1 task phải rework — báo cáo sớm giúp mentor can thiệp kịp.",
          actions: ["Cập nhật tiến độ task mỗi cuối ngày", "Khi thấy rủi ro trễ, thông báo mentor trước 3 ngày", "Chia nhỏ task > 8h thành checklist con"],
          evidenceMetricCodes: ["TASK_COMPLETION", "ON_TIME_DELIVERY"],
        },
        {
          type: "skill",
          priority: "medium",
          title: "Học sâu Next.js App Router (caching & server components)",
          reason: "Bạn đã nắm cơ bản Next.js — bước tiến tiếp theo là tối ưu rendering và caching đúng cách.",
          actions: ["Làm 1 mini lab về ISR cho trang danh mục", "Refactor 1 trang sang server component", "Ghi chú ADR cho các quyết định caching"],
          evidenceMetricCodes: ["TECH_FOUNDATION"],
        },
        {
          type: "career",
          priority: "low",
          title: "Chuẩn bị portfolio cá nhân từ EduMart",
          reason: "Kỳ thực tập đang cho kết quả tốt — đây là thời điểm gom thành sản phẩm portfolio để xin việc.",
          actions: ["Viết README dự án theo cấu trúc nổi bật", "Trích 3 khó điểm kỹ thuật đã giải quyết thành case study", "Deploy bản demo công khai"],
          evidenceMetricCodes: ["GROWTH"],
        },
      ],
    },
  ];
}

/* --------------------------- MENTOR CONVERSATIONS --------------------------- */

export function seedMentor(): { conversations: MentorConversation[]; messages: MentorMessage[] } {
  const conversations: MentorConversation[] = [];
  const messages: MentorMessage[] = [];
  const addConv = (
    id: string,
    userId: string,
    title: string,
    status: MentorConversation["status"],
    createdDays: number,
    lastDays: number,
    msgs: ["user" | "assistant", string, number][]
  ): void => {
    conversations.push({
      id,
      userId,
      title,
      createdAt: daysAgo(createdDays),
      lastMessageAt: daysAgo(lastDays),
      messageCount: msgs.length,
      status,
    });
    for (const [role, content, d] of msgs) {
      messages.push({ id: randomId("mmsg"), conversationId: id, role, content, at: daysAgo(d), taskId: null });
    }
  };

  addConv("cnv_an_01", "usr_an", "Tối ưu render danh sách sản phẩm", "active", 5, 5, [
    ["user", "Mentor ơi, trang danh mục sản phẩm của em render 500 item là giật. Em nên bắt đầu từ đâu ạ?", 5],
    ["assistant", "Em làm theo thứ tự này nhé: 1) Dùng React DevTools Profiler xác nhận vấn đề trước; 2) Memo hóa ProductCard bằng React.memo vì item chỉ đổi khi props đổi; 3) Đảm bảo key là product.id thay vì index; 4) Nếu vẫn chậm, virtualize danh sách bằng react-window. Ví dụ: const MemoCard = React.memo(ProductCard). Đo lại sau từng bước.", 5],
    ["user", "Em làm theo rồi, re-render giảm rõ. Giờ em muốn cache dữ liệu danh mục thì dùng gì ạ?", 5],
    ["assistant", "Với dữ liệu ít đổi như danh mục: nếu là server rendering, dùng ISR của Next.js để cache ở CDN; nếu cần state client (ví dụ thêm filter), TanStack Query với staleTime 5 phút là hợp lý. Ưu tiên ISR cho nội dung tĩnh nhé.", 5],
  ]);

  addConv("cnv_an_02", "usr_an", "Hỏi về Zustand store giỏ hàng", "active", 3, 3, [
    ["user", "Em đang tách cart store bằng Zustand. Tổng tiền nên tính ở selector hay lưu sẵn trong store ạ?", 3],
    ["assistant", "Nguyên tắc: store giữ dữ liệu gốc (items), giá trị dẫn xuất như tổng tiền dùng selector. Ví dụ: const total = useCartStore(s => s.items.reduce((t, i) => t + i.price * i.qty, 0)). Nếu selector trả object thì dùng useShallow để tránh re-render không cần thiết.", 3],
    ["user", "Nếu em lưu total luôn trong store thì sai chỗ nào ạ?", 3],
    ["assistant", "Sẽ dễ lệch: đổi items mà quên cập nhật total là sai số liệu — nguồn sự thật bị nhân đôi. Chỉ nên lưu sẵn khi phép tính quá đắt (danh sách cực lớn), và khi đó phải update atom trong cùng 1 action. Còn lại luôn ưu tiên derive.", 3],
  ]);

  addConv("cnv_an_03", "usr_an", "Lỗi hydrate khi dùng SSR", "active", 2, 2, [
    ["user", "Mentor ơi, em bị lỗi \"Hydration failed\" ở trang chi tiết sản phẩm lúc chạy production, local thì bình thường.", 2],
    ["assistant", "Thường do HTML render server khác client: dùng toLocaleDateString (phụ thuộc timezone), Math.random(), hoặc đọc window ngay lúc render. Em tìm chỗ nào render ngày tháng và thay bằng định dạng cố định, ví dụ date-fns format(date, 'dd/MM/yyyy') — kết quả giống nhau mọi môi trường.", 2],
    ["user", "Đúng rồi, em đang dùng toLocaleDateString('vi-VN') ạ.", 2],
    ["assistant", "Chính nó — server thường UTC còn client theo múi giờ người dùng. Sau khi sửa, build production và test lại trên device thật nhé.", 2],
  ]);

  addConv("cnv_an_04", "usr_an", "Định hướng nghề frontend sau thực tập", "archived", 10, 10, [
    ["user", "Sau kỳ thực tập em muốn đi sâu vào frontend. Em nên học gì tiếp theo ạ?", 10],
    ["assistant", "Lộ trình gợi ý: 1) Vững gốc JS — event loop, closure, prototype; 2) Next.js App Router sâu: caching, server components, streaming; 3) Testing — Vitest + Playwright; 4) Đọc source 1-2 thư viện nhỏ để học pattern. Quan trọng nhất: gom EduMart thành portfolio cá nhân có demo trực tuyến và case study 3 khó điểm kỹ thuật.", 10],
  ]);

  addConv("cnv_binh_01", "usr_binh", "Chuẩn bị phỏng vấn đầu vào", "active", 1, 1, [
    ["user", "Em sắp phỏng vấn AI đầu vào. Em nên chuẩn bị gì ạ?", 1],
    ["assistant", "Chào Bình! Em nên: 1) Ôn lại khái niệm cơ bản của vai trò mình chọn (frontend/backend/...); 2) Tập trả lời theo cấu trúc — định nghĩa, ví dụ, đánh đổi; 3) Chuẩn bị 1-2 dự án đã làm để nói về; 4) Đọc câu hỏi mẫu trong ngân hàng câu hỏi của hệ thống. Trả lời tự nhiên, đủ ý là được — không cần hoàn hảo!", 1],
  ]);

  return { conversations, messages };
}
