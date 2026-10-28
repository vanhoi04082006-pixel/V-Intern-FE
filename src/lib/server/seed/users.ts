import type {
  Assignment,
  InterviewMessage,
  InterviewQuestion,
  InterviewResult,
  InterviewSession,
  RecruitmentProfile,
  User,
} from "../types";
import { daysAgo, randomId } from "../util";

const COLORS = ["#10B981", "#FBBF24", "#2DD4BF", "#FB7185", "#FB923C", "#A3E635"];

interface UserSeed {
  id: string;
  name: string;
  email: string;
  role: User["role"];
  status?: User["status"];
  color?: string;
  joinedDaysAgo: number;
  studentId?: string;
  university?: string;
}

const USER_SEEDS: UserSeed[] = [
  { id: "usr_an", name: "An Nguyễn", email: "an.nguyen@student.edu.vn", role: "intern", joinedDaysAgo: 240, studentId: "SV2021001", university: "Đại học Bách khoa Hà Nội" },
  { id: "usr_minhha", name: "Minh Hà Trần", email: "minh.ha@student.edu.vn", role: "intern", color: "#FB923C", joinedDaysAgo: 95, studentId: "SV2022003", university: "Đại học Bách khoa Đà Nẵng" },
  { id: "usr_lam", name: "Lam Phạm", email: "lam.pham@student.edu.vn", role: "intern", color: "#A3E635", joinedDaysAgo: 92, studentId: "SV2022011", university: "Đại học Thủy lợi" },
  { id: "usr_khanh", name: "Khánh Đoàn", email: "khanh.doan@student.edu.vn", role: "intern", color: "#2DD4BF", joinedDaysAgo: 90, studentId: "SV2022022", university: "Đại học Giao thông vận tải" },
  { id: "usr_thao", name: "Thảo Nguyễn", email: "thao.nguyen@student.edu.vn", role: "intern", color: "#FBBF24", joinedDaysAgo: 60, studentId: "SV2023004", university: "Đại học Mở Hà Nội" },
  { id: "usr_binh", name: "Bình Trần", email: "binh.tran@student.edu.vn", role: "intern", joinedDaysAgo: 30, studentId: "SV2023012", university: "Đại học Công nghệ — ĐHQG TP.HCM" },
  { id: "usr_chi", name: "Chi Phạm", email: "chi.pham@student.edu.vn", role: "intern", joinedDaysAgo: 55, studentId: "SV2022018", university: "Đại học Khoa học tự nhiên TP.HCM" },
  { id: "usr_dung", name: "Dũng Võ", email: "dung.vo@student.edu.vn", role: "intern", joinedDaysAgo: 120, studentId: "SV2021009", university: "Đại học FPT" },
  { id: "usr_quang", name: "Quang Lê", email: "quang.le@student.edu.vn", role: "intern", joinedDaysAgo: 40, studentId: "SV2022016", university: "Đại học Tôn Đức Thắng" },
  { id: "usr_trang", name: "Trang Vũ", email: "trang.vu@student.edu.vn", role: "intern", joinedDaysAgo: 35, studentId: "SV2023019", university: "Học viện Công nghệ Bưu chính Viễn thông" },
  { id: "usr_hung", name: "Hùng Phạm", email: "hung.pham@student.edu.vn", role: "intern", status: "pending", joinedDaysAgo: 10, studentId: "SV2023011", university: "Đại học Kiến trúc Hà Nội" },
  { id: "usr_mai", name: "Mai Đinh", email: "mai.dinh@student.edu.vn", role: "intern", status: "locked", joinedDaysAgo: 365, studentId: "SV2021024", university: "Đại học Hà Nội" },
  { id: "usr_hong", name: "Hồng Lê", email: "hong.le@gv.edu.vn", role: "instructor", joinedDaysAgo: 720 },
  { id: "usr_ngoc", name: "Ngọc Trần", email: "ngoc.tran@gv.edu.vn", role: "instructor", color: "#2DD4BF", joinedDaysAgo: 540 },
  { id: "usr_admin", name: "Quản trị Viên", email: "admin@vintern.edu.vn", role: "admin", color: "#FBBF24", joinedDaysAgo: 800 },
];

export function seedUsers(): User[] {
  return USER_SEEDS.map((s, i) => ({
    id: s.id,
    email: s.email,
    password: "demo1234",
    displayName: s.name,
    role: s.role,
    status: s.status ?? "active",
    avatarColor: s.color ?? COLORS[i % COLORS.length],
    joinedAt: daysAgo(s.joinedDaysAgo),
    lastLoginAt: daysAgo(1 + (i % 3)),
    studentId: s.studentId ?? null,
    university: s.university ?? null,
  }));
}

export function seedRecruitment(): Record<string, RecruitmentProfile> {
  const mk = (
    userId: string,
    status: RecruitmentProfile["status"],
    role: string | null,
    attemptCount: number,
    recruitedDaysAgo?: number | null,
    eligibleDaysAgo?: number | null
  ): RecruitmentProfile => ({
    userId,
    status,
    selectedRole: role,
    attemptCount,
    maxAttempts: 3,
    recruitedAt: recruitedDaysAgo != null ? daysAgo(recruitedDaysAgo) : null,
    nextEligibleAt: eligibleDaysAgo != null ? daysAgo(eligibleDaysAgo) : null,
  });
  return {
    usr_an: mk("usr_an", "passed", "frontend", 1, 44),
    usr_minhha: mk("usr_minhha", "passed", "backend", 1, 43),
    usr_lam: mk("usr_lam", "passed", "fullstack", 1, 43),
    usr_khanh: mk("usr_khanh", "passed", "qa", 1, 42),
    usr_thao: mk("usr_thao", "passed", "backend", 1, 42),
    usr_chi: mk("usr_chi", "passed", "frontend", 1, 20),
    usr_quang: mk("usr_quang", "passed", "backend", 1, 15),
    usr_trang: mk("usr_trang", "passed", "qa", 1, 12),
    usr_dung: mk("usr_dung", "failed", "backend", 2, null, 2),
    usr_binh: mk("usr_binh", "not_started", null, 0),
    usr_hung: mk("usr_hung", "not_started", null, 0),
    usr_mai: mk("usr_mai", "not_started", null, 0),
  };
}

export function seedAssignments(): Assignment[] {
  const mk = (id: string, internId: string, internName: string, role: string, daysAgoVal: number): Assignment => ({
    id,
    internId,
    internName,
    role,
    projectId: "prj_edu",
    sessionId: "ses_2025_01",
    status: "active",
    assignedAt: daysAgo(daysAgoVal),
  });
  return [
    mk("asg_an", "usr_an", "An Nguyễn", "frontend", 42),
    mk("asg_minhha", "usr_minhha", "Minh Hà Trần", "backend", 42),
    mk("asg_lam", "usr_lam", "Lam Phạm", "fullstack", 41),
    mk("asg_khanh", "usr_khanh", "Khánh Đoàn", "qa", 41),
    mk("asg_thao", "usr_thao", "Thảo Nguyễn", "backend", 40),
  ];
}

/* ---------- Phiên phỏng vấn AI đã hoàn tất (seed lịch sử) ---------- */

interface QSeed {
  phase: InterviewQuestion["phase"];
  prompt: string;
  concepts: string[];
  answer: string;
  score: number;
}

function buildQuestions(role: string, qseeds: QSeed[]): InterviewQuestion[] {
  void role;
  return qseeds.map((q, i) => ({
    id: randomId("qst"),
    position: i + 1,
    phase: q.phase,
    kind: "main" as const,
    prompt: q.prompt,
    expectedConcepts: q.concepts,
    answer: q.answer,
    status: "answered" as const,
    score: q.score,
  }));
}

function buildMessages(questions: InterviewQuestion[], startedAt: string): InterviewMessage[] {
  const messages: InterviewMessage[] = [
    { id: randomId("msg"), role: "ai", content: "Chào bạn, mình là AI phỏng vấn của V-Intern. Chúng ta sẽ cùng đi qua vài câu hỏi nhé!", at: startedAt },
  ];
  for (const q of questions) {
    messages.push({ id: randomId("msg"), role: "ai", content: q.prompt, at: startedAt });
    messages.push({ id: randomId("msg"), role: "user", content: q.answer ?? "", at: startedAt });
  }
  return messages;
}

function buildResult(
  sessionId: string,
  role: string,
  scores: { tech: number; soft: number; english: number },
  strengths: string[],
  weaknesses: string[],
  feedback: string
): InterviewResult {
  const overall = Math.round(0.5 * scores.tech + 0.3 * scores.soft + 0.2 * scores.english);
  return {
    id: randomId("res"),
    sessionId,
    roleCode: role,
    decision: overall >= 60 ? "passed" : "failed",
    technicalScore: scores.tech,
    softSkillScore: scores.soft,
    englishScore: scores.english,
    overallScore: overall,
    criteria: [
      { code: "TECH_FOUNDATION", label: "Nền tảng kỹ thuật", score: scores.tech, feedback: scores.tech >= 60 ? "Trình bày khái niệm cốt lõi tương đối chắc chắn, có ví dụ cụ thể." : "Khái niệm cốt lõi còn mơ hồ, cần hệ thống lại kiến thức nền." },
      { code: "PROBLEM_SOLVING", label: "Tư duy giải quyết vấn đề", score: Math.round((scores.tech + scores.soft) / 2), feedback: "Có bước phân tích vấn đề nhưng đôi lúc thiếu cấu trúc." },
      { code: "COMMUNICATION", label: "Giao tiếp & trình bày", score: scores.soft, feedback: scores.soft >= 60 ? "Diễn đạt rõ ràng, biết tóm tắt ý chính." : "Cần luyện tập trình bày mạch lạc hơn, trả lời đúng trọng tâm." },
      { code: "ENGLISH", label: "Tiếng Anh kỹ thuật", score: scores.english, feedback: scores.english >= 60 ? "Đọc hiểu tài liệu tiếng Anh ổn, từ vựng chuyên ngành khá." : "Từ vựng chuyên ngành còn hạn chế, nên đọc tài liệu gốc nhiều hơn." },
      { code: "LEARNING_ATTITUDE", label: "Thái độ học hỏi", score: Math.min(100, scores.soft + 8), feedback: "Thể hiện mong muốn học hỏi và nhận phản hồi tốt." },
    ],
    strengths,
    weaknesses,
    feedback,
    recommendedRole: role,
    evaluatedAt: daysAgo(0),
  };
}

export function seedInterviews(): InterviewSession[] {
  const sessions: InterviewSession[] = [];

  const mk = (
    userId: string,
    role: string,
    attempt: number,
    startedDaysAgo: number,
    qseeds: QSeed[],
    scores: { tech: number; soft: number; english: number },
    strengths: string[],
    weaknesses: string[],
    feedback: string
  ): InterviewSession => {
    const startedAt = daysAgo(startedDaysAgo, 1);
    const questions = buildQuestions(role, qseeds);
    const session: InterviewSession = {
      id: `itv_${userId.replace("usr_", "")}_${attempt}`,
      userId,
      roleCode: role,
      status: "completed",
      startedAt,
      submittedAt: daysAgo(startedDaysAgo),
      expiresAt: daysAgo(startedDaysAgo),
      attemptNumber: attempt,
      currentIndex: questions.length,
      questions,
      messages: buildMessages(questions, startedAt),
      evaluatingSince: null,
      result: null,
      jitter: 0,
    };
    const result = buildResult(session.id, role, scores, strengths, weaknesses, feedback);
    result.evaluatedAt = daysAgo(startedDaysAgo);
    session.result = result;
    return session;
  };

  // An — passed (77 điểm, khớp ví dụ trong hợp đồng API)
  sessions.push(
    mk(
      "usr_an",
      "frontend",
      1,
      46,
      [
        { phase: "introduction", prompt: "Hãy giới thiệu ngắn gọn về bản thân và lý do bạn chọn vai trò frontend?", concepts: ["mục tiêu", "dự án", "học", "lập trình"], answer: "Em là sinh viên năm 4, đã làm 2 dự án React nhỏ ở trường. Em chọn frontend vì thích xây dựng giao diện và mục tiêu của em là trở thành frontend developer.", score: 82 },
        { phase: "technical", prompt: "Giải thích sự khác biệt giữa state và props trong React?", concepts: ["component", "render", "tái sử dụng", "hook"], answer: "Props là dữ liệu truyền từ cha vào component để tái sử dụng, còn state là dữ liệu nội bộ có thể thay đổi và làm component render lại. Em thường dùng hook useState để quản lý state.", score: 78 },
        { phase: "technical", prompt: "Virtual DOM hoạt động thế nào và vì sao giúp tăng hiệu năng?", concepts: ["virtual dom", "diff", "re-render", "hiệu năng"], answer: "Virtual DOM là bản mô phỏng cây DOM thật. Khi state đổi, React diff cây cũ và mới rồi chỉ cập nhật phần thay đổi trên DOM thật, nhờ vậy giảm re-render và tăng hiệu năng.", score: 80 },
        { phase: "technical", prompt: "Bạn tối ưu danh sách sản phẩm 1000 items thế nào?", concepts: ["memo", "pagination", "virtualize", "key"], answer: "Em sẽ dùng react-window để virtualize, kết hợp useMemo cache dữ liệu, dùng key ổn định và phân trang từ API thay vì render hết 1000 items.", score: 74 },
        { phase: "english", prompt: "Please describe a challenging bug you have fixed. What was the root cause?", concepts: ["bug", "root cause", "fixed", "solution"], answer: "I fixed a hydration bug in SSR. The root cause was a date format difference between server and client. My solution was to render the date only on the client side, and it fixed the issue.", score: 70 },
        { phase: "communication", prompt: "Bạn và teammate bất đồng về cách tổ chức component, bạn xử lý thế nào?", concepts: ["lắng nghe", "thống nhất", "tôn trọng", "lý lẽ"], answer: "Em sẽ lắng nghe lý lẽ của bạn ấy trước, trình bày trade-off của từng cách, cùng thử prototype nhỏ và thống nhất theo kết quả đo được, tôn trọng ý kiến lẫn nhau.", score: 84 },
        { phase: "communication", prompt: "Kế hoạch học tập của bạn trong kỳ thực tập này?", concepts: ["kế hoạch", "học", "mục tiêu", "đo lường"], answer: "Em đặt kế hoạch học Next.js nâng cao, viết test cho component, mỗi tuần tự đánh giá tiến độ theo mục tiêu SMART và xin mentor feedback đều đặn.", score: 82 },
      ],
      { tech: 76, soft: 82, english: 70 },
      ["Nền tảng React khá chắc", "Giao tiếp tự tin, có cấu trúc", "Chủ động đặt kế hoạch học tập"],
      ["Kinh nghiệm tối ưu hiệu năng còn hạn chế", "Từ vựng tiếng Anh chuyên ngành vừa đủ"],
      "Ứng viên thể hiện nền tảng frontend tốt, tư duy rõ ràng và thái độ cầu tiến. Đạt chuẩn đầu vào vai trò Frontend Intern."
    )
  );

  // Chi — passed 76
  sessions.push(
    mk(
      "usr_chi",
      "frontend",
      1,
      21,
      [
        { phase: "introduction", prompt: "Hãy giới thiệu ngắn gọn về bản thân và lý do bạn chọn vai trò frontend?", concepts: ["mục tiêu", "dự án", "học", "lập trình"], answer: "Em là Chi, sinh viên năm 3. Em đã tự học HTML/CSS/JS và làm vài dự án landing page. Mục tiêu của em là làm thực tập frontend để học React chuyên sâu.", score: 78 },
        { phase: "technical", prompt: "Giải thích sự khác biệt giữa state và props trong React?", concepts: ["component", "render", "tái sử dụng", "hook"], answer: "Props là đầu vào truyền từ component cha giúp tái sử dụng, state là dữ liệu nội bộ quản lý bằng hook, khi đổi sẽ render lại component.", score: 72 },
        { phase: "technical", prompt: "CSS Flexbox khác Grid chỗ nào, khi nào dùng cái nào?", concepts: ["flexbox", "grid", "layout", "responsive"], answer: "Flexbox cho layout một chiều như navbar, Grid cho layout hai chiều như trang danh mục. Em kết hợp cả hai để làm responsive.", score: 75 },
        { phase: "technical", prompt: "Bạn xử lý form validation thế nào để trải nghiệm người dùng tốt?", concepts: ["kiểm tra", "trạng thái lỗi", "thông báo", "trải nghiệm người dùng"], answer: "Em validate ngay khi blur, hiện thông báo lỗi gần trường nhập, disable nút submit khi form lỗi, và tóm tắt lỗi ở đầu form cho người dùng.", score: 71 },
        { phase: "english", prompt: "Describe a project you are proud of and your contribution.", concepts: ["project", "contribution", "learned", "built"], answer: "I built a landing page for a student club. My contribution was the responsive layout and an animation section. I learned a lot about CSS and accessibility.", score: 75 },
        { phase: "communication", prompt: "Nếu bị review code nặng lời, bạn phản ứng thế nào?", concepts: ["lắng nghe", "tôn trọng", "học", "cải thiện"], answer: "Em xem đó là cơ hội học, lắng nghe góp ý, hỏi rõ chỗ chưa hiểu và cải thiện dần. Tôn trọng người review dù lời thẳng.", score: 82 },
      ],
      { tech: 74, soft: 80, english: 75 },
      ["UI/UX nhạy bén", "Thái độ cầu thị", "Nền CSS tốt"],
      ["Chưa có kinh nghiệm dự án lớn", "React còn ở mức cơ bản"],
      "Ứng viên có nền tảng frontend ổn định và tinh thần học hỏi cao. Đạt chuẩn vai trò Frontend Intern."
    )
  );

  // Quang — passed 69
  sessions.push(
    mk(
      "usr_quang",
      "backend",
      1,
      16,
      [
        { phase: "introduction", prompt: "Giới thiệu bản thân và lý do chọn hướng backend?", concepts: ["api", "dự án", "học", "mục tiêu"], answer: "Em là Quang, thích thiết kế hệ thống và làm việc với dữ liệu. Em đã viết API Express cho đồ án môn học và muốn theo hướng backend sau khi tốt nghiệp.", score: 74 },
        { phase: "technical", prompt: "Thiết kế REST API quản lý sản phẩm gồm những endpoint và status code nào?", concepts: ["rest", "endpoint", "method", "status code"], answer: "Em cần GET /products, GET /products/:id, POST /products (201), PUT/PATCH (200), DELETE (204), kèm 400 validate, 401, 404 và 500 khi lỗi hệ thống.", score: 72 },
        { phase: "technical", prompt: "Index trong CSDL giúp gì và khi nào phản tác dụng?", concepts: ["index", "truy vấn", "hiệu năng", "b-tree"], answer: "Index như mục lục giúp truy vấn tìm nhanh. Nhưng mỗi index tốn bộ nhớ và làm INSERT/UPDATE chậm hơn, nên chỉ đánh với cột thường lọc hoặc join.", score: 70 },
        { phase: "technical", prompt: "Transaction ACID là gì, cho ví dụ thực tế?", concepts: ["acid", "transaction", "rollback", "nhất quán"], answer: "ACID là bốn tính chất: nguyên tử, nhất quán, cô lập, bền vững. Ví dụ trừ tồn kho và tạo đơn hàng phải trong một transaction, nếu lỗi thì rollback để dữ liệu nhất quán.", score: 71 },
        { phase: "english", prompt: "Explain the difference between SQL and NoSQL databases.", concepts: ["sql", "nosql", "schema", "scale"], answer: "SQL has fixed schema and strong consistency, good for relational data. NoSQL has flexible schema and scales horizontally. I would choose based on the data model.", score: 60 },
        { phase: "communication", prompt: "Frontend nói API của bạn chậm, bạn làm gì?", concepts: ["phối hợp", "đo lường", "giao tiếp", "tối ưu"], answer: "Em sẽ đo lường thời gian từng endpoint, phối hợp với frontend xác định trường nào thật sự cần, thêm index hoặc cache rồi báo lại kết quả.", score: 68 },
      ],
      { tech: 72, soft: 68, english: 64 },
      ["Hiểu rõ cách thiết kế API", "Nghiêm túc với chất lượng dữ liệu"],
      ["Tiếng Anh cần cải thiện", "Kinh nghiệm tối ưu còn ít"],
      "Ứng viên có tư duy backend rõ ràng, đáp ứng chuẩn vai trò Backend Intern."
    )
  );

  // Trang — passed 67
  sessions.push(
    mk(
      "usr_trang",
      "qa",
      1,
      13,
      [
        { phase: "introduction", prompt: "Điều gì khiến bạn thích nghề kiểm thử phần mềm?", concepts: ["chất lượng", "kiểm thử", "đội ngũ", "mục tiêu"], answer: "Em thích tìm ra lỗi trước khi người dùng gặp, giúp sản phẩm chất lượng hơn. Em thấy QA là mắt xích quan trọng của đội ngũ và đó là mục tiêu nghề của em.", score: 76 },
        { phase: "technical", prompt: "Phân biệt kiểm thử hồi quy (regression) và kiểm thử lại (retest)?", concepts: ["hồi quy", "retest", "kịch bản", "tự động hóa"], answer: "Retest là chạy lại đúng case bị lỗi để xác nhận đã sửa, còn regression chạy lại bộ kịch bản rộng để chắc không phá chỗ khác. Em thường tự động hóa regression bằng Playwright.", score: 68 },
        { phase: "technical", prompt: "Test pyramid là gì và vì sao quan trọng?", concepts: ["unit", "integration", "e2e", "tự động hóa"], answer: "Test pyramid chia làm nhiều tầng: nhiều unit test ở đáy, ít integration test, và rất ít e2e trên đỉnh. Nhờ vậy bộ test nhanh, ổn định và dễ bảo trì.", score: 66 },
        { phase: "english", prompt: "Explain how you would write a test plan for a checkout feature.", concepts: ["test plan", "checkout", "cases", "priority"], answer: "I would list test cases for happy path and edge cases, set priority, prepare test data, and define pass criteria for the checkout flow.", score: 64 },
        { phase: "communication", prompt: "Developer nói bug bạn báo 'không phải lỗi'. Bạn làm gì?", concepts: ["bằng chứng", "giao tiếp", "tài liệu", "tôn trọng"], answer: "Em sẽ đưa bằng chứng: ảnh, log, bước tái hiện, dẫn spec yêu cầu. Nếu vẫn chưa thống nhất thì nhờ BA hoặc quản lý quyết, giữ thái độ tôn trọng.", score: 72 },
      ],
      { tech: 65, soft: 70, english: 66 },
      ["Tư duy tìm lỗi tốt", "Biết cách đưa bằng chứng thuyết phục"],
      ["Kinh nghiệm viết test tự động còn hạn chế", "Cần rèn tiếng Anh thêm"],
      "Ứng viên có tố chất QA tốt, cần rèn thêm kỹ năng automation. Đạt chuẩn vai trò QA Intern."
    )
  );

  // Dũng — 2 lần trượt
  sessions.push(
    mk(
      "usr_dung",
      "backend",
      1,
      50,
      [
        { phase: "introduction", prompt: "Giới thiệu bản thân và lý do chọn hướng backend?", concepts: ["api", "dự án", "học", "mục tiêu"], answer: "Em là Dũng, học CNTT. Em chọn backend vì thấy lương cao.", score: 38 },
        { phase: "technical", prompt: "Thiết kế REST API quản lý sản phẩm gồm những endpoint nào?", concepts: ["rest", "endpoint", "method", "status code"], answer: "Em sẽ làm một trang web hiển thị sản phẩm cho người dùng.", score: 30 },
        { phase: "technical", prompt: "SQL và NoSQL khác nhau thế nào?", concepts: ["sql", "nosql", "schema", "scale"], answer: "Không nhớ rõ ạ.", score: 22 },
        { phase: "english", prompt: "Describe your favorite programming language and why.", concepts: ["language", "why", "feature", "project"], answer: "I like Java because it is good.", score: 35 },
        { phase: "communication", prompt: "Bạn học một công nghệ mới bằng cách nào?", concepts: ["học", "tài liệu", "thực hành", "đo lường"], answer: "Em xem video trên mạng cho biết.", score: 45 },
      ],
      { tech: 42, soft: 55, english: 40 },
      ["Thái độ hoà đồng"],
      ["Nền tảng kiến thức còn yếu", "Chưa có phương pháp học", "Trả lời thiếu chuẩn bị"],
      "Ứng viên chưa đạt chuẩn đầu vào. Cần hệ thống lại kiến thức nền và luyện thêm trước khi thi lại."
    ),
    mk(
      "usr_dung",
      "backend",
      2,
      12,
      [
        { phase: "introduction", prompt: "Giới thiệu bản thân và lý do chọn hướng backend?", concepts: ["api", "dự án", "học", "mục tiêu"], answer: "Em là Dũng. Kỳ trước em trượt nên 2 tháng qua em ôn lại Node.js và PostgreSQL, làm lại đồ án API quản lý thư viện. Em muốn thử lại lần này.", score: 62 },
        { phase: "technical", prompt: "Thiết kế REST API quản lý sản phẩm gồm những endpoint và status code nào?", concepts: ["rest", "endpoint", "method", "status code"], answer: "Em làm REST endpoint: GET /api/products trả 200, POST tạo mới 201, PUT/PATCH sửa 200, DELETE 204, validate lỗi 400, không tìm thấy 404.", score: 55 },
        { phase: "technical", prompt: "Transaction ACID là gì?", concepts: ["acid", "transaction", "rollback", "nhất quán"], answer: "Em hiểu transaction gom nhiều thao tác, nếu lỗi thì rollback. Còn chi tiết 4 chữ A-C-I-D em mới nhớ Atom và Consistency.", score: 46 },
        { phase: "english", prompt: "Explain the difference between SQL and NoSQL databases.", concepts: ["sql", "nosql", "schema", "scale"], answer: "SQL is like MySQL, NoSQL is like MongoDB. SQL has table, NoSQL is more free.", score: 48 },
        { phase: "communication", prompt: "Bạn phối hợp với frontend thế nào khi API chưa xong?", concepts: ["phối hợp", "giao tiếp", "tài liệu", "mock"], answer: "Em sẽ viết tài liệu API trước, cho frontend dùng mock data để làm song song.", score: 58 },
      ],
      { tech: 48, soft: 60, english: 45 },
      ["Có tiến bộ so với lần trước", "Thái độ quyết tâm hơn"],
      ["Kiến thức nền còn rời rạc", "Tiếng Anh chưa đạt"],
      "Có tiến bộ rõ nhưng vẫn dưới chuẩn đầu vào. Được phép thi lại lần cuối theo chính sách."
    )
  );

  return sessions;
}
