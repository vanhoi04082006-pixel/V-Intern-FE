import type { Question } from "../types";

interface QSeed {
  roleCode: string;
  phase: Question["phase"];
  difficulty: Question["difficulty"];
  prompt: string;
  expectedConcepts: string[];
}

const QSEEDS: QSeed[] = [
  // ============ FRONTEND ============
  { roleCode: "frontend", phase: "introduction", difficulty: "easy", prompt: "Chào bạn, hãy giới thiệu ngắn gọn về bản thân: bạn là ai, đang học năm mấy, và vì sao bạn chọn vai trò frontend trong kỳ thực tập này?", expectedConcepts: ["mục tiêu", "học", "dự án", "lập trình"] },
  { roleCode: "frontend", phase: "technical", difficulty: "medium", prompt: "Giải thích sự khác biệt giữa state và props trong React. Khi nào một component nên có state thay vì chỉ dùng biến thường?", expectedConcepts: ["component", "render", "tái sử dụng", "hook"] },
  { roleCode: "frontend", phase: "technical", difficulty: "medium", prompt: "Virtual DOM là gì và nó giúp cải thiện hiệu năng ra sao? Trình bày quá trình re-render của React khi dữ liệu thay đổi.", expectedConcepts: ["virtual dom", "diff", "re-render", "hiệu năng"] },
  { roleCode: "frontend", phase: "technical", difficulty: "hard", prompt: "Khi xây dựng trang danh sách 1000+ sản phẩm, bạn áp dụng những kỹ thuật nào để trang vẫn mượt? Nêu ít nhất 3 cách và đánh đổi của từng cách.", expectedConcepts: ["memo", "phân trang", "virtualize", "key"] },
  { roleCode: "frontend", phase: "technical", difficulty: "medium", prompt: "Khi xây dựng form nhiều bước, bạn tổ chức validation thế nào để người dùng không bị mắc kẹt ở một bước?", expectedConcepts: ["kiểm tra", "trạng thái lỗi", "thông báo", "trải nghiệm người dùng"] },
  { roleCode: "frontend", phase: "english", difficulty: "medium", prompt: "Please describe a challenging bug you have fixed. What was the root cause and how did you solve it?", expectedConcepts: ["bug", "root cause", "fixed", "solution"] },
  { roleCode: "frontend", phase: "communication", difficulty: "easy", prompt: "Bạn và một bạn cùng nhóm bất đồng về cách tổ chức component. Bạn sẽ làm gì để đi đến thống nhất mà vẫn giữ tình bạn tốt?", expectedConcepts: ["lắng nghe", "lý lẽ", "thống nhất", "tôn trọng"] },

  // ============ BACKEND ============
  { roleCode: "backend", phase: "introduction", difficulty: "easy", prompt: "Hãy giới thiệu về bản thân và lý do bạn muốn theo hướng backend. Bạn đã từng xây dựng API cho dự án nào chưa?", expectedConcepts: ["api", "dự án", "học", "mục tiêu"] },
  { roleCode: "backend", phase: "technical", difficulty: "medium", prompt: "Thiết kế một REST API cho quản lý sản phẩm: bạn cần những endpoint nào, dùng HTTP method và status code như thế nào cho hợp lý?", expectedConcepts: ["rest", "endpoint", "method", "status code"] },
  { roleCode: "backend", phase: "technical", difficulty: "hard", prompt: "Index trong cơ sở dữ liệu hoạt động thế nào? Khi nào index giúp truy vấn nhanh hơn và khi nào nó phản tác dụng với hiệu năng ghi?", expectedConcepts: ["index", "truy vấn", "hiệu năng", "b-tree"] },
  { roleCode: "backend", phase: "technical", difficulty: "medium", prompt: "Giải thích tính chất ACID của transaction. Cho một ví dụ tình huống thực tế trong thương mại điện tử mà bắt buộc phải dùng transaction.", expectedConcepts: ["acid", "transaction", "rollback", "nhất quán"] },
  { roleCode: "backend", phase: "english", difficulty: "medium", prompt: "How would you explain the difference between SQL and NoSQL databases to a junior developer?", expectedConcepts: ["sql", "nosql", "schema", "scale"] },
  { roleCode: "backend", phase: "communication", difficulty: "medium", prompt: "Frontend than phiền rằng API của bạn trả dữ liệu chậm. Bạn sẽ phối hợp với họ và xử lý vấn đề này thế nào?", expectedConcepts: ["phối hợp", "đo lường", "giao tiếp", "tối ưu"] },

  // ============ FULLSTACK ============
  { roleCode: "fullstack", phase: "introduction", difficulty: "easy", prompt: "Bạn hiểu gì về vị trí fullstack? Bạn thấy mình mạnh hơn ở mảng nào và sẽ bù đắp điểm yếu còn lại thế nào?", expectedConcepts: ["frontend", "backend", "học hỏi", "mục tiêu"] },
  { roleCode: "fullstack", phase: "technical", difficulty: "medium", prompt: "Từ ý tưởng đến khi một trang web chạy được, bạn sẽ chọn công nghệ gì cho một MVP và vì sao? Giải thích từng lớp từ UI đến CSDL.", expectedConcepts: ["mvp", "công nghệ", "triển khai", "database"] },
  { roleCode: "fullstack", phase: "technical", difficulty: "hard", prompt: "Bạn thiết kế luồng đăng nhập — đăng ký với JWT cho một web app thế nào? Nơi nào nên lưu token, token hết hạn xử lý ra sao?", expectedConcepts: ["jwt", "xác thực", "refresh token", "bảo mật"] },
  { roleCode: "fullstack", phase: "english", difficulty: "medium", prompt: "Describe how you would deploy a full-stack application and what you would monitor after release.", expectedConcepts: ["deploy", "monitor", "ci", "environment"] },
  { roleCode: "fullstack", phase: "communication", difficulty: "medium", prompt: "Làm sao bạn cân bằng thời gian giữa frontend và backend khi cả hai đầu cùng cần gấp trong một sprint?", expectedConcepts: ["ưu tiên", "giao tiếp", "kế hoạch", "cân bằng"] },

  // ============ QA ============
  { roleCode: "qa", phase: "introduction", difficulty: "easy", prompt: "Điều gì khiến bạn thích nghề kiểm thử phần mềm? Bạn nghĩ QA đóng vai trò gì trong đội ngũ phát triển sản phẩm?", expectedConcepts: ["chất lượng", "kiểm thử", "đội ngũ", "mục tiêu"] },
  { roleCode: "qa", phase: "technical", difficulty: "medium", prompt: "Phân biệt kiểm thử hồi quy (regression testing) với kiểm thử lại (retest). Bạn sẽ dùng công cụ gì để tự động hóa hồi quy?", expectedConcepts: ["hồi quy", "retest", "tự động hóa", "kịch bản"] },
  { roleCode: "qa", phase: "technical", difficulty: "hard", prompt: "Test pyramid là gì? Tỷ lệ unit — integration — E2E hợp lý ra sao và vì sao không nên viết nhiều E2E?", expectedConcepts: ["unit", "integration", "e2e", "tự động hóa"] },
  { roleCode: "qa", phase: "technical", difficulty: "medium", prompt: "Bạn sẽ viết một test plan cho chức năng thanh toán online gồm những mục nào? Liệt kê ít nhất 5 hạng mục quan trọng.", expectedConcepts: ["test plan", "kịch bản", "ưu tiên", "tái hiện"] },
  { roleCode: "qa", phase: "english", difficulty: "medium", prompt: "Explain how you would report a critical bug found one day before the release date.", expectedConcepts: ["bug", "report", "priority", "evidence"] },
  { roleCode: "qa", phase: "communication", difficulty: "medium", prompt: "Developer phản đối bug bạn báo là 'không phải lỗi, là do môi trường'. Bạn sẽ xử lý tình huống này thế nào?", expectedConcepts: ["bằng chứng", "giao tiếp", "tài liệu", "tôn trọng"] },

  // ============ BUSINESS ANALYST ============
  { roleCode: "business_analyst", phase: "introduction", difficulty: "easy", prompt: "Bạn nghĩ nhà phân tích nghiệp vụ (BA) làm gì trong một dự án phần mềm? Kỹ năng nào quan trọng nhất với BA?", expectedConcepts: ["nghiệp vụ", "yêu cầu", "giao tiếp", "phân tích"] },
  { roleCode: "business_analyst", phase: "technical", difficulty: "medium", prompt: "Viết user story chuẩn cần những gì? Cho ví dụ một user story cho chức năng giỏ hàng kèm tiêu chí nghiệm thu.", expectedConcepts: ["user story", "tiêu chí", "người dùng", "giỏ hàng"] },
  { roleCode: "business_analyst", phase: "technical", difficulty: "hard", prompt: "Stakeholder đưa ra hai yêu cầu mâu thuẫn nhau. Quy trình của bạn để làm rõ, phân tích và chốt yêu cầu cuối cùng là gì?", expectedConcepts: ["làm rõ", "mâu thuẫn", "giao tiếp", "ưu tiên"] },
  { roleCode: "business_analyst", phase: "technical", difficulty: "medium", prompt: "Bạn dùng kỹ thuật nào để thu thập yêu cầu (requirement elicitation) khi khách hàng chưa biết mình muốn gì?", expectedConcepts: ["phỏng vấn", "quan sát", "prototype", "workshop"] },
  { roleCode: "business_analyst", phase: "english", difficulty: "medium", prompt: "How do you gather requirements from stakeholders who have different priorities?", expectedConcepts: ["requirements", "stakeholder", "priority", "workshop"] },
  { roleCode: "business_analyst", phase: "communication", difficulty: "easy", prompt: "Bạn phải trình bày một thay đổi phạm vi dự án cho khách hàng. Bạn chuẩn bị và trình bày thế nào cho thuyết phục?", expectedConcepts: ["chuẩn bị", "trình bày", "dữ liệu", "thuyết phục"] },
];

export function seedQuestionBank(): Question[] {
  return QSEEDS.map((q, i) => ({
    id: `qbk_${String(i + 1).padStart(3, "0")}`,
    roleCode: q.roleCode,
    phase: q.phase,
    difficulty: q.difficulty,
    language: "vi",
    prompt: q.prompt,
    expectedConcepts: q.expectedConcepts,
    isActive: true,
    version: 1,
  }));
}
