import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

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
        matches: false,
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
    disconnect(): void {}
    observe(): void {}
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
