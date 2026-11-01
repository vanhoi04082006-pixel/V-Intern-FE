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
  type Variants,
} from "framer-motion";
import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Journey Notebook v3 — bộ chuyển động "mực & giấy".
 * Nguyên tắc: entrance dùng spring (vật lý thật, không ease tuyến tính),
 * scroll parallax chạy trên transform, mọi hiệu ứng tôn trọng
 * prefers-reduced-motion bằng cách render tĩnh.
 */

/* Spring chuẩn của sổ tay: nhẹ, nhanh dừng, không nảy quá. */
const PAPER_SPRING = { type: "spring", stiffness: 240, damping: 26, mass: 0.9 } as const;

/** Reveal một phần tử: rơi nhẹ như tờ giấy đặt xuống, spring thay vì ease. */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 26,
  once = true,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  once?: boolean;
}) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: "-72px" }}
      transition={{ ...PAPER_SPRING, delay }}
    >
      {children}
    </motion.div>
  );
}

const STAGGER_PARENT: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

const STAGGER_ITEM: Variants = {
  hidden: { opacity: 0, y: 22, rotate: 0.4 },
  visible: {
    opacity: 1,
    y: 0,
    rotate: 0,
    transition: PAPER_SPRING,
  },
};

/** Nhóm reveal so le: từng "tấm giấy" rơi xuống lần lượt như người ta dán từng tờ. */
export function RevealStagger({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      variants={STAGGER_PARENT}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-64px" }}
    >
      {children}
    </motion.div>
  );
}

/** Mỗi item trong RevealStagger — dùng bên trong component con. */
export function RevealItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div className={className} variants={STAGGER_ITEM}>
      {children}
    </motion.div>
  );
}

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

/**
 * Nút/thẻ nhấn với spring vật lý: press lún nhẹ, thả nảy về như giấy.
 * Bọc bên ngoài phần tử tương tác; không đổi behaviour của children.
 */
export function PressSpring({
  children,
  className,
  scaleOnTap = 0.97,
}: {
  children: ReactNode;
  className?: string;
  scaleOnTap?: number;
}) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={cn("inline-block", className)}>{children}</div>;
  }

  return (
    <motion.div
      className={cn("inline-block", className)}
      whileHover={{ y: -2 }}
      whileTap={{ scale: scaleOnTap, y: 0 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
    >
      {children}
    </motion.div>
  );
}
