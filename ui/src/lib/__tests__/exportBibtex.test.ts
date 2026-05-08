import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  buildBibtex,
  downloadBibtex,
  PVL_CITATION,
  TANGO_CITATION,
  S4PRED_CITATION,
  HAMODRAKAS_CITATION,
} from "../exportBibtex";

describe("buildBibtex", () => {
  it("includes all four citations by default", () => {
    const out = buildBibtex();
    expect(out).toContain("@software{pvl2026,");
    expect(out).toContain("@article{tango2004,");
    expect(out).toContain("@article{s4pred2021,");
    expect(out).toContain("@article{hamodrakas2007,");
  });

  it("respects subset selection", () => {
    const out = buildBibtex(["pvl", "tango"]);
    expect(out).toContain("@software{pvl2026,");
    expect(out).toContain("@article{tango2004,");
    expect(out).not.toContain("@article{s4pred2021,");
    expect(out).not.toContain("@article{hamodrakas2007,");
  });

  it("emits a header comment listing methods cited", () => {
    const out = buildBibtex(["pvl"]);
    expect(out.startsWith("% PVL")).toBe(true);
    expect(out).toContain("Methods cited: pvl");
  });

  it("emits ISO 8601 generated timestamp", () => {
    const out = buildBibtex();
    expect(out).toMatch(/% Generated: \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it("matches canonical citation strings exactly", () => {
    expect(PVL_CITATION).toContain("Azaizah, Said");
    expect(PVL_CITATION).toContain("Ragonis-Bachar, Peleg");
    expect(PVL_CITATION).toContain("Golubev, Aleksandr");
    expect(TANGO_CITATION).toContain("Fernandez-Escamilla");
    expect(TANGO_CITATION).toContain("10.1038/nbt1012");
    expect(S4PRED_CITATION).toContain("Moffat, Lewis");
    expect(S4PRED_CITATION).toContain("10.1093/bioinformatics/btab491");
    expect(HAMODRAKAS_CITATION).toContain("Hamodrakas, Stavros J.");
    expect(HAMODRAKAS_CITATION).toContain("10.1016/j.ijbiomac.2007.03.008");
  });

  it("returns a non-empty string when given an empty methods array", () => {
    const out = buildBibtex([]);
    expect(out).toContain("% PVL");
    expect(out).toContain("Methods cited:");
    expect(out).not.toContain("@software");
    expect(out).not.toContain("@article");
  });
});

describe("downloadBibtex", () => {
  let createElementSpy: ReturnType<typeof vi.spyOn>;
  let createObjectURLSpy: ReturnType<typeof vi.spyOn>;
  let revokeObjectURLSpy: ReturnType<typeof vi.spyOn>;
  let appendChildSpy: ReturnType<typeof vi.spyOn>;
  let removeChildSpy: ReturnType<typeof vi.spyOn>;
  let mockLink: HTMLAnchorElement;

  beforeEach(() => {
    mockLink = document.createElement("a");
    mockLink.click = vi.fn();
    const realCreateElement = document.createElement.bind(document);
    createElementSpy = vi
      .spyOn(document, "createElement")
      .mockImplementation((tag: string) => {
        if (tag === "a") return mockLink;
        return realCreateElement(tag);
      });
    createObjectURLSpy = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:fake-url");
    revokeObjectURLSpy = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    appendChildSpy = vi.spyOn(document.body, "appendChild").mockImplementation((n) => n);
    removeChildSpy = vi.spyOn(document.body, "removeChild").mockImplementation((n) => n);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("creates an anchor with default filename PVL_methods.bib", () => {
    downloadBibtex();
    expect(createElementSpy).toHaveBeenCalledWith("a");
    expect(mockLink.download).toBe("PVL_methods.bib");
    expect(mockLink.click).toHaveBeenCalled();
  });

  it("respects custom filename", () => {
    downloadBibtex(["pvl"], "my_paper.bib");
    expect(mockLink.download).toBe("my_paper.bib");
  });

  it("creates and revokes a blob URL", () => {
    downloadBibtex();
    expect(createObjectURLSpy).toHaveBeenCalledOnce();
    expect(revokeObjectURLSpy).toHaveBeenCalledOnce();
  });

  it("appends and removes the anchor from the DOM", () => {
    downloadBibtex();
    expect(appendChildSpy).toHaveBeenCalledOnce();
    expect(removeChildSpy).toHaveBeenCalledOnce();
  });
});
