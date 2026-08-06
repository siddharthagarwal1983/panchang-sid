import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SignInGate } from "./SignInGate";

const auth = vi.hoisted(() => ({ user: null as unknown, loading: false }));

vi.mock("@/lib/auth", () => ({ useAuth: () => auth }));
vi.mock("@tanstack/react-router", () => ({
  useRouterState: () => "/",
  Link: ({ children, to, onClick }: { children: React.ReactNode; to: string; onClick?: () => void }) => (
    <a href={to} onClick={onClick}>
      {children}
    </a>
  ),
}));
vi.mock("@/lib/analytics/auth-funnel", () => ({ trackAuthFunnel: vi.fn() }));

function renderGate() {
  return render(
    <SignInGate title="Sign in to see the full panchāṅga" description="Protected details">
      <p>protected content</p>
    </SignInGate>,
  );
}

describe("SignInGate", () => {
  it("hides protected content from signed-out visitors", () => {
    auth.user = null;
    auth.loading = false;
    renderGate();
    expect(screen.queryByText("protected content")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /sign in/i })).toBeInTheDocument();
  });

  it("hides protected content while the session is still resolving", () => {
    auth.user = null;
    auth.loading = true;
    renderGate();
    expect(screen.queryByText("protected content")).not.toBeInTheDocument();
  });

  it("renders protected content once signed in", () => {
    auth.user = { id: "u1" };
    auth.loading = false;
    renderGate();
    expect(screen.getByText("protected content")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /sign in/i })).not.toBeInTheDocument();
  });
});
