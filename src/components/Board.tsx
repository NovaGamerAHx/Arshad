import { useState } from "react";
import type { ColumnId, Task } from "../lib/types";
import { colList, useStore } from "../store";
import { faNum } from "../lib/jalali";
import { TaskCard } from "./TaskCard";
import { IconInbox } from "./Icons";

const COLS: { id: ColumnId; title: string; hex: string; hint: string }[] = [
  { id: "unplanned", title: "برنامه‌ریزی‌نشده", hex: "#94a3b8", hint: "تسک‌های بک‌لاگ بدون تاریخ" },
  { id: "planned", title: "برنامه‌ریزی‌شده", hex: "#0284c7", hint: "امروز، فردا یا روزهای آینده" },
  { id: "done", title: "انجام‌شده", hex: "#10b981", hint: "تسک‌های تکمیل‌شده" },
];

export function Board({ tasks, onEdit }: { tasks: Task[]; onEdit: (t: Task) => void }) {
  const { dropTask, reorderAdjacent } = useStore();
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<ColumnId | null>(null);
  const [overTarget, setOverTarget] = useState<string | null>(null);

  const reset = () => {
    setDragId(null);
    setOverCol(null);
    setOverTarget(null);
  };

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {COLS.map((c) => {
        const list = colList(tasks, c.id);
        const isOver = dragId !== null && overCol === c.id;
        return (
          <div
            key={c.id}
            onDragOver={(e) => {
              e.preventDefault();
              setOverCol(c.id);
            }}
            onDrop={(e) => {
              e.preventDefault();
              if (dragId) dropTask(dragId, c.id, null);
              reset();
            }}
            className={`flex min-h-[320px] flex-col rounded-2xl border p-2.5 transition-all duration-200 ${
              isOver ? "border-brand/50 bg-brand/[.05] shadow-inner" : "border-line bg-soft/60"
            }`}
            style={{ borderTop: `3px solid ${c.hex}66` }}
          >
            <div className="flex items-center justify-between px-1.5 py-1">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.hex }} />
                <span className="font-display text-[13px] font-bold text-ink">{c.title}</span>
              </div>
              <span className="rounded-full bg-surface px-2 py-0.5 text-[11px] font-bold text-mut shadow-sm">
                {faNum(list.length)}
              </span>
            </div>
            <p className="px-1.5 pb-1 text-[11px] text-mut">{c.hint}</p>

            <div className="flex flex-1 flex-col gap-2">
              {list.length === 0 && (
                <div className={`flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-6 text-center transition ${isOver ? "border-brand/60 text-brand" : "border-line text-mut/70"}`}>
                  <IconInbox size={22} />
                  <p className="text-xs font-semibold">تسکی اینجا نیست</p>
                  <p className="text-[11px]">کارت را بکش و اینجا رها کن</p>
                </div>
              )}
              {list.map((t, i) => (
                <div
                  key={t.id}
                  draggable
                  onDragStart={(e) => {
                    setDragId(t.id);
                    e.dataTransfer.effectAllowed = "move";
                    e.dataTransfer.setData("text/plain", t.id);
                  }}
                  onDragEnd={reset}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setOverCol(c.id);
                    setOverTarget(t.id);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (dragId && dragId !== t.id) dropTask(dragId, c.id, t.id);
                    reset();
                  }}
                  className="relative"
                >
                  {overTarget === t.id && dragId !== null && dragId !== t.id && (
                    <div className="absolute -top-1 inset-x-3 z-10 h-[3px] rounded-full bg-brand shadow-sm shadow-brand/50" />
                  )}
                  <TaskCard
                    task={t}
                    view="board"
                    col={c.id}
                    onEdit={onEdit}
                    canUp={i > 0}
                    canDown={i < list.length - 1}
                    onUp={() => reorderAdjacent(t.id, -1, c.id)}
                    onDown={() => reorderAdjacent(t.id, 1, c.id)}
                    isDragging={dragId === t.id}
                  />
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
