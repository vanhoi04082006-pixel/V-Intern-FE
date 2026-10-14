"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  recruitmentApi,
  type Interview,
  type RecruitmentProfile,
} from "@/lib/api/recruitment";
import {
  getWorkspace,
  lifecyclePath,
  type RecruitmentRole,
} from "@/lib/api/workspace";
import { ApiError, errorMessage } from "@/lib/auth/api-client";
import { ErrorState, LoadingState } from "@/components/shared/data-state";
interface Flow {
  profile: RecruitmentProfile;
  interview: Interview | null;
  busy: boolean;
  evaluating: boolean;
  notice: string | null;
  reload: () => Promise<void>;
  selectRole: (role: RecruitmentRole) => Promise<boolean>;
  start: () => Promise<boolean>;
  saveAnswer: (questionId: string, text: string) => Promise<boolean>;
  submit: () => Promise<boolean>;
  retryEvaluation: () => Promise<boolean>;
}
const Context = createContext<Flow | null>(null);
export function RecruitmentProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [profile, setProfile] = useState<RecruitmentProfile | null>(null);
  const [interview, setInterview] = useState<Interview | null>(null);
  const [loadedPath, setLoadedPath] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>();
  const [busy, setBusy] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const load = useCallback(
    async (signal?: AbortSignal) => {
      const [workspace, next] = await Promise.all([
        getWorkspace(signal),
        recruitmentApi.me(signal),
      ]);
      const detail = next.currentInterviewSessionId
        ? await recruitmentApi.questions(next.currentInterviewSessionId, signal)
        : null;
      if (signal?.aborted) return;
      const target = lifecyclePath(workspace);
      const required = workspace.status === "recruitment_required";
      const viewingResult =
        pathname === "/intern/onboarding/result" && next.status === "passed";
      const allowed = required
        ? pathname === "/intern/onboarding" ||
          pathname === "/intern/onboarding/role"
        : pathname === target || viewingResult;
      if (!allowed) {
        router.replace(target);
        return;
      }
      setProfile(next);
      setInterview(detail);
      setLoadedPath(pathname);
      setLoading(false);
    },
    [pathname, router],
  );
  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve()
      .then(() => load(controller.signal))
      .catch((e) => {
        if (!controller.signal.aborted) {
          setError(e);
          setLoading(false);
        }
      });
    return () => controller.abort();
  }, [load, attempt]);
  const reload = async () => {
    setLoading(true);
    setError(undefined);
    try {
      await load();
    } catch (e) {
      setError(e);
      setLoading(false);
    }
  };
  async function mutate(action: () => Promise<void>): Promise<boolean> {
    if (busy) return false;
    setBusy(true);
    setNotice(null);
    try {
      await action();
      return true;
    } catch (e) {
      setNotice(errorMessage(e));
      return false;
    } finally {
      setBusy(false);
    }
  }
  const selectRole = (role: RecruitmentRole) =>
    mutate(async () => {
      setProfile(await recruitmentApi.selectRole(role));
    });
  const start = () =>
    mutate(async () => {
      const next = await recruitmentApi.start();
      setInterview(next);
      setProfile(await recruitmentApi.me());
      router.replace("/intern/onboarding/interview");
    });
  const saveAnswer = (id: string, text: string) =>
    mutate(async () => {
      if (!interview)
        throw new ApiError(
          409,
          "NO_INTERVIEW",
          "Phiên phỏng vấn chưa bắt đầu.",
        );
      await recruitmentApi.saveAnswer(interview.session.id, id, text);
      setInterview(await recruitmentApi.questions(interview.session.id));
    });
  const evaluate = async (retry: boolean) => {
    if (busy) return false;
    setEvaluating(true);
    try { return await mutate(async () => {
      if (!interview)
        throw new ApiError(
          409,
          "NO_INTERVIEW",
          "Phiên phỏng vấn chưa bắt đầu.",
        );
      const next = await (retry
        ? recruitmentApi.retryEvaluation(interview.session.id)
        : recruitmentApi.submit(interview.session.id));
      setInterview({ ...interview, session: next.session });
      setProfile(await recruitmentApi.me());
      if (next.errorCode)
        setNotice(
          errorMessage(
            new ApiError(503, next.errorCode, "Đánh giá chưa khả dụng."),
          ),
        );
      router.replace("/intern/onboarding/result");
    }); } finally { setEvaluating(false); }
  };
  if (error)
    return (
      <ErrorState
        error={error}
        onRetry={() => {
          setError(undefined);
          setLoading(true);
          setAttempt((x) => x + 1);
        }}
      />
    );
  if (loading || !profile || loadedPath !== pathname)
    return <LoadingState label="Đang tải trạng thái tuyển dụng..." />;
  return (
    <Context.Provider
      value={{
        profile,
        interview,
        busy,
        evaluating,
        notice,
        reload,
        selectRole,
        start,
        saveAnswer,
        submit: () => evaluate(false),
        retryEvaluation: () => evaluate(true),
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useRecruitmentFlow(): Flow {
  const context = useContext(Context);
  if (!context) throw new Error("RecruitmentProvider is required");
  return context;
}
