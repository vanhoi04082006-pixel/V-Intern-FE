/** Kiểu dữ liệu dùng chung cho workspace V-Intern. */

export type TaskStatus = "todo" | "in_progress" | "review" | "done";
export type TaskPriority = "low" | "medium" | "high";

export type SprintSummary = {
  id: string;
  name: string;
  goal: string;
  status: "active" | "upcoming" | "done";
  order: number;
  startDate: string;
  endDate: string;
  total: number;
  done: number;
};

export type WorkspaceTask = {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  point: number;
  dueDate: string | null;
  order: number;
  sprintId: string;
  sprintName: string;
  assigneeId?: string;
  assigneeName?: string;
};

export type RosterMember = {
  id: string;
  name: string;
  email: string;
  role: string;
  university: string | null;
  major: string | null;
  bio: string | null;
  taskCount: number;
  doneCount: number;
  overdueCount: number;
  completion: number;
  quality: number;
};

export type Teammate = {
  id: string;
  name: string;
  email: string;
  role: string;
  university: string | null;
  major: string | null;
  bio: string | null;
};

export type WorkspaceData = {
  me: {
    id: string;
    name: string;
    email: string;
    role: string;
    university: string | null;
    major: string | null;
    bio: string | null;
  };
  role: string;
  sprints: SprintSummary[];
  tasks: WorkspaceTask[];
  roster?: RosterMember[];
  teammates?: Teammate[];
};

export type ChatMsg = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

export const TASK_STATUS_META: Record<
  TaskStatus,
  { label: string; short: string }
> = {
  todo: { label: "Cần làm", short: "Cần làm" },
  in_progress: { label: "Đang làm", short: "Đang làm" },
  review: { label: "Chờ duyệt", short: "Chờ duyệt" },
  done: { label: "Hoàn thành", short: "Xong" },
};

export const TASK_PRIORITY_META: Record<
  TaskPriority,
  { label: string; className: string }
> = {
  high: {
    label: "Ưu tiên cao",
    className: "border-destructive/40 bg-destructive/10 text-destructive",
  },
  medium: {
    label: "Trung bình",
    className: "border-blue/40 bg-blue-mist text-blue",
  },
  low: {
    label: "Thấp",
    className: "border-ink/25 bg-raised text-ink-soft",
  },
};
