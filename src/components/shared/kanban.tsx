"use client";

import * as React from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { taskStatusLabels, taskStatusTones } from "@/lib/client/labels";
import { StatusDot } from "./primitives";

export interface KanbanCardData {
  id: string;
  status: string;
}

const STATUS_ORDER = ["todo", "doing", "review", "done"] as const;

function DraggableCard<T extends KanbanCardData>({
  item,
  renderCard,
  onOpen,
}: {
  item: T;
  renderCard: (item: T, dragging: boolean) => React.ReactNode;
  onOpen?: (item: T) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
  });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={() => onOpen?.(item)}
      style={
        transform
          ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 5 }
          : undefined
      }
      className={cn(
        "cursor-grab touch-none active:cursor-grabbing",
        isDragging && "opacity-40"
      )}
    >
      {renderCard(item, isDragging)}
    </div>
  );
}

function Column({
  status,
  count,
  children,
}: {
  status: string;
  count: number;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `col:${status}` });
  const tone = (taskStatusTones[status] ?? "zinc") as "emerald" | "teal" | "amber" | "zinc";
  return (
    <div className="flex min-h-0 flex-col rounded-2xl border border-line bg-deep/60">
      <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
        <div className="flex items-center gap-2">
          <StatusDot tone={tone} />
          <span className="text-xs font-semibold uppercase tracking-wide text-dim">
            {taskStatusLabels[status] ?? status}
          </span>
        </div>
        <span className="rounded-full border border-line bg-panel px-2 py-0.5 font-mono text-[11px] font-semibold text-dim">
          {count}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-[180px] flex-1 flex-col gap-2.5 overflow-y-auto p-2.5",
          isOver && "bg-brand/[0.04] ring-1 ring-inset ring-brand/25"
        )}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * Bảng kanban 4 cột, kéo thả giữa các cột.
 * - onMove(taskId, toStatus): gọi API đổi trạng thái.
 * - renderCard(item, dragging): vẽ thẻ.
 */
export function KanbanBoard<T extends KanbanCardData>({
  items,
  onMove,
  renderCard,
  onOpen,
  className,
}: {
  items: T[];
  onMove: (taskId: string, toStatus: string) => void;
  renderCard: (item: T, dragging: boolean) => React.ReactNode;
  onOpen?: (item: T) => void;
  className?: string;
}) {
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const byStatus = React.useMemo(() => {
    const map: Record<string, T[]> = {};
    STATUS_ORDER.forEach((s) => (map[s] = []));
    items.forEach((it) => {
      if (!map[it.status]) map[it.status] = [];
      map[it.status].push(it);
    });
    return map;
  }, [items]);

  const activeItem = items.find((i) => i.id === activeId) ?? null;

  const handleStart = (e: DragStartEvent) => setActiveId(String(e.active.id));
  const handleEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const overId = e.over?.id;
    if (!overId || typeof overId !== "string" || !overId.startsWith("col:")) return;
    const toStatus = overId.slice(4);
    const taskId = String(e.active.id);
    const item = items.find((i) => i.id === taskId);
    if (item && item.status !== toStatus) onMove(taskId, toStatus);
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleStart}
      onDragEnd={handleEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className={cn("grid gap-3 md:grid-cols-2 xl:grid-cols-4", className)}>
        {STATUS_ORDER.map((status) => (
          <Column key={status} status={status} count={byStatus[status]?.length ?? 0}>
            {(byStatus[status] ?? []).map((item) => (
              <DraggableCard
                key={item.id}
                item={item}
                renderCard={renderCard}
                onOpen={onOpen}
              />
            ))}
          </Column>
        ))}
      </div>
      <DragOverlay dropAnimation={{ duration: 180 }}>
        {activeItem ? (
          <div className="w-[280px] rotate-2">{renderCard(activeItem, true)}</div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

/** Thẻ task chuẩn dùng trong kanban (cả intern & instructor). */
export function KanbanTaskCard({
  code,
  title,
  meta,
  footer,
  dragging,
  onClick,
}: {
  code: string;
  title: string;
  meta?: React.ReactNode;
  footer?: React.ReactNode;
  dragging?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={cn(
        "card-surface p-3.5 transition-all",
        !dragging && "hover:border-line-strong hover:bg-panel-2",
        dragging && "glow-brand scale-[1.02] bg-panel-2"
      )}
    >
      <div className="mb-1.5 font-mono text-[10px] font-semibold tracking-wider text-brand-bright/80">
        {code}
      </div>
      <p className="line-clamp-2 text-[13px] font-medium leading-snug text-ink">{title}</p>
      {meta ? <div className="mt-2 text-[11px] text-dim">{meta}</div> : null}
      {footer ? <div className="mt-2.5">{footer}</div> : null}
    </div>
  );
}
