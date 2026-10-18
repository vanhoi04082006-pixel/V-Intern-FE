"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getWorkspace,
  lifecyclePath,
  type InternWorkspace as Workspace,
} from "@/lib/api/workspace";
import { getSessionUser } from "@/lib/auth/session";
import { ErrorState, LoadingState } from "@/components/shared/data-state";
import { EmptyInternWorkspace } from "./empty-intern-workspace";
import { ActiveEntry } from "./active-entry";
import { InternShell } from "./intern-shell";
import { WaitingRecruitmentSummary } from './waiting-recruitment-summary';
import {
  waitingPresentation,
} from "./workspace-presentation";
export function InternWorkspace() {
  const router = useRouter();
  const [data, setData] = useState<Workspace | null>(null);
  const [error, setError] = useState<unknown>();
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    void getWorkspace(controller.signal)
      .then((workspace) => {
        const target = lifecyclePath(workspace);
        if (target !== "/intern") {
          router.replace(target);
          return;
        }
        setData(workspace);
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(e);
      });
    return () => controller.abort();
  }, [attempt, router]);
  const reload = () => {
    setError(undefined);
    setData(null);
    setAttempt((x) => x + 1);
  };
  if (error) return <ErrorState error={error} onRetry={reload} />;
  if (!data)
    return <LoadingState label="Đang xác định trạng thái thực tập..." />;
  const user = getSessionUser();
  if (!user) return <LoadingState label="Đang kiểm tra phiên đăng nhập..." />;
  const waiting = data.status === "unassigned";
  return (
    <InternShell active={!waiting} outcomesAvailable={!waiting || Boolean(data.hasAssignmentHistory)}>
      {waiting ? <EmptyInternWorkspace state={waitingPresentation(data, user)} onReload={reload} recruitment={<WaitingRecruitmentSummary />} /> : <ActiveEntry workspace={data} />}
    </InternShell>
  );
}
