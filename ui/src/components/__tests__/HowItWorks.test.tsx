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
      screen.getByText(/From sequence to publication, step by step/),
    ).toBeInTheDocument();
  });

  // Peleg 2026-06-07 — step 2 split into 2a (raw predictors) + 2b (downstream
  // FF gates), so 5 cards instead of 4.
  it("renders 5 step cards including the 2a / 2b split", () => {
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
    expect(screen.getByText("Run Predictors")).toBeInTheDocument();
    expect(screen.getByText("Classify FF Candidates")).toBeInTheDocument();
    expect(screen.getByText("Interactive Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Export & Cite")).toBeInTheDocument();
  });

  it("renders step labels", () => {
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
    expect(screen.getByText(/S4PRED secondary structure, TANGO aggregation/)).toBeInTheDocument();
    // Downstream FF gates step — tooltip references dataset mean.
    expect(screen.getByText(/Apply dataset-derived gates/)).toBeInTheDocument();
    expect(screen.getByText(/Classification sets/)).toBeInTheDocument();
    expect(screen.getByText(/publication-ready figure pack/)).toBeInTheDocument();
  });

  // 2026-06-07 — Step 2b carries a `title` tooltip explaining the dataset-mean
  // gating, so reviewers see the threshold story without leaving the diagram.
  it("attaches the dataset-mean tooltip to step 2b", () => {
    render(<HowItWorks />);
    const step2b = screen.getByTestId("how-step-2b");
    expect(step2b.getAttribute("title") ?? "").toMatch(/dataset mean of the class-positive metric/);
  });

  it("accepts className prop", () => {
    render(<HowItWorks className="my-custom-class" />);
    expect(screen.getByTestId("how-it-works")).toHaveClass("my-custom-class");
  });
});
