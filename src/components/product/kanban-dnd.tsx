"use client";
import { useState, type DragEvent, type ReactNode } from "react";
import { nextOwnStatus, type TaskStatus } from "@/lib/api/work";
import { managerTransitions } from "@/lib/api/management";

export const DRAG_MIME = "application/x-vintern-task";
let activeDrag: { id: string; from: TaskStatus } | null = null;

/** Interns advance their own tasks exactly one step: todo → doing → review. */
export function canOwnDrop(from: TaskStatus, to: TaskStatus): boolean {
  return nextOwnStatus(from) === to;
}

/** Instructors follow the managed transition table (review may go back). */
export function canManageDrop(from: TaskStatus, to: TaskStatus): boolean {
  return managerTransitions(from).includes(to);
}

function parsePayload(raw: string): { id: string; from: TaskStatus } | null {
  const sep = raw.lastIndexOf(":");
  if (sep <= 0) return null;
  const statuses = ["todo", "doing", "review", "done"];
  const from = raw.slice(sep + 1);
  if (!statuses.includes(from)) return null;
  return { id: raw.slice(0, sep), from: from as TaskStatus };
}

/** Props turning a task card into a drag source carrying `id:status`. */
export function draggableTask(id: string, from: TaskStatus) {
  return {
    draggable: true,
    onDragStart: (e: DragEvent) => {
      activeDrag = { id, from };
      e.dataTransfer.setData(DRAG_MIME, `${id}:${from}`);
      e.dataTransfer.effectAllowed = "move";
    },
    onDragEnd: () => { activeDrag = null; },
  };
}

export function DropColumn({
  status,
  canDrop,
  onDrop,
  children,
  className = "",
}: {
  status: TaskStatus;
  canDrop: (from: TaskStatus) => boolean;
  onDrop: (id: string, to: TaskStatus) => void;
  children: ReactNode;
  className?: string;
}) {
  const [over, setOver] = useState(false);
  const payload = (e: DragEvent): { id: string; from: TaskStatus } | null => {
    const raw = e.dataTransfer.getData(DRAG_MIME) || e.dataTransfer.getData("text/plain");
    return parsePayload(raw);
  };
  return (
    <div
      data-testid={`drop-${status}`}
      onDragOver={(e) => {
        const p = activeDrag ?? payload(e);
        if (p && canDrop(p.from)) {
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
          setOver(true);
        }
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        setOver(false);
        const p = payload(e);
        activeDrag = null;
        if (p && canDrop(p.from)) {
          e.preventDefault();
          onDrop(p.id, status);
        }
      }}
      className={`${className}${over ? " outline-2 outline-sky-500 outline-dashed" : ""}`}
      aria-dropeffect={over ? "move" : undefined}
    >
      {children}
    </div>
  );
}
