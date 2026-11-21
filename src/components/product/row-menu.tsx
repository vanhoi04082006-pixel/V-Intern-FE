"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import Link from "next/link";

export function RowMenu({ label, href, onOpen, items }: {
  label: string;
  href?: string;
  onOpen?: () => void;
  items?: { label: string; onSelect: () => void }[];
}) {
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const openAtLast = useRef(false);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ left: 8, top: 8 });
  const entries = items ?? [];
  const close = useCallback((restoreFocus = false) => {
    menu.current?.hidePopover?.();
    setOpen(false);
    if (restoreFocus) trigger.current?.focus({ preventScroll: true });
  }, []);
  const place = useCallback(() => {
    if (!trigger.current || !menu.current) return;
    const anchor = trigger.current.getBoundingClientRect();
    const popup = menu.current.getBoundingClientRect();
    const width = popup.width || Math.min(176, window.innerWidth - 16);
    const left = Math.max(8, Math.min(anchor.right - width, window.innerWidth - width - 8));
    const top = anchor.bottom + popup.height + 4 <= window.innerHeight - 8
      ? anchor.bottom + 4 : Math.max(8, anchor.top - popup.height - 4);
    setPosition(old => old.left === left && old.top === top ? old : { left, top });
  }, []);
  useLayoutEffect(() => {
    if (!open) return;
    place();
    const targets = menu.current?.querySelectorAll<HTMLElement>('[role="menuitem"]');
    targets?.[openAtLast.current ? targets.length - 1 : 0]?.focus({ preventScroll: true });
  }, [open, place]);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !menu.current?.contains(event.target) && !trigger.current?.contains(event.target)) close();
    };
    const scrolled = (event: Event) => {
      if (event.target instanceof Node && !menu.current?.contains(event.target)) close();
    };
    document.addEventListener("pointerdown", outside);
    window.addEventListener("scroll", scrolled, true);
    window.addEventListener("resize", place);
    return () => {
      document.removeEventListener("pointerdown", outside);
      window.removeEventListener("scroll", scrolled, true);
      window.removeEventListener("resize", place);
    };
  }, [open, close, place]);
  function show(last = false) {
    openAtLast.current = last;
    setOpen(true);
    menu.current?.showPopover?.();
  }
  function navigate(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape" || event.key === "Tab") {
      if (event.key === "Escape") event.preventDefault();
      close(true);
      return;
    }
    const targets = [...(menu.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])];
    if (!targets.length || !["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const current = targets.findIndex(target => target === document.activeElement);
    const next = event.key === "Home" ? 0 : event.key === "End" ? targets.length - 1
      : (current + (event.key === "ArrowDown" ? 1 : -1) + targets.length) % targets.length;
    targets[next]?.focus({ preventScroll: true });
  }
  const itemClass = "block w-full rounded-md px-3 py-2 text-left text-caption text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40";
  return (
    <span className="relative inline-block">
      <button id={`${id}-trigger`} ref={trigger} type="button" aria-label={label} aria-haspopup="menu" aria-expanded={open} aria-controls={id}
        className="rounded border border-primary px-2 py-1 text-primary hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        onClick={() => { if (open) close(true); else show(); }}
        onKeyDown={event => { if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); show(event.key === "ArrowUp"); } }}>
        ⋯
      </button>
      <div id={id} ref={menu} popover="auto" role="menu" aria-labelledby={`${id}-trigger`} onKeyDown={navigate}
        onToggle={event => setOpen(event.newState === "open")}
        className="z-50 w-44 max-w-[calc(100vw-1rem)] max-h-[min(20rem,calc(100dvh-1rem))] overflow-y-auto rounded-control border border-primary bg-card p-1 shadow-popover"
        style={{ position: "fixed", inset: "auto", margin: 0, ...position, display: open ? undefined : "none" }}>
        {href ? <Link href={href} role="menuitem" tabIndex={-1} className={itemClass} onClick={() => close()}>Mở chi tiết</Link>
          : onOpen && !entries.length ? <button type="button" role="menuitem" tabIndex={-1} className={itemClass} onClick={() => { close(true); onOpen(); }}>Mở chi tiết</button>
            : entries.map(entry => <button key={entry.label} type="button" role="menuitem" tabIndex={-1} className={itemClass} onClick={() => { close(true); entry.onSelect(); }}>{entry.label}</button>)}
      </div>
    </span>
  );
}
