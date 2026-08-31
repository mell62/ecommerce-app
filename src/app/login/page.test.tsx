import { render } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";
import LoginPage from "./page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

describe("LoginPage accessibility", () => {
  it("has no detectable accessibility violations", async () => {
    const { container } = render(<LoginPage />);

    const results = await axe(container);

    expect(results.violations).toHaveLength(0);
  });
});
