"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getWorkspace,
  lifecyclePath,
  type InternWorkspace as Workspace,
} from "@/lib/api/workspace";
import { getSessionUser } from "@/lib/auth/session";
import { LoadingState, ErrorState } from "@/components/shared/data-state";
import { EmptyInternWorkspace } from "./empty-intern-workspace";
import { ActiveEntry } from "./active-entry";
import { InternShell } from "./intern-shell";
import { WaitingRecruitmentSummary } from "./waiting-recruitment-summary";
import { waitingPresentation } from "./workspace-presentation";
import { useInternWorkspaceContext } from "./intern-workspace-context";

/**
 * Dashboard entry.
 *
 * Under the persistent `/intern` layout the workspace is already loaded, so
 * this only renders the dashboard body. Standalone rendering (unit tests and
 * defensive fallbacks) keeps the previous guard/shell behaviour.
 */
export function InternWorkspace() {
  const embedded = useInternWorkspaceContext();
  return embedded ? (
    <InternWorkspaceContent
      data={embedded.workspace}
      reload={embedded.reload}
    />
  ) : (
    <StandaloneInternWorkspace />
  );
}

function StandaloneInternWorkspace() {
  const [data, setData] = useState<Workspace | null>(null);
  const [error, setError] = useState<unknown>();
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    void getWorkspace(controller.signal)
      .then((workspace) => {
        if (!controller.signal.aborted) setData(workspace);
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(e);
      });
    return () => controller.abort();
  }, [attempt]);
  const reload = () => {
    setError(undefined);
    setData(null);
    setAttempt((x) => x + 1);
  };
  if (error) return <ErrorState error={error} onRetry={reload} />;
  if (!data)
    return <LoadingState label="Đang xác định trạng thái thực tập..." />;
  const waiting = data.status === "unassigned";
  return (
    <InternShell
      active={!waiting}
      outcomesAvailable={!waiting || Boolean(data.hasAssignmentHistory)}
    >
      <InternWorkspaceContent data={data} reload={reload} />
    </InternShell>
  );
}

function InternWorkspaceContent({
  data,
  reload,
}: {
  data: Workspace;
  reload: () => void;
}) {
  const router = useRouter();
  const target = lifecyclePath(data);
  const user = getSessionUser();
  useEffect(() => {
    if (target !== "/intern") router.replace(target);
  }, [router, target]);
  if (!user)
    return <LoadingState label="Đang kiểm tra phiên đăng nhập..." />;
  if (target !== "/intern")
    return <LoadingState label="Đang chuyển đến bước tuyển dụng..." />;
  const waiting = data.status === "unassigned";
  return waiting ? (
    <EmptyInternWorkspace
      state={waitingPresentation(data, user)}
      onReload={reload}
      recruitment={<WaitingRecruitmentSummary onReload={reload} />}
    />
  ) : (
    <ActiveEntry workspace={data} />
  );
}
