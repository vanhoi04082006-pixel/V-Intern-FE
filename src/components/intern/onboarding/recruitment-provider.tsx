"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";

import {
  DEFAULT_ROLE_ID,
  INTERVIEW_QUESTIONS,
  INTERVIEW_SEED_ANSWERS,
} from "./data/recruitment-mock-data";
import type { RoleId } from "./data/recruitment-mock-data";

/**
 * Mock recruitment state dùng chung cho 4 route onboarding (in-memory,
 * qua client context ở layout — sống qua điều hướng SPA giữa các route con,
 * reset khi reload trang).
 *
 * MOCK-ONLY, có chủ đích:
 * - KHÔNG persistence (localStorage/sessionStorage/cookie) — không được phép
 *   phát minh trạng thái tuyển dụng bền vững khi BE chưa có API.
 * - KHÔNG fetch — đây là điểm nối duy nhất cần thay bằng API thật sau này:
 *   selectRole/submitAnswer/continueWithRole sẽ trở thành mutation calls.
 * - Câu trả lời ghi nhận ngay khi submit và tự chuyển sang câu kế tiếp;
 *   hết câu 8 → isInterviewCompleted = true (UI hiển thị CTA xem kết quả).
 */

export interface RecruitmentFlowState {
  selectedRoleId: RoleId;
  selectRole: (id: RoleId) => void;
  /** Answers đã ghi nhận theo question id (mock seed gồm q1–q2). */
  answers: Readonly<Record<string, string>>;
  /** Index (0-based) câu hỏi hiện tại trong INTERVIEW_QUESTIONS. */
  currentQuestionIndex: number;
  isInterviewCompleted: boolean;
  /** Ghi nhận câu trả lời hiện tại rồi tự advance; hết câu → completed. */
  submitAnswer: (text: string) => void;
  /**
   * CTA "Tiếp tục với {vai trò đề xuất}" ở Result (fail): đổi vai trò đang
   * chọn sang vai trò đề xuất + reset vòng phỏng vấn. CHỈ đổi mock state
   * phía client — không tạo bất kỳ persist/assignment nào phía server.
   */
  continueWithRole: (id: RoleId) => void;
}

const RecruitmentFlowContext = createContext<RecruitmentFlowState | null>(null);

/** Index câu hỏi hiện tại mặc định (0-based): câu 3/8 theo reference. */
const INTERVIEW_ANSWERED_SEED_INDEX = 2;

export function RecruitmentProvider({ children }: { children: ReactNode }) {
  const [selectedRoleId, setSelectedRoleId] = useState<RoleId>(DEFAULT_ROLE_ID);
  const [answers, setAnswers] = useState<Record<string, string>>(
    () => ({ ...INTERVIEW_SEED_ANSWERS })
  );
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(
    // Mock story theo reference: Q1–Q2 đã trả lời, đang ở câu 3/8.
    INTERVIEW_ANSWERED_SEED_INDEX
  );
  const [isInterviewCompleted, setIsInterviewCompleted] = useState(false);

  const selectRole = useCallback((id: RoleId) => {
    setSelectedRoleId(id);
  }, []);

  const submitAnswer = useCallback(
    (text: string) => {
      const question = INTERVIEW_QUESTIONS[currentQuestionIndex];
      if (!question) return;
      setAnswers((prev) => ({ ...prev, [question.id]: text }));
      if (currentQuestionIndex >= INTERVIEW_QUESTIONS.length - 1) {
        setIsInterviewCompleted(true);
      } else {
        setCurrentQuestionIndex((index) =>
          Math.min(index + 1, INTERVIEW_QUESTIONS.length - 1)
        );
      }
    },
    [currentQuestionIndex]
  );

  const continueWithRole = useCallback((id: RoleId) => {
    setSelectedRoleId(id);
    setAnswers({});
    setCurrentQuestionIndex(0);
    setIsInterviewCompleted(false);
  }, []);

  const value = useMemo<RecruitmentFlowState>(
    () => ({
      selectedRoleId,
      selectRole,
      answers,
      currentQuestionIndex,
      isInterviewCompleted,
      submitAnswer,
      continueWithRole,
    }),
    [
      selectedRoleId,
      selectRole,
      answers,
      currentQuestionIndex,
      isInterviewCompleted,
      submitAnswer,
      continueWithRole,
    ]
  );

  return (
    <RecruitmentFlowContext.Provider value={value}>
      {children}
    </RecruitmentFlowContext.Provider>
  );
}

export function useRecruitmentFlow(): RecruitmentFlowState {
  const context = useContext(RecruitmentFlowContext);
  if (!context) {
    throw new Error(
      "useRecruitmentFlow phải dùng bên trong RecruitmentProvider (layout onboarding)."
    );
  }
  return context;
}
