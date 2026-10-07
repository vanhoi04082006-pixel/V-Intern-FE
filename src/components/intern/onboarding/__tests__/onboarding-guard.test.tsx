import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { InternOnboardingGuard } from "../onboarding-guard";
import { fetchCurrentUser } from "@/lib/auth/auth-service";
const replace = vi.fn();
const router = { replace };
vi.mock("next/navigation", () => ({ useRouter: () => router }));
vi.mock("@/lib/auth/auth-service", () => ({ fetchCurrentUser: vi.fn() }));
afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});
describe("onboarding has no auth bypass", () => {
  it.each(["development", "production", "test"])(
    "%s still requires backend principal",
    async (env) => {
      vi.stubEnv("NODE_ENV", env);
      vi.mocked(fetchCurrentUser).mockResolvedValue(null);
      render(
        <InternOnboardingGuard>protected onboarding</InternOnboardingGuard>,
      );
      await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
      expect(
        screen.queryByText("protected onboarding"),
      ).not.toBeInTheDocument();
    },
  );
});
