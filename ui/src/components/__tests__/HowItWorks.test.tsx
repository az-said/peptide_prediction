/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { HowItWorks } from "../HowItWorks";

describe("HowItWorks", () => {
  it("renders the section with heading", () => {
    render(<HowItWorks />);
    expect(screen.getByTestId("how-it-works")).toBeInTheDocument();
    expect(screen.getByText("How It Works")).toBeInTheDocument();
    expect(
      screen.getByText(/From sequence to publication in four steps/),
    ).toBeInTheDocument();
  });

  // 2026-06-07: step 2 split into 2a + 2b per Peleg's Zoom comment that
  // FF-Helix is downstream of S4PRED + TANGO outputs (not parallel).
  it("renders all step cards including split 2a + 2b", () => {
    render(<HowItWorks />);
    expect(screen.getByTestId("how-step-1")).toBeInTheDocument();
    expect(screen.getByTestId("how-step-2a")).toBeInTheDocument();
    expect(screen.getByTestId("how-step-2b")).toBeInTheDocument();
    expect(screen.getByTestId("how-step-3")).toBeInTheDocument();
    expect(screen.getByTestId("how-step-4")).toBeInTheDocument();
  });

  it("renders step titles", () => {
    render(<HowItWorks />);
    expect(screen.getByText("Paste or Upload")).toBeInTheDocument();
    expect(screen.getByText(/Run S4PRED \+ TANGO \+ biochem/)).toBeInTheDocument();
    expect(
      screen.getByText(/Apply Ragonis-Bachar \/ Rayan classification rules/),
    ).toBeInTheDocument();
    expect(screen.getByText("Interactive Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Export & Cite")).toBeInTheDocument();
  });

  it("renders step numbers", () => {
    render(<HowItWorks />);
    expect(screen.getByText("Step 1")).toBeInTheDocument();
    expect(screen.getByText("Step 2a")).toBeInTheDocument();
    expect(screen.getByText("Step 2b")).toBeInTheDocument();
    expect(screen.getByText("Step 3")).toBeInTheDocument();
    expect(screen.getByText("Step 4")).toBeInTheDocument();
  });

  it("renders step descriptions", () => {
    render(<HowItWorks />);
    expect(screen.getByText(/Single sequence, CSV batch/)).toBeInTheDocument();
    expect(screen.getByText(/Three independent inputs run in parallel/)).toBeInTheDocument();
    expect(screen.getByText(/Peleg's gap-smoothed segment finder/)).toBeInTheDocument();
    expect(screen.getByText(/Classification sets/)).toBeInTheDocument();
    expect(screen.getByText(/publication-ready figure pack/)).toBeInTheDocument();
  });

  it("accepts className prop", () => {
    render(<HowItWorks className="my-custom-class" />);
    expect(screen.getByTestId("how-it-works")).toHaveClass("my-custom-class");
  });
});
