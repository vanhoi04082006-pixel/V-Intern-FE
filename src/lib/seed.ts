import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

/**
 * Seed dữ liệu demo cho V-Intern — chạy tự động (idempotent) khi API được gọi.
 * gồm: 3 tài khoản demo (intern / instructor / admin), 4 sprint, ~16 nhiệm vụ.
 */

const DEMO_PASSWORD = "123456";

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(17, 0, 0, 0);
  return d;
}

let seedPromise: Promise<void> | null = null;

export function ensureSeeded(): Promise<void> {
  if (!seedPromise) {
    seedPromise = runSeed().catch((err) => {
      seedPromise = null; // cho phép thử lại nếu fail
      throw err;
    });
  }
  return seedPromise;
}

async function runSeed(): Promise<void> {
  const existing = await db.user.count();
  if (existing > 0) return;

  const passwordHash = hashPassword(DEMO_PASSWORD);

  const [intern, mentor, , linh, nam, mai] = await Promise.all([
    db.user.create({
      data: {
        email: "intern@v-intern.vn",
        passwordHash,
        name: "Minh Anh",
        role: "intern",
        university: "Đại học Bách Khoa Hà Nội",
        major: "Khoa học máy tính",
        bio: "Sinh viên năm 3, mê frontend và trà đào.",
      },
    }),
    db.user.create({
      data: {
        email: "instructor@v-intern.vn",
        passwordHash,
        name: "ThS. Nguyễn Văn Hùng",
        role: "instructor",
        university: "Đại học Bách Khoa Hà Nội",
        major: "Kỹ thuật phần mềm",
        bio: "Giảng viên kiêm người hướng dẫn thực tập tại V-Intern.",
      },
    }),
    db.user.create({
      data: {
        email: "admin@v-intern.vn",
        passwordHash,
        name: "Ban quản trị",
        role: "admin",
        university: "V-Intern",
        major: "Vận hành nền tảng",
        bio: "Quản trị hệ thống V-Intern.",
      },
    }),
    db.user.create({
      data: {
        email: "linh.tt@student.edu.vn",
        passwordHash,
        name: "Trần Thu Linh",
        role: "intern",
        university: "Đại học Bách Khoa Hà Nội",
        major: "Khoa học máy tính",
        bio: "Yêu thích UI/UX và vẽ doodle.",
      },
    }),
    db.user.create({
      data: {
        email: "nam.nn@student.edu.vn",
        passwordHash,
        name: "Nguyễn Nam",
        role: "intern",
        university: "Đại học Khoa học Tự nhiên",
        major: "Kỹ thuật phần mềm",
        bio: "Backend & database enthusiast.",
      },
    }),
    db.user.create({
      data: {
        email: "mai.pt@student.edu.vn",
        passwordHash,
        name: "Phạm Mai",
        role: "intern",
        university: "Đại học Giao thông Vận tải",
        major: "Hệ thống thông tin",
        bio: "Đang học cách viết code sạch hơn mỗi ngày.",
      },
    }),
  ]);
  void mentor; // giảng viên demo — dùng cho các relation sau này

  const [sprint1, sprint2, sprint3, sprint4] = await Promise.all([
    db.sprint.create({
      data: {
        name: "Sprint 1 — Làm quen & Onboarding",
        goal: "Thiết lập không gian làm việc, hiểu quy trình và hoàn thành nhiệm vụ khởi động",
        startDate: daysFromNow(-42),
        endDate: daysFromNow(-28),
        status: "done",
        order: 1,
      },
    }),
    db.sprint.create({
      data: {
        name: "Sprint 2 — Xây nền móng",
        goal: "Hoàn thành giao diện cốt lõi và chuẩn hoá component",
        startDate: daysFromNow(-27),
        endDate: daysFromNow(-13),
        status: "done",
        order: 2,
      },
    }),
    db.sprint.create({
      data: {
        name: "Sprint 3 — Nâng cấp trải nghiệm",
        goal: "Tích hợp AI Mentor, tối ưu hiệu năng và hoàn thiện luồng nhiệm vụ",
        startDate: daysFromNow(-6),
        endDate: daysFromNow(8),
        status: "active",
        order: 3,
      },
    }),
    db.sprint.create({
      data: {
        name: "Sprint 4 — Nghiệm thu & Bàn giao",
        goal: "Kiểm thử cuối, viết tài liệu và chuẩn bị demo sản phẩm",
        startDate: daysFromNow(9),
        endDate: daysFromNow(23),
        status: "upcoming",
        order: 4,
      },
    }),
  ]);
  void sprint4;

  type SeedTask = {
    title: string;
    description: string;
    status: string;
    priority: string;
    point: number;
    dueOff?: number;
    order: number;
    sprintId: string;
    assigneeId?: string;
  };

  const tasks: SeedTask[] = [
    // ---- Sprint 3 (đang chạy) — của Minh Anh ----
    {
      title: "Thiết kế màn hình Dashboard intern",
      description:
        "Dựng layout dashboard: thẻ chào, thống kê nhanh, danh sách nhiệm vụ gần hạn và tiến độ sprint. Dùng token màu hiện có của hệ thống.",
      status: "in_progress",
      priority: "high",
      point: 5,
      dueOff: 2,
      order: 1,
      sprintId: sprint3.id,
      assigneeId: intern.id,
    },
    {
      title: "Viết API lấy dữ liệu workspace",
      description:
        "Endpoint trả về nhiệm vụ, sprint và thống kê cho người dùng hiện tại. Có phân quyền theo role.",
      status: "review",
      priority: "high",
      point: 8,
      dueOff: 1,
      order: 2,
      sprintId: sprint3.id,
      assigneeId: intern.id,
    },
    {
      title: "Tích hợp AI Mentor vào sidebar",
      description:
        "Đặt nút mở trợ lý AI trong thanh bên, giữ lịch sử hội thoại theo người dùng.",
      status: "todo",
      priority: "medium",
      point: 5,
      dueOff: 5,
      order: 3,
      sprintId: sprint3.id,
      assigneeId: intern.id,
    },
    {
      title: "Sửa lỗi nhảy layout ở Safari",
      description:
        "Thanh cuộn đôi khiến bảng nhiệm vụ bị giật khi mở dialog. Kiểm tra scrollbar-gutter.",
      status: "todo",
      priority: "low",
      point: 2,
      dueOff: 7,
      order: 4,
      sprintId: sprint3.id,
      assigneeId: intern.id,
    },
    {
      title: "Viết unit test cho component Badge",
      description: "Phủ các trạng thái: default / success / warning / danger.",
      status: "done",
      priority: "medium",
      point: 3,
      dueOff: -2,
      order: 5,
      sprintId: sprint3.id,
      assigneeId: intern.id,
    },
    {
      title: "Refactor store Zustand",
      description:
        "Tách slice auth và slice workspace, thêm middleware persist cho session.",
      status: "in_progress",
      priority: "medium",
      point: 5,
      dueOff: 4,
      order: 6,
      sprintId: sprint3.id,
      assigneeId: intern.id,
    },
    // ---- Sprint 3 — các bạn khác ----
    {
      title: "Bộ icon minh hoạ chủ đề",
      description: "Vẽ 12 doodle SVG dùng chung cho landing và workspace.",
      status: "in_progress",
      priority: "medium",
      point: 3,
      dueOff: 3,
      order: 7,
      sprintId: sprint3.id,
      assigneeId: linh.id,
    },
    {
      title: " Chuẩn hoá API lỗi 401",
      description: "Trả về structure thống nhất { code, message } và toast thân thiện.",
      status: "todo",
      priority: "high",
      point: 5,
      dueOff: 6,
      order: 8,
      sprintId: sprint3.id,
      assigneeId: nam.id,
    },
    {
      title: "Tối ưu truy vấn Prisma",
      description: "Gộp query nhiệm vụ + người được gán, giảm N+1.",
      status: "done",
      priority: "high",
      point: 8,
      dueOff: -1,
      order: 9,
      sprintId: sprint3.id,
      assigneeId: nam.id,
    },
    {
      title: "Soạn nội dung email chào mừng",
      description: "Email onboarding sinh viên mới, giọng thân thiện gần gũi.",
      status: "review",
      priority: "low",
      point: 2,
      dueOff: 2,
      order: 10,
      sprintId: sprint3.id,
      assigneeId: mai.id,
    },
    // ---- Sprint 2 (đã xong) ----
    {
      title: "Xây component Primitives",
      description: "Button, Input, Card, Dialog theo design system Sổ tay hành trình.",
      status: "done",
      priority: "high",
      point: 8,
      dueOff: -15,
      order: 11,
      sprintId: sprint2.id,
      assigneeId: intern.id,
    },
    {
      title: "Bảng màu 3 màu chủ đạo",
      description: "Xanh dương — trắng — đen, kèm dark mode bảng đen phấn.",
      status: "done",
      priority: "high",
      point: 5,
      dueOff: -20,
      order: 12,
      sprintId: sprint2.id,
      assigneeId: linh.id,
    },
    {
      title: "Trang landing hero",
      description: "Polaroid workspace, băng dính, mascot robot.",
      status: "done",
      priority: "medium",
      point: 8,
      dueOff: -17,
      order: 13,
      sprintId: sprint2.id,
      assigneeId: intern.id,
    },
    // ---- Sprint 1 (đã xong) ----
    {
      title: "Onboarding tuần đầu",
      description: "Đọc tài liệu, cài môi trường, chào hỏi team.",
      status: "done",
      priority: "medium",
      point: 3,
      dueOff: -35,
      order: 14,
      sprintId: sprint1.id,
      assigneeId: intern.id,
    },
    {
      title: "Phỏng vấn AI định hướng",
      description:
        "Hoàn thành buổi phỏng vấn với AI để chọn lộ trình Frontend / Backend / Fullstack.",
      status: "done",
      priority: "high",
      point: 5,
      dueOff: -33,
      order: 15,
      sprintId: sprint1.id,
      assigneeId: intern.id,
    },
  ];

  await db.task.createMany({
    data: tasks.map(({ dueOff, ...t }) => ({
      ...t,
      dueDate: dueOff === undefined ? null : daysFromNow(dueOff),
    })),
  });

  // Lời chào mẫu trong AI Mentor của intern
  await db.chatMessage.create({
    data: {
      userId: intern.id,
      role: "assistant",
      content:
        "Chào Minh Anh! Mình là AI Mentor của V-Intern 🤖\n\nMình thấy bạn đang có nhiệm vụ **\"Thiết kế màn hình Dashboard intern\"** hạn chót ngày 2 nữa. Cần mình gợi ý cách chia nhỏ việc, review kế hoạch sprint, hay đơn giản là cần một lời động viên? Cứ nhắn nhé!",
    },
  });
}
