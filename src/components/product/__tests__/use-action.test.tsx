import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useAction } from "../use-action";

describe("useAction duplicate submissions", () => {
  it("runs only one mutation when two clicks arrive before React commits", async () => {
    let finish!: () => void;
    const pending = new Promise<void>((resolve) => { finish = resolve; });
    const mutation = vi.fn(() => pending);
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useAction(onSuccess));
    let first!: Promise<boolean>, duplicate!: Promise<boolean>;
    act(() => {
      first = result.current.run(mutation);
      duplicate = result.current.run(mutation);
    });
    expect(mutation).toHaveBeenCalledTimes(1);
    expect(await duplicate).toBe(false);
    expect(result.current.busy).toBe(true);
    await act(async () => { finish(); await first; });
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(result.current.busy).toBe(false);
    await act(async () => { await result.current.run(mutation); });
    expect(mutation).toHaveBeenCalledTimes(2);
  });

  it("releases the mutation guard after failure so the user can retry", async () => {
    const mutation = vi.fn().mockRejectedValueOnce(new Error("conflict")).mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useAction());
    await act(async () => { expect(await result.current.run(mutation)).toBe(false); });
    expect(result.current.busy).toBe(false);
    expect(result.current.error).toBeInstanceOf(Error);
    await act(async () => { expect(await result.current.run(mutation)).toBe(true); });
    expect(result.current.error).toBeUndefined();
  });
});
