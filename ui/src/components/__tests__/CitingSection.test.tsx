/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CitingSection } from "../CitingSection";

describe("CitingSection", () => {
  it("renders the section", () => {
    render(<CitingSection />);
    expect(screen.getByTestId("citing-section")).toBeInTheDocument();
    expect(screen.getByText("Citing PVL")).toBeInTheDocument();
  });

  it("renders BibTeX code block", () => {
    render(<CitingSection />);
    expect(screen.getByText(/pvl2026/)).toBeInTheDocument();
    expect(screen.getByText(/Azaizah, Said/)).toBeInTheDocument();
  });

  it("renders copy button", () => {
    render(<CitingSection />);
    expect(screen.getByTestId("copy-bibtex")).toBeInTheDocument();
    expect(screen.getByText("Copy")).toBeInTheDocument();
  });

  it("renders team credits", () => {
    render(<CitingSection />);
    expect(screen.getByText("Said Azaizah")).toBeInTheDocument();
    expect(screen.getByText("Dr. Peleg Ragonis-Bachar")).toBeInTheDocument();
    expect(screen.getByText("Dr. Aleksandr Golubev")).toBeInTheDocument();
  });

  it("renders open peer review link", () => {
    render(<CitingSection />);
    const link = screen.getByTestId("open-peer-review-link");
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", expect.stringContaining("github.com"));
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("copy button triggers clipboard write", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: { writeText },
    });

    render(<CitingSection />);
    fireEvent.click(screen.getByTestId("copy-bibtex"));

    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText).toHaveBeenCalledWith(
      expect.stringContaining("@software{pvl2026"),
    );
  });

  it("accepts className prop", () => {
    render(<CitingSection className="test-class" />);
    expect(screen.getByTestId("citing-section")).toHaveClass("test-class");
  });
});
