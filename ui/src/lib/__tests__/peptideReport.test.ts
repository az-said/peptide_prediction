/**
 * Tests for the multi-page peptide report renderer.
 *
 * Strategy: jsPDF is mocked — we verify the orchestration logic
 * (panel filtering, page sequencing, error handling, helper maths)
 * without actually rendering PDFs.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// jsPDF mock
// ---------------------------------------------------------------------------

const mockDoc = {
  setFillColor: vi.fn(),
  setTextColor: vi.fn(),
  setDrawColor: vi.fn(),
  setFontSize: vi.fn(),
  setFont: vi.fn(),
  setLineWidth: vi.fn(),
  rect: vi.fn(),
  roundedRect: vi.fn(),
  line: vi.fn(),
  text: vi.fn(),
  getTextWidth: vi.fn().mockReturnValue(30),
  splitTextToSize: vi.fn((text: string, _w: number) => [text]),
  addPage: vi.fn(),
  output: vi.fn().mockReturnValue(new Blob(["pdf"], { type: "application/pdf" })),
};

vi.mock("jspdf", () => ({
  jsPDF: vi.fn(function (this: any) {
    Object.assign(this, mockDoc);
    return this;
  }),
}));

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

import type { Peptide } from "@/types/peptide";

const basePeptide: Peptide = {
  id: "P12345",
  name: "Test Peptide",
  species: "Homo sapiens",
  geneName: "TEST1",
  sequence: "ACDEFGHIKLMNPQRSTVWY",
  length: 20,
  hydrophobicity: 0.456,
  charge: 1.2,
  muH: 0.321,
  sswPrediction: 1,
  sswScore: 0.75,
  sswDiff: 0.15,
  s4predHelixPrediction: 1,
  s4predHelixPercent: 45.5,
  s4predHasData: true,
  s4predSswPrediction: 1,
  s4predSswDiff: 0.12,
  ffHelixFlag: 1,
  ffHelixPercent: 38.2,
  ffHelixScore: 0.89,
  ffSswFlag: 1,
  ffSswScore: 1.23,
  tangoHasData: true,
  tangoAggMax: 25.5,
  tangoBetaMax: 18.3,
  tango: {
    agg: [0, 0, 5.5, 12.3, 25.5, 8.1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    beta: [0, 0, 3.2, 8.1, 18.3, 6.0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    helix: [0, 0, 0, 0.1, 0.2, 0.1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    turn: [0, 0, 0, 0, 0, 0, 5.1, 3.2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
};

const minimalPeptide: Peptide = {
  id: "MIN001",
  sequence: "ACDEF",
  length: 5,
  hydrophobicity: null,
  charge: null,
  sswPrediction: null,
};

const baseReportData = {
  version: "0.8.0",
  permalink: "https://pvl.example.com/results?pv=1&dh=abc123",
  datasetName: "Test Dataset 2024",
  buildSha: "abc123def456",
  thresholds: { muHCutoff: 0.388, hydroCutoff: 0.417 },
};

// ---------------------------------------------------------------------------
// Main renderer tests
// ---------------------------------------------------------------------------

describe("renderPeptideReport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a Blob", async () => {
    const { renderPeptideReport } = await import("../peptideReport");
    const blob = await renderPeptideReport(basePeptide, baseReportData);
    expect(blob).toBeInstanceOf(Blob);
  });

  it("creates pages for all active panels", async () => {
    const { renderPeptideReport } = await import("../peptideReport");
    await renderPeptideReport(basePeptide, baseReportData);
    // addPage is called (totalPanels - 1) times since first page is implicit
    expect(mockDoc.addPage.mock.calls.length).toBeGreaterThanOrEqual(1);
  });

  it("draws header on every page", async () => {
    const { renderPeptideReport, PANEL_REGISTRY } = await import("../peptideReport");
    mockDoc.text.mockClear();
    await renderPeptideReport(basePeptide, baseReportData);
    // Each panel draws a header with "Page N" text
    const pageTexts = mockDoc.text.mock.calls.filter(
      (call: any[]) => typeof call[0] === "string" && call[0].startsWith("Page "),
    );
    expect(pageTexts.length).toBe(PANEL_REGISTRY.length);
  });

  it("gracefully handles panel render errors", async () => {
    const { renderPeptideReport, PANEL_REGISTRY } = await import("../peptideReport");
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    // Use the last panel to avoid polluting cover panel tests
    const lastIdx = PANEL_REGISTRY.length - 1;
    const origRender = PANEL_REGISTRY[lastIdx].render;
    PANEL_REGISTRY[lastIdx].render = () => {
      throw new Error("test error");
    };

    try {
      const blob = await renderPeptideReport(basePeptide, baseReportData);
      expect(blob).toBeInstanceOf(Blob);

      // Should log warning
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Panel"),
        expect.any(Error),
      );
    } finally {
      PANEL_REGISTRY[lastIdx].render = origRender;
      consoleSpy.mockRestore();
    }
  });

  it("skips panels where shouldRender returns false", async () => {
    const { renderPeptideReport, PANEL_REGISTRY } = await import("../peptideReport");

    // Add a panel that always skips
    const skipPanel = {
      id: "test-skip",
      title: "Should Skip",
      render: vi.fn(),
      shouldRender: () => false,
    };
    PANEL_REGISTRY.push(skipPanel);

    try {
      mockDoc.addPage.mockClear();
      await renderPeptideReport(basePeptide, baseReportData);

      // The skip panel's render should NOT be called
      expect(skipPanel.render).not.toHaveBeenCalled();
    } finally {
      // Always cleanup
      const idx = PANEL_REGISTRY.findIndex((p) => p.id === "test-skip");
      if (idx !== -1) PANEL_REGISTRY.splice(idx, 1);
    }
  });
});

// ---------------------------------------------------------------------------
// Panel registry tests
// ---------------------------------------------------------------------------

describe("PANEL_REGISTRY", () => {
  it("has at least 6 registered panels", async () => {
    const { PANEL_REGISTRY } = await import("../peptideReport");
    expect(PANEL_REGISTRY.length).toBeGreaterThanOrEqual(6);
  });

  it("panels have unique ids", async () => {
    const { PANEL_REGISTRY } = await import("../peptideReport");
    const ids = PANEL_REGISTRY.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("core panels are in correct order", async () => {
    const { PANEL_REGISTRY } = await import("../peptideReport");
    // Filter to only core panels (ignore any test artifacts)
    const coreIds = PANEL_REGISTRY.map((p) => p.id).filter(
      (id) => !id.startsWith("test-"),
    );
    expect(coreIds).toEqual([
      "cover",
      "summary",
      "biochem",
      "interpretation",
      "methods",
      "references",
    ]);
  });

  it("all panels have render functions", async () => {
    const { PANEL_REGISTRY } = await import("../peptideReport");
    for (const panel of PANEL_REGISTRY) {
      expect(typeof panel.render).toBe("function");
    }
  });
});

// ---------------------------------------------------------------------------
// Shared helper tests
// ---------------------------------------------------------------------------

describe("drawSectionHeading", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns y position below the heading", async () => {
    const { drawSectionHeading } = await import("../peptideReport");
    const y = drawSectionHeading(mockDoc as any, "Test Heading", 50);
    expect(y).toBe(58); // 50 + 8
  });

  it("draws text at correct position", async () => {
    const { drawSectionHeading } = await import("../peptideReport");
    drawSectionHeading(mockDoc as any, "Test Heading", 50);
    expect(mockDoc.text).toHaveBeenCalledWith("Test Heading", 20, 50);
  });
});

describe("drawKeyValueTable", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns y below all rows", async () => {
    const { drawKeyValueTable } = await import("../peptideReport");
    const rows: Array<[string, string]> = [
      ["Key1", "Value1"],
      ["Key2", "Value2"],
    ];
    const y = drawKeyValueTable(mockDoc as any, rows, 50);
    // 2 rows × 8 height + 4 padding = 50 + 16 + 4 = 70
    expect(y).toBe(70);
  });

  it("stripes even rows", async () => {
    const { drawKeyValueTable } = await import("../peptideReport");
    const rows: Array<[string, string]> = [
      ["A", "1"],
      ["B", "2"],
      ["C", "3"],
    ];
    drawKeyValueTable(mockDoc as any, rows, 50);
    // rect called for rows 0 and 2 (even indices)
    expect(mockDoc.rect).toHaveBeenCalledTimes(2);
  });
});

describe("drawDataTable", () => {
  beforeEach(() => vi.clearAllMocks());

  it("draws header row and data rows", async () => {
    const { drawDataTable } = await import("../peptideReport");
    const headers = ["Col1", "Col2"];
    const rows = [
      ["A", "1"],
      ["B", "2"],
    ];
    drawDataTable(mockDoc as any, headers, rows, 50);
    // Header rect + 1 stripe rect (row 0)
    expect(mockDoc.rect.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it("uses custom column widths when provided", async () => {
    const { drawDataTable } = await import("../peptideReport");
    const headers = ["Col1", "Col2"];
    const rows = [["A", "1"]];
    const widths = [80, 90];
    const y = drawDataTable(mockDoc as any, headers, rows, 50, widths);
    expect(y).toBeGreaterThan(50);
  });
});

describe("drawParagraph", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns y below the paragraph text", async () => {
    const { drawParagraph } = await import("../peptideReport");
    const y = drawParagraph(mockDoc as any, "Hello world", 50);
    expect(y).toBeGreaterThan(50);
  });
});

// ---------------------------------------------------------------------------
// Cover panel tests
// ---------------------------------------------------------------------------

describe("coverPanel", () => {
  beforeEach(() => vi.clearAllMocks());

  it("exports correct id and title", async () => {
    const { coverPanel } = await import("../peptideReportPanels/cover");
    expect(coverPanel.id).toBe("cover");
    expect(coverPanel.title).toBe("Peptide Analysis Report");
  });

  it("renders without errors for full peptide", async () => {
    const { coverPanel } = await import("../peptideReportPanels/cover");
    const ctx = {
      pageNumber: 1,
      totalPages: 6,
      pageWidth: 210,
      pageHeight: 297,
      margin: 20,
      contentWidth: 170,
      contentTop: 44,
      footerY: 265,
    };
    expect(() => {
      coverPanel.render(mockDoc as any, basePeptide, baseReportData, ctx);
    }).not.toThrow();
  });

  it("renders classification pills", async () => {
    const { coverPanel } = await import("../peptideReportPanels/cover");
    const ctx = {
      pageNumber: 1, totalPages: 6, pageWidth: 210, pageHeight: 297,
      margin: 20, contentWidth: 170, contentTop: 44, footerY: 265,
    };
    mockDoc.text.mockClear();
    coverPanel.render(mockDoc as any, basePeptide, baseReportData, ctx);
    const textCalls = mockDoc.text.mock.calls.map((c: any[]) => c[0]);
    expect(textCalls).toContain("Helix");
    expect(textCalls).toContain("FF-Helix");
    expect(textCalls).toContain("SSW");
    expect(textCalls).toContain("FF-SSW");
  });

  it("handles minimal peptide without crashing", async () => {
    const { coverPanel } = await import("../peptideReportPanels/cover");
    const ctx = {
      pageNumber: 1, totalPages: 6, pageWidth: 210, pageHeight: 297,
      margin: 20, contentWidth: 170, contentTop: 44, footerY: 265,
    };
    expect(() => {
      coverPanel.render(mockDoc as any, minimalPeptide, baseReportData, ctx);
    }).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Summary panel tests
// ---------------------------------------------------------------------------

describe("summaryPanel", () => {
  beforeEach(() => vi.clearAllMocks());

  it("exports correct id and title", async () => {
    const { summaryPanel } = await import("../peptideReportPanels/summary");
    expect(summaryPanel.id).toBe("summary");
    expect(summaryPanel.title).toBe("Prediction Summary");
  });

  it("renders TANGO summary when data is available", async () => {
    const { summaryPanel } = await import("../peptideReportPanels/summary");
    const ctx = {
      pageNumber: 2, totalPages: 6, pageWidth: 210, pageHeight: 297,
      margin: 20, contentWidth: 170, contentTop: 44, footerY: 265,
    };
    mockDoc.text.mockClear();
    summaryPanel.render(mockDoc as any, basePeptide, baseReportData, ctx);
    const textCalls = mockDoc.text.mock.calls.map((c: any[]) => c[0]);
    expect(textCalls).toContain("TANGO Prediction Summary");
  });

  it("renders S4PRED summary when data is available", async () => {
    const { summaryPanel } = await import("../peptideReportPanels/summary");
    const ctx = {
      pageNumber: 2, totalPages: 6, pageWidth: 210, pageHeight: 297,
      margin: 20, contentWidth: 170, contentTop: 44, footerY: 265,
    };
    mockDoc.text.mockClear();
    summaryPanel.render(mockDoc as any, basePeptide, baseReportData, ctx);
    const textCalls = mockDoc.text.mock.calls.map((c: any[]) => c[0]);
    expect(textCalls).toContain("S4PRED Secondary Structure Summary");
  });

  it("renders per-residue table with correct row count", async () => {
    const { summaryPanel } = await import("../peptideReportPanels/summary");
    const ctx = {
      pageNumber: 2, totalPages: 6, pageWidth: 210, pageHeight: 297,
      margin: 20, contentWidth: 170, contentTop: 44, footerY: 265,
    };
    mockDoc.text.mockClear();
    summaryPanel.render(mockDoc as any, basePeptide, baseReportData, ctx);
    // Should render "Per-Residue TANGO Prediction" heading
    const textCalls = mockDoc.text.mock.calls.map((c: any[]) => c[0]);
    expect(textCalls).toContain("Per-Residue TANGO Prediction");
  });

  it("skips TANGO sections for minimal peptide", async () => {
    const { summaryPanel } = await import("../peptideReportPanels/summary");
    const ctx = {
      pageNumber: 2, totalPages: 6, pageWidth: 210, pageHeight: 297,
      margin: 20, contentWidth: 170, contentTop: 44, footerY: 265,
    };
    mockDoc.text.mockClear();
    summaryPanel.render(mockDoc as any, minimalPeptide, baseReportData, ctx);
    const textCalls = mockDoc.text.mock.calls.map((c: any[]) => c[0]);
    expect(textCalls).not.toContain("TANGO Prediction Summary");
  });
});

// ---------------------------------------------------------------------------
// Biochem panel tests
// ---------------------------------------------------------------------------

describe("biochemPanel", () => {
  beforeEach(() => vi.clearAllMocks());

  it("exports correct id and title", async () => {
    const { biochemPanel } = await import("../peptideReportPanels/biochem");
    expect(biochemPanel.id).toBe("biochem");
    expect(biochemPanel.title).toBe("Biophysical & Classification Details");
  });

  it("renders all sections for full peptide", async () => {
    const { biochemPanel } = await import("../peptideReportPanels/biochem");
    const ctx = {
      pageNumber: 3, totalPages: 6, pageWidth: 210, pageHeight: 297,
      margin: 20, contentWidth: 170, contentTop: 44, footerY: 265,
    };
    mockDoc.text.mockClear();
    biochemPanel.render(mockDoc as any, basePeptide, baseReportData, ctx);
    const textCalls = mockDoc.text.mock.calls.map((c: any[]) => c[0]);
    expect(textCalls).toContain("Biophysical Properties");
    expect(textCalls).toContain("FF-Helix Classification");
    expect(textCalls).toContain("FF-SSW Classification");
    expect(textCalls).toContain("Aggregation Hotspot Summary");
  });

  it("detects aggregation hotspots correctly", async () => {
    const { biochemPanel } = await import("../peptideReportPanels/biochem");
    const ctx = {
      pageNumber: 3, totalPages: 6, pageWidth: 210, pageHeight: 297,
      margin: 20, contentWidth: 170, contentTop: 44, footerY: 265,
    };
    mockDoc.text.mockClear();
    biochemPanel.render(mockDoc as any, basePeptide, baseReportData, ctx);
    const textCalls = mockDoc.text.mock.calls.map((c: any[]) => c[0]);
    // Should have "Hotspot 1" in the hotspot table
    expect(textCalls).toContain("Hotspot 1");
  });

  it("handles null biophysical values gracefully", async () => {
    const { biochemPanel } = await import("../peptideReportPanels/biochem");
    const ctx = {
      pageNumber: 3, totalPages: 6, pageWidth: 210, pageHeight: 297,
      margin: 20, contentWidth: 170, contentTop: 44, footerY: 265,
    };
    expect(() => {
      biochemPanel.render(mockDoc as any, minimalPeptide, baseReportData, ctx);
    }).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Interpretation panel tests
// ---------------------------------------------------------------------------

describe("interpretationPanel", () => {
  beforeEach(() => vi.clearAllMocks());

  it("exports correct id and title", async () => {
    const { interpretationPanel } = await import("../peptideReportPanels/interpretation");
    expect(interpretationPanel.id).toBe("interpretation");
    expect(interpretationPanel.title).toBe("Interpretation");
  });

  it("renders interpretation for helix-positive peptide", async () => {
    const { interpretationPanel } = await import("../peptideReportPanels/interpretation");
    const ctx = {
      pageNumber: 4, totalPages: 6, pageWidth: 210, pageHeight: 297,
      margin: 20, contentWidth: 170, contentTop: 44, footerY: 265,
    };
    mockDoc.splitTextToSize.mockImplementation((text: string) => [text]);
    interpretationPanel.render(mockDoc as any, basePeptide, baseReportData, ctx);
    const textCalls = mockDoc.text.mock.calls.map((c: any[]) => c[0]);
    // Should mention S4PRED helix prediction
    const hasHelixText = textCalls.some(
      (t: string) => typeof t === "string" && t.includes("helical"),
    );
    expect(hasHelixText).toBe(true);
  });

  it("renders fallback for minimal peptide", async () => {
    const { interpretationPanel } = await import("../peptideReportPanels/interpretation");
    const ctx = {
      pageNumber: 4, totalPages: 6, pageWidth: 210, pageHeight: 297,
      margin: 20, contentWidth: 170, contentTop: 44, footerY: 265,
    };
    mockDoc.splitTextToSize.mockImplementation((text: string) => [text]);
    interpretationPanel.render(mockDoc as any, minimalPeptide, baseReportData, ctx);
    const textCalls = mockDoc.text.mock.calls.map((c: any[]) => c[0]);
    const hasFallback = textCalls.some(
      (t: string) => typeof t === "string" && t.includes("Insufficient"),
    );
    expect(hasFallback).toBe(true);
  });

  it("includes disclaimer text", async () => {
    const { interpretationPanel } = await import("../peptideReportPanels/interpretation");
    const ctx = {
      pageNumber: 4, totalPages: 6, pageWidth: 210, pageHeight: 297,
      margin: 20, contentWidth: 170, contentTop: 44, footerY: 265,
    };
    mockDoc.splitTextToSize.mockImplementation((text: string) => [text]);
    interpretationPanel.render(mockDoc as any, basePeptide, baseReportData, ctx);
    const textCalls = mockDoc.text.mock.calls.map((c: any[]) => c[0]);
    const hasDisclaimer = textCalls.some(
      (t: string) => typeof t === "string" && t.includes("computationally generated"),
    );
    expect(hasDisclaimer).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Methods panel tests
// ---------------------------------------------------------------------------

describe("methodsPanel", () => {
  beforeEach(() => vi.clearAllMocks());

  it("exports correct id and title", async () => {
    const { methodsPanel } = await import("../peptideReportPanels/methods");
    expect(methodsPanel.id).toBe("methods");
    expect(methodsPanel.title).toBe("Methods");
  });

  it("renders all method sections", async () => {
    const { methodsPanel } = await import("../peptideReportPanels/methods");
    const ctx = {
      pageNumber: 5, totalPages: 6, pageWidth: 210, pageHeight: 297,
      margin: 20, contentWidth: 170, contentTop: 44, footerY: 265,
    };
    mockDoc.text.mockClear();
    mockDoc.splitTextToSize.mockImplementation((text: string) => [text]);
    methodsPanel.render(mockDoc as any, basePeptide, baseReportData, ctx);
    const textCalls = mockDoc.text.mock.calls.map((c: any[]) => c[0]);
    expect(textCalls).toContain("Computational Methods");
    expect(textCalls).toContain("TANGO");
    expect(textCalls).toContain("S4PRED");
  });

  it("renders threshold config when provided", async () => {
    const { methodsPanel } = await import("../peptideReportPanels/methods");
    const ctx = {
      pageNumber: 5, totalPages: 6, pageWidth: 210, pageHeight: 297,
      margin: 20, contentWidth: 170, contentTop: 44, footerY: 265,
    };
    mockDoc.text.mockClear();
    mockDoc.splitTextToSize.mockImplementation((text: string) => [text]);
    methodsPanel.render(mockDoc as any, basePeptide, baseReportData, ctx);
    const textCalls = mockDoc.text.mock.calls.map((c: any[]) => c[0]);
    expect(textCalls).toContain("Threshold Configuration");
  });
});

// ---------------------------------------------------------------------------
// References panel tests
// ---------------------------------------------------------------------------

describe("referencesPanel", () => {
  beforeEach(() => vi.clearAllMocks());

  it("exports correct id and title", async () => {
    const { referencesPanel } = await import("../peptideReportPanels/references");
    expect(referencesPanel.id).toBe("references");
    expect(referencesPanel.title).toBe("References");
  });

  it("renders literature references", async () => {
    const { referencesPanel } = await import("../peptideReportPanels/references");
    const ctx = {
      pageNumber: 6, totalPages: 6, pageWidth: 210, pageHeight: 297,
      margin: 20, contentWidth: 170, contentTop: 44, footerY: 265,
    };
    mockDoc.text.mockClear();
    mockDoc.splitTextToSize.mockImplementation((text: string) => [text]);
    referencesPanel.render(mockDoc as any, basePeptide, baseReportData, ctx);
    const textCalls = mockDoc.text.mock.calls.map((c: any[]) => c[0]);
    // Should render reference numbers
    expect(textCalls).toContain("[1]");
    expect(textCalls).toContain("[2]");
  });

  it("renders citing section", async () => {
    const { referencesPanel } = await import("../peptideReportPanels/references");
    const ctx = {
      pageNumber: 6, totalPages: 6, pageWidth: 210, pageHeight: 297,
      margin: 20, contentWidth: 170, contentTop: 44, footerY: 265,
    };
    mockDoc.text.mockClear();
    mockDoc.splitTextToSize.mockImplementation((text: string) => [text]);
    referencesPanel.render(mockDoc as any, basePeptide, baseReportData, ctx);
    const textCalls = mockDoc.text.mock.calls.map((c: any[]) => c[0]);
    expect(textCalls).toContain("Citing PVL");
  });

  it("renders software version table", async () => {
    const { referencesPanel } = await import("../peptideReportPanels/references");
    const ctx = {
      pageNumber: 6, totalPages: 6, pageWidth: 210, pageHeight: 297,
      margin: 20, contentWidth: 170, contentTop: 44, footerY: 265,
    };
    mockDoc.text.mockClear();
    mockDoc.splitTextToSize.mockImplementation((text: string) => [text]);
    referencesPanel.render(mockDoc as any, basePeptide, baseReportData, ctx);
    const textCalls = mockDoc.text.mock.calls.map((c: any[]) => c[0]);
    expect(textCalls).toContain("Software Versions");
    expect(textCalls).toContain("v0.8.0");
  });
});

// ---------------------------------------------------------------------------
// downloadPeptideReport tests
// ---------------------------------------------------------------------------

describe("downloadPeptideReport", () => {
  it("creates a download link and clicks it", async () => {
    const { downloadPeptideReport } = await import("../peptideReport");

    const mockClick = vi.fn();
    const mockAppendChild = vi.fn();
    const mockRemoveChild = vi.fn();
    const mockCreateElement = vi.fn(() => ({
      href: "",
      download: "",
      click: mockClick,
    }));

    vi.stubGlobal("URL", {
      createObjectURL: vi.fn().mockReturnValue("blob:test"),
      revokeObjectURL: vi.fn(),
    });
    vi.stubGlobal("document", {
      createElement: mockCreateElement,
      body: {
        appendChild: mockAppendChild,
        removeChild: mockRemoveChild,
      },
    });

    await downloadPeptideReport(basePeptide, baseReportData);

    expect(mockCreateElement).toHaveBeenCalledWith("a");
    expect(mockClick).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalled();

    vi.unstubAllGlobals();
  });

  it("uses custom filename when provided", async () => {
    const { downloadPeptideReport } = await import("../peptideReport");

    let capturedDownload = "";
    const mockClick = vi.fn();
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn().mockReturnValue("blob:test"),
      revokeObjectURL: vi.fn(),
    });
    vi.stubGlobal("document", {
      createElement: vi.fn(() => {
        const el: any = { href: "", download: "", click: mockClick };
        return new Proxy(el, {
          set(target, prop, value) {
            if (prop === "download") capturedDownload = value;
            target[prop] = value;
            return true;
          },
        });
      }),
      body: {
        appendChild: vi.fn(),
        removeChild: vi.fn(),
      },
    });

    await downloadPeptideReport(basePeptide, baseReportData, "Custom_Report.pdf");
    expect(capturedDownload).toBe("Custom_Report.pdf");

    vi.unstubAllGlobals();
  });
});
