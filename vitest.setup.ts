import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import { Blob as FetchBlob } from 'node:buffer';

// Response/fetch come from Node. Keep their binary body constructor in the same
// realm before Undici initializes lazily; jsdom's Blob has no text()/arrayBuffer().
Object.defineProperty(globalThis, 'Blob', { configurable: true, writable: true, value: FetchBlob });

// vitest chạy với globals:false → RTL không tự đăng ký cleanup
afterEach(() => {
  cleanup();
});

/**
 * jsdom không có IntersectionObserver / matchMedia — framer-motion
 * (dùng trong Reveal/Footer) cần stub tối thiểu để test không crash.
 */
if (typeof window !== "undefined") {
  if (!window.matchMedia) {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: (query: string): MediaQueryList => ({
        // jsdom không đọc preference hệ điều hành. Giả lập
        // prefers-reduced-motion: reduce để các hiệu ứng chuyển động
        // (Reveal/InkCountUp/…) render thẳng giá trị cuối trong test —
        // deterministic, không phụ thuộc nhịp rAF; các truy vấn khác
        // (breakpoint, dark mode) giữ matches: false như trước.
        matches: /prefers-reduced-motion/i.test(query),
        media: query,
        onchange: null,
        addListener: (): void => {},
        removeListener: (): void => {},
        addEventListener: (): void => {},
        removeEventListener: (): void => {},
        dispatchEvent: (): boolean => false,
      }),
    });
  }

  class IntersectionObserverStub implements IntersectionObserver {
    readonly root: Element | null = null;
    readonly rootMargin: string = "";
    readonly thresholds: ReadonlyArray<number> = [];
    #callback: IntersectionObserverCallback;
    constructor(callback: IntersectionObserverCallback) {
      this.#callback = callback;
    }
    disconnect(): void {}
    /**
     * IO thật luôn bắn một thông báo khởi tạo cho từng phần tử mới observe
     * (spec queue một task gọi callback với trạng thái giao hiện tại).
     * jsdom không có layout nên mặc định isIntersecting = true — nhờ vậy
     * useInView/whileInView của framer-motion (Reveal, InkCountUp) hoạt
     * động trong test giống trình duyệt thật.
     */
    observe(target: Element): void {
      this.#callback(
        [
          {
            target,
            isIntersecting: true,
            intersectionRatio: 1,
            time: 0,
            boundingClientRect: (target as HTMLElement).getBoundingClientRect?.() ??
              ({} as DOMRect),
            intersectionRect: {} as DOMRect,
            rootBounds: null,
          } as IntersectionObserverEntry,
        ],
        this,
      );
    }
    unobserve(): void {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  }

  if (!window.IntersectionObserver) {
    Object.defineProperty(window, "IntersectionObserver", {
      writable: true,
      value: IntersectionObserverStub,
    });
  }
}
