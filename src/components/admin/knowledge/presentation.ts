import type { KnowledgeAudience, KnowledgeDraft, KnowledgeKind, KnowledgePurpose, KnowledgeStatus } from '@/lib/api/knowledge';

export const kindLabels: Record<KnowledgeKind, string> = { qa: 'Câu hỏi & trả lời', guide: 'Hướng dẫn', exercise: 'Bài tập', solution: 'Lời giải', rubric: 'Tiêu chí chấm', plan_template: 'Mẫu kế hoạch', communication: 'Mẫu liên lạc' };
export const audienceLabels: Record<KnowledgeAudience, string> = { student_safe: 'Hỗ trợ học tập', staff_only: 'Nội bộ', grading_only: 'Riêng cho chấm' };
export const audienceHints: Record<KnowledgeAudience, string> = { student_safe: 'Nội dung an toàn để hỗ trợ sinh viên khi được dùng đúng phạm vi.', staff_only: 'Dành cho công việc vận hành và quản lý nội bộ.', grading_only: 'Có đáp án, lời giải hoặc rubric. Không dùng làm context hỗ trợ sinh viên.' };
export const purposeLabels: Record<KnowledgePurpose, string> = { interview: 'Hội thoại phỏng vấn', interview_evaluation: 'Chấm phỏng vấn', planning: 'Lập kế hoạch', code_review: 'Chấm & review code', mentoring: 'Hỗ trợ học tập', evaluation_assistance: 'Hỗ trợ đánh giá', recommendation: 'Đề xuất cải thiện', cv_screening: 'Phân tích CV', communication: 'Liên lạc tuyển dụng' };
export const statusLabels: Record<KnowledgeStatus, string> = { draft: 'Bản nháp', published: 'Đã xuất bản', archived: 'Đã lưu trữ' };
export const statusTone = (status: KnowledgeStatus) => status === 'published' ? 'green' as const : status === 'draft' ? 'amber' as const : 'gray' as const;
export const gradingKind = (kind: KnowledgeKind) => ['qa', 'solution', 'rubric'].includes(kind);
export function blankKnowledgeDraft(kind: KnowledgeKind = 'guide'): KnowledgeDraft {
  return { kind, title: '', summary: '', language: 'vi', difficulty: null,
    audience: gradingKind(kind) ? 'grading_only' : ['plan_template', 'communication'].includes(kind) ? 'staff_only' : 'student_safe',
    purposes: [kind === 'qa' || kind === 'rubric' ? 'interview_evaluation' : kind === 'solution' ? 'code_review' : kind === 'plan_template' ? 'planning' : kind === 'communication' ? 'communication' : 'mentoring'],
    roleCodes: [], tags: [], sources: [], body: kind === 'qa' ? { question: '', expectedConcepts: [], validAnswers: ['', ''], exampleAnswer: '', commonMistakes: [], followUps: [], weakAnswerExamples: [], rubric: [{ criterion: '', description: '', weight: 100 }] }
      : kind === 'rubric' ? { guidance: '', rubric: [{ criterion: '', description: '', weight: 100 }] } : { markdown: '' } };
}
export function authoringDraft(draft: KnowledgeDraft): KnowledgeDraft {
  // Empty source rows are UI placeholders; partial rows must still be validated by the server.
  return { ...draft, sources: draft.sources.filter(source => source.title.trim() || source.url?.trim() || source.reference?.trim()).map(source => ({ title: source.title, ...(source.url?.trim() ? { url: source.url } : {}), ...(source.reference?.trim() ? { reference: source.reference } : {}) })) };
}
