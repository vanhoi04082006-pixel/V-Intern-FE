import { afterEach, describe, expect, it, vi } from "vitest";
import { trapDialogFocus } from "../dialog-focus";

afterEach(() => { vi.restoreAllMocks(); document.body.innerHTML = ""; });

describe("modal keyboard focus", () => {
  it("wraps Tab and Shift+Tab while excluding disabled and hidden controls", () => {
    document.body.innerHTML = '<dialog open><button id="first">First</button><button disabled>Disabled</button><div hidden><button>Hidden</button></div><button id="last">Last</button></dialog>';
    vi.spyOn(HTMLElement.prototype, "getClientRects").mockReturnValue([{}] as unknown as DOMRectList);
    const dialog = document.querySelector("dialog")!, first = document.getElementById("first")!, last = document.getElementById("last")!;
    const preventDefault = vi.fn();
    last.focus(); trapDialogFocus({ currentTarget: dialog, key: "Tab", shiftKey: false, preventDefault });
    expect(document.activeElement).toBe(first);
    first.focus(); trapDialogFocus({ currentTarget: dialog, key: "Tab", shiftKey: true, preventDefault });
    expect(document.activeElement).toBe(last);
    expect(preventDefault).toHaveBeenCalledTimes(2);
  });
  it("preserves ordinary Tab navigation and unrelated keys", () => {
    document.body.innerHTML = '<dialog open><button id="first">First</button><button id="last">Last</button></dialog>';
    vi.spyOn(HTMLElement.prototype, "getClientRects").mockReturnValue([{}] as unknown as DOMRectList);
    const dialog = document.querySelector("dialog")!, first = document.getElementById("first")!, preventDefault = vi.fn();
    first.focus(); trapDialogFocus({ currentTarget: dialog, key: "Tab", shiftKey: false, preventDefault });
    trapDialogFocus({ currentTarget: dialog, key: "Escape", shiftKey: false, preventDefault });
    expect(preventDefault).not.toHaveBeenCalled();
  });
});
