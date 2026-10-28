"use client";

import { ToneBadge } from "./primitives";
import {
  priorityLabels,
  priorityTones,
  roleLabels,
  sessionStatusLabels,
  submissionStatusLabels,
  taskStatusLabels,
  taskStatusTones,
  evaluationStatusLabels,
} from "@/lib/client/labels";

type Tone = "emerald" | "teal" | "amber" | "rose" | "orange" | "violet" | "zinc" | "brand";

export function TaskStatusBadge({ status }: { status: string }) {
  return (
    <ToneBadge tone={(taskStatusTones[status] ?? "zinc") as Tone} dot>
      {taskStatusLabels[status] ?? status}
    </ToneBadge>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  return (
    <ToneBadge tone={(priorityTones[priority] ?? "zinc") as Tone}>
      {priorityLabels[priority] ?? priority}
    </ToneBadge>
  );
}

const roleToneMap: Record<string, Tone> = {
  frontend: "teal",
  backend: "amber",
  fullstack: "brand",
  qa: "violet",
  business_analyst: "orange",
  intern: "zinc",
  instructor: "brand",
  admin: "rose",
};

export function RoleBadge({ role }: { role: string }) {
  return (
    <ToneBadge tone={roleToneMap[role] ?? "zinc"}>{roleLabels[role] ?? role}</ToneBadge>
  );
}

const sessionToneMap: Record<string, Tone> = {
  planning: "teal",
  active: "emerald",
  completed: "zinc",
  cancelled: "rose",
};

export function SessionStatusBadge({ status }: { status: string }) {
  return (
    <ToneBadge tone={sessionToneMap[status] ?? "zinc"} dot>
      {sessionStatusLabels[status] ?? status}
    </ToneBadge>
  );
}

const submissionToneMap: Record<string, Tone> = {
  submitted: "teal",
  approved: "emerald",
  rework: "amber",
  withdrawn: "zinc",
};

export function SubmissionStatusBadge({ status }: { status: string }) {
  return (
    <ToneBadge tone={submissionToneMap[status] ?? "zinc"} dot>
      {submissionStatusLabels[status] ?? status}
    </ToneBadge>
  );
}

const evaluationToneMap: Record<string, Tone> = {
  draft: "zinc",
  submitted: "teal",
  finalized: "emerald",
};

export function EvaluationStatusBadge({ status }: { status: string }) {
  return (
    <ToneBadge tone={evaluationToneMap[status] ?? "zinc"} dot>
      {evaluationStatusLabels[status] ?? status}
    </ToneBadge>
  );
}

export function ScoreBadge({ score }: { score: number | null | undefined }) {
  if (score === null || score === undefined) {
    return <ToneBadge tone="zinc">Chưa chấm</ToneBadge>;
  }
  const tone: Tone = score >= 80 ? "emerald" : score >= 60 ? "teal" : score >= 40 ? "amber" : "rose";
  return <ToneBadge tone={tone}>{score.toFixed(0)} điểm</ToneBadge>;
}
