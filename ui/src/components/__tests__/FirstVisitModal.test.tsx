/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FirstVisitModal } from "../FirstVisitModal";

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

describe("FirstVisitModal", () => {
  it("renders when open is true", () => {
    render(<FirstVisitModal open={true} onDismiss={vi.fn()} />);
    expect(screen.getByTestId("first-visit-modal")).toBeInTheDocument();
    expect(
      screen.getByText(/Welcome to Peptide Visual Lab/),
    ).toBeInTheDocument();
  });

  it("does not render when open is false", () => {
    render(<FirstVisitModal open={false} onDismiss={vi.fn()} />);
    expect(screen.queryByTestId("first-visit-modal")).not.toBeInTheDocument();
  });

  it("shows dataset info in the body", () => {
    render(<FirstVisitModal open={true} onDismiss={vi.fn()} />);
    expect(screen.getByText(/Staphylococcus 2023/)).toBeInTheDocument();
    expect(screen.getByText(/2,916 peptides/)).toBeInTheDocument();
  });

  it("renders 3 highlighted features", () => {
    render(<FirstVisitModal open={true} onDismiss={vi.fn()} />);
    expect(screen.getByTestId("first-visit-features")).toBeInTheDocument();
    expect(screen.getByText("Multi-tool consensus")).toBeInTheDocument();
    expect(screen.getByText("Live 3D overlay")).toBeInTheDocument();
    expect(screen.getByText("Reproducible permalinks")).toBeInTheDocument();
  });

  it("calls onDismiss when 'Just let me explore' is clicked", () => {
    const onDismiss = vi.fn();
    render(<FirstVisitModal open={true} onDismiss={onDismiss} />);

    fireEvent.click(screen.getByTestId("first-visit-explore"));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("calls onDismiss when close × button is clicked", () => {
    const onDismiss = vi.fn();
    render(<FirstVisitModal open={true} onDismiss={onDismiss} />);

    fireEvent.click(screen.getByTestId("first-visit-close"));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("shows 'Take a tour' button when onTour is provided", () => {
    render(
      <FirstVisitModal open={true} onDismiss={vi.fn()} onTour={vi.fn()} />,
    );
    expect(screen.getByTestId("first-visit-tour")).toBeInTheDocument();
  });

  it("does NOT show 'Take a tour' button when onTour is absent", () => {
    render(<FirstVisitModal open={true} onDismiss={vi.fn()} />);
    expect(screen.queryByTestId("first-visit-tour")).not.toBeInTheDocument();
  });

  it("calls onTour and onDismiss when 'Take a tour' is clicked", () => {
    const onTour = vi.fn();
    const onDismiss = vi.fn();
    render(
      <FirstVisitModal open={true} onDismiss={onDismiss} onTour={onTour} />,
    );

    fireEvent.click(screen.getByTestId("first-visit-tour"));
    expect(onTour).toHaveBeenCalledTimes(1);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("dismisses when clicking backdrop", () => {
    const onDismiss = vi.fn();
    render(<FirstVisitModal open={true} onDismiss={onDismiss} />);

    fireEvent.click(screen.getByTestId("first-visit-backdrop"));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("has correct accessibility attributes", () => {
    render(<FirstVisitModal open={true} onDismiss={vi.fn()} />);
    const dialog = screen.getByTestId("first-visit-modal");
    expect(dialog).toHaveAttribute("role", "dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute(
      "aria-label",
      "Welcome to Peptide Visual Lab",
    );
  });

  it("renders value proposition text", () => {
    render(<FirstVisitModal open={true} onDismiss={vi.fn()} />);
    expect(
      screen.getByText(/PVL combines TANGO, S4PRED, and AlphaFold/),
    ).toBeInTheDocument();
  });
});
