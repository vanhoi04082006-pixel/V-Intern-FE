"use client";

import {
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  animate,
} from "framer-motion";
import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

/**
 * Journey Notebook v3 — bộ chuyển động "mực & giấy".
 * Nguyên tắc: entrance dùng spring (vật lý thật, không ease tuyến tính),
 * scroll parallax chạy trên transform, mọi hiệu ứng tôn trọng
 * prefers-reduced-motion bằng cách render tĩnh.
 *
 * v6 Gọn: Reveal/RevealStagger/RevealItem/PressSpring không còn nơi dùng
 * (landing đã chuyển qua FadeIn + nb-* kit) nên đã dọn; file này chỉ còn
 * Parallax và InkCountUp.
 */

/**
 * Parallax theo scroll: phần tử trôi nhanh/chậm hơn trang như các lớp giấy
 * dán ở độ sâu khác nhau. `speed` > 0 trôi ngược chiều cuộn (nổi lên),
 * `speed` < 0 chìm xuống. Chỉ chạy khi prefers-reduced-motion: no-preference.
 */
export function Parallax({
  children,
  className,
  speed = 0.12,
  style,
}: {
  children: ReactNode;
  className?: string;
  /** 0.1 = nhẹ; 0.25 = rõ. Giữ ≤ 0.3 để không gây say. */
  speed?: number;
  style?: CSSProperties;
}) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const raw = useTransform(
    scrollYProgress,
    [0, 1],
    [`${(speed * 100).toFixed(2)}%`, `${(-speed * 100).toFixed(2)}%`],
  );
  const y = useSpring(raw, { stiffness: 90, damping: 24, mass: 0.6 });

  if (reduceMotion) {
    return (
      <div ref={ref} className={className} style={style}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ ...style, y, willChange: "transform" }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Con số đếm dần như người viết tay điền số liệu — chạy một lần khi vào
 * viewport. `format` nhận giá trị đã làm tròn, trả chuỗi hiển thị.
 */
export function InkCountUp({
  value,
  duration = 1.1,
  className,
  format,
}: {
  value: number;
  duration?: number;
  className?: string;
  format?: (n: number) => string;
}) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-48px" });
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (latest) =>
    Math.round(latest).toLocaleString("vi-VN"),
  );
  const text = useTransform(rounded, (latest) =>
    format ? format(Number(latest.replace(/\./g, ""))) : latest,
  );

  useEffect(() => {
    if (!inView) return;
    if (reduceMotion) {
      mv.set(value);
      return;
    }
    const controls = animate(mv, value, {
      duration,
      ease: [0.16, 0.84, 0.28, 0.96],
    });
    return () => controls.stop();
  }, [inView, value, duration, mv, reduceMotion]);

  if (reduceMotion) {
    return (
      <span ref={ref} className={className}>
        {(format ? format(value) : value.toLocaleString("vi-VN"))}
      </span>
    );
  }

  return (
    <motion.span ref={ref} className={className}>
      {text}
    </motion.span>
  );
}
