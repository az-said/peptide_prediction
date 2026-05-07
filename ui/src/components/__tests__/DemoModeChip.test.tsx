/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DemoModeChip } from "../DemoModeChip";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

// Mock framer-motion to render children synchronously
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("DemoModeChip", () => {
  const defaultProps = {
    isDemo: true,
    isDemoLoading: false,
    isChipDismissed: false,
    clearDemo: vi.fn(),
    dismissChip: vi.fn(),
  };

  it("renders when isDemo is true and not dismissed", () => {
    render(<DemoModeChip {...defaultProps} />);
    expect(screen.getByTestId("demo-mode-chip")).toBeInTheDocument();
    expect(screen.getByText(/Demo data: Staphylococcus 2023/)).toBeInTheDocument();
    expect(screen.getByText(/2,916 peptides/)).toBeInTheDocument();
  });

  it("shows loading state when isDemoLoading", () => {
    render(
      <DemoModeChip {...defaultProps} isDemo={false} isDemoLoading={true} />,
    );
    expect(screen.getByText(/Loading demo dataset/)).toBeInTheDocument();
  });

  it("does not render when isChipDismissed is true", () => {
    render(<DemoModeChip {...defaultProps} isChipDismissed={true} />);
    expect(screen.queryByTestId("demo-mode-chip")).not.toBeInTheDocument();
  });

  it("does not render when isDemo is false and not loading", () => {
    render(
      <DemoModeChip {...defaultProps} isDemo={false} isDemoLoading={false} />,
    );
    expect(screen.queryByTestId("demo-mode-chip")).not.toBeInTheDocument();
  });

  it("calls clearDemo and navigates on 'Use your own data' click", () => {
    const clearDemo = vi.fn();
    render(<DemoModeChip {...defaultProps} clearDemo={clearDemo} />);

    fireEvent.click(screen.getByTestId("demo-upload-cta"));
    expect(clearDemo).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith("/upload");
  });

  it("calls dismissChip on dismiss button click", () => {
    const dismissChip = vi.fn();
    render(<DemoModeChip {...defaultProps} dismissChip={dismissChip} />);

    fireEvent.click(screen.getByTestId("demo-chip-dismiss"));
    expect(dismissChip).toHaveBeenCalledTimes(1);
  });

  it("does not show dismiss button during loading", () => {
    render(
      <DemoModeChip {...defaultProps} isDemo={false} isDemoLoading={true} />,
    );
    expect(screen.queryByTestId("demo-chip-dismiss")).not.toBeInTheDocument();
  });
});
