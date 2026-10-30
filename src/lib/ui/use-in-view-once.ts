"use client";
import { useEffect, useRef, useState } from "react";

/**
 * Kích hoạt hiệu ứng "khi vào viewport" đúng một lần (marker sweep,
 * squiggle draw-in). Môi trường không có IntersectionObserver hoặc SSR
 * thì coi như đã vào viewport để nội dung không bị ẩn vĩnh viễn.
 */
export function useInViewOnce<T extends Element>() {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return { ref, inView };
}
