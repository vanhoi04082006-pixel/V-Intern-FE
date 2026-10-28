import { ArrowRight, Check, Lightbulb, RotateCcw } from "lucide-react";

export function RecruitmentPolicy({ attemptNumber, attemptsRemaining }: { attemptNumber: number; attemptsRemaining: number }) {
  return <section className="workspace-interview-policy" aria-label="Quy tắc kết quả và số lượt phỏng vấn">
    <h2>Hiểu kết quả của bạn</h2>
    <div className="workspace-score-bands" aria-hidden="true"><i /><i /><i /></div>
    <ol>
      <li><RotateCcw size={16} aria-hidden="true" /><div><strong>Dưới 50 điểm</strong><p>Chưa đạt. Xem phản hồi và chuẩn bị lại.</p></div></li>
      <li><Lightbulb size={16} aria-hidden="true" /><div><strong>Từ 50 đến 70 điểm</strong><p>AI đề xuất vai trò khác dựa trên câu trả lời. Bạn tự chọn hướng tiếp theo.</p></div></li>
      <li><Check size={16} aria-hidden="true" /><div><strong>Trên 70 điểm</strong><p>Đậu vị trí đã chọn và chờ phân công dự án.</p></div></li>
    </ol>
    <div className="workspace-attempts"><div aria-hidden="true">{[1, 2, 3].map((step) => <span key={step} data-used={step <= attemptNumber ? "true" : undefined}>{step <= attemptNumber ? <Check size={12} /> : step}</span>)}</div><p>Đã dùng {attemptNumber} lượt · Còn {attemptsRemaining} lượt</p></div>
    <p className="workspace-policy-note"><ArrowRight size={13} aria-hidden="true" />Tối đa 3 lượt tổng cộng. Đổi vai trò không làm mới số lượt; bắt đầu phỏng vấn mới tính một lượt.</p>
  </section>;
}
