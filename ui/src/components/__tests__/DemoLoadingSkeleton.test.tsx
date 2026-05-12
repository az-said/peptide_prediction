/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { DemoLoadingSkeleton } from "../DemoLoadingSkeleton";

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe("DemoLoadingSkeleton", () => {
  it("renders the skeleton root", () => {
    render(<DemoLoadingSkeleton />);
    const root = screen.getByTestId("demo-loading-skeleton");
    expect(root).toBeInTheDocument();
  });

  it("exposes ARIA loading semantics for assistive tech", () => {
    render(<DemoLoadingSkeleton />);
    const root = screen.getByTestId("demo-loading-skeleton");
    expect(root).toHaveAttribute("aria-busy", "true");
    expect(root).toHaveAttribute("aria-live", "polite");
    expect(root).toHaveAttribute("aria-label", "Loading demo dataset");
  });

  it("forwards extra className to the root", () => {
    render(<DemoLoadingSkeleton className="custom-padding" />);
    const root = screen.getByTestId("demo-loading-skeleton");
    expect(root.className).toContain("custom-padding");
  });

  it("renders KPI card row with 4 placeholders", () => {
    render(<DemoLoadingSkeleton />);
    const kpiRow = screen.getByTestId("skeleton-kpi-row");
    expect(kpiRow).toBeInTheDocument();
    expect(kpiRow.children).toHaveLength(4);
  });

  it("renders diagram and table skeleton sections", () => {
    render(<DemoLoadingSkeleton />);
    expect(screen.getByTestId("skeleton-diagram")).toBeInTheDocument();
    expect(screen.getByTestId("skeleton-table")).toBeInTheDocument();
  });
});
