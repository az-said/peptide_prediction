import { describe, it, expect } from "vitest";
import {
  encodePermalink,
  decodePermalink,
  encodePermalinkURL,
  computeDatasetHash,
  computeShortHash,
  generatePlainCitation,
  generateBibTeX,
  generateRIS,
  PERMALINK_VERSION,
  type PermalinkState,
  type QueryMetadata,
  type CitationParams,
} from "../permalink";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const QUERY: QueryMetadata = {
  source: "uniprot",
  query: "amyloid AND reviewed:true",
  peptideCount: 16,
  timestamp: "2026-05-06T14:23:00Z",
  predictors: { s4pred: true, tango: true },
};

const THRESHOLDS = {
  muHCutoff: 0.507,
  hydroCutoff: 0.486,
  minSegmentLength: 3,
  maxGap: 2,
  minS4predHelixScore: 0.5,
  minHelixPercentContent: 20,
  s4predMaxHelixBetaDiff: 0.2,
  tangoMaxHelixBetaDiff: 0.2,
  minSsPercentContent: 20,
  aggThreshold: 5.0,
  percentOfLengthCutoff: 20.0,
  minSswResidues: 3,
  minPredictionPercent: 50.0,
};

const STATE: PermalinkState = {
  pv: PERMALINK_VERSION,
  datasetHash: "abc123def456",
  query: QUERY,
  thresholds: THRESHOLDS as any,
  pvlVersion: "0.1.2",
};

const CITATION_PARAMS: CitationParams = {
  version: "0.1.2",
  analysisId: "abc123def456",
  date: "2026-05-06",
  url: "https://pvl.example/results?pv=1&dh=abc123",
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("permalink", () => {
  describe("encode/decode round-trip", () => {
    it("round-trips a PermalinkState through URL params", () => {
      const params = encodePermalink(STATE);
      const decoded = decodePermalink(params);

      expect(decoded).not.toBeNull();
      expect(decoded!.pv).toBe(PERMALINK_VERSION);
      expect(decoded!.datasetHash).toBe("abc123def456");
      expect(decoded!.query.source).toBe("uniprot");
      expect(decoded!.query.peptideCount).toBe(16);
      expect(decoded!.query.predictors.s4pred).toBe(true);
      expect(decoded!.thresholds.muHCutoff).toBe(0.507);
      expect(decoded!.pvlVersion).toBe("0.1.2");
    });

    it("encodePermalinkURL produces a valid URL string", () => {
      const url = encodePermalinkURL("/results", STATE);
      expect(url).toContain("/results?");
      expect(url).toContain("pv=1");
      expect(url).toContain("dh=abc123def456");
      expect(url).toContain("ver=0.1.2");
    });

    it("preserves threshold values exactly", () => {
      const params = encodePermalink(STATE);
      const decoded = decodePermalink(params);
      expect(decoded!.thresholds).toEqual(STATE.thresholds);
    });
  });

  describe("decode edge cases", () => {
    it("returns null for empty params", () => {
      expect(decodePermalink(new URLSearchParams())).toBeNull();
    });

    it("returns null for missing pv", () => {
      const params = new URLSearchParams({ dh: "abc", q: "x", t: "y" });
      expect(decodePermalink(params)).toBeNull();
    });

    it("returns null for invalid pv", () => {
      const params = new URLSearchParams({ pv: "0", dh: "abc", q: "x", t: "y" });
      expect(decodePermalink(params)).toBeNull();
    });

    it("returns null for missing dataset hash", () => {
      const params = new URLSearchParams({ pv: "1", q: "x", t: "y" });
      expect(decodePermalink(params)).toBeNull();
    });

    it("returns null for corrupted base64 payload", () => {
      const params = new URLSearchParams({
        pv: "1",
        dh: "abc",
        q: "!!!not_base64!!!",
        t: "x",
      });
      expect(decodePermalink(params)).toBeNull();
    });
  });

  describe("dataset hashing", () => {
    it("computes a deterministic SHA-256 hex hash", async () => {
      const h1 = await computeDatasetHash("test input");
      const h2 = await computeDatasetHash("test input");
      expect(h1).toBe(h2);
      expect(h1).toHaveLength(64); // SHA-256 = 32 bytes = 64 hex chars
    });

    it("different inputs produce different hashes", async () => {
      const h1 = await computeDatasetHash("input A");
      const h2 = await computeDatasetHash("input B");
      expect(h1).not.toBe(h2);
    });

    it("computeShortHash returns first 12 chars", async () => {
      const full = await computeDatasetHash("test");
      const short = await computeShortHash("test");
      expect(short).toHaveLength(12);
      expect(full.startsWith(short)).toBe(true);
    });
  });

  describe("citation generation", () => {
    it("plain citation includes all required fields", () => {
      const text = generatePlainCitation(CITATION_PARAMS);
      expect(text).toContain("Said Azaizah");
      expect(text).toContain("Peleg Ragonis-Bachar");
      expect(text).toContain("Peptide Visual Lab v0.1.2");
      expect(text).toContain("abc123def456");
      expect(text).toContain("2026-05-06");
      expect(text).toContain("https://pvl.example");
    });

    it("plain citation includes DOI when provided", () => {
      const withDoi = { ...CITATION_PARAMS, doi: "10.5281/zenodo.12345" };
      const text = generatePlainCitation(withDoi);
      expect(text).toContain("DOI: 10.5281/zenodo.12345");
    });

    it("plain citation omits DOI when not provided", () => {
      const text = generatePlainCitation(CITATION_PARAMS);
      expect(text).not.toContain("DOI:");
    });

    it("BibTeX has correct entry key and fields", () => {
      const bib = generateBibTeX(CITATION_PARAMS);
      expect(bib).toContain("@misc{pvl_analysis_abc123def456");
      expect(bib).toContain("author = {Azaizah, Said");
      expect(bib).toContain("title = {{Peptide Visual Lab v0.1.2}}");
      expect(bib).toContain("url = {https://pvl.example");
    });

    it("BibTeX includes doi field when provided", () => {
      const withDoi = { ...CITATION_PARAMS, doi: "10.5281/zenodo.12345" };
      const bib = generateBibTeX(withDoi);
      expect(bib).toContain("doi = {10.5281/zenodo.12345}");
    });

    it("RIS includes all required tags", () => {
      const ris = generateRIS(CITATION_PARAMS);
      expect(ris).toContain("TY  - COMP");
      expect(ris).toContain("AU  - Azaizah, Said");
      expect(ris).toContain("TI  - Peptide Visual Lab v0.1.2");
      expect(ris).toContain("ER  -");
    });

    it("RIS includes DO tag when DOI provided", () => {
      const withDoi = { ...CITATION_PARAMS, doi: "10.5281/zenodo.12345" };
      const ris = generateRIS(withDoi);
      expect(ris).toContain("DO  - 10.5281/zenodo.12345");
    });
  });
});
