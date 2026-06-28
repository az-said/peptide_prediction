/// <reference types="@testing-library/jest-dom" />
/**
 * T1 (V11): UniProtBatchPreview + helper function tests.
 *
 * Covers parseAccessionList, isValidAccession, render with mixed entries,
 * row remove, and cleanup button.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  UniProtBatchPreview,
  parseAccessionList,
  isValidAccession,
  type AccessionEntry,
} from "../UniProtBatchPreview";

// ── parseAccessionList ──────────────────────────────────────────────────

describe("parseAccessionList", () => {
  it("marks valid, invalid, and duplicate entries correctly", () => {
    const entries = parseAccessionList("P12345\nQ9UHC3-2\nfoo\nP12345");
    expect(entries).toHaveLength(4);
    expect(entries[0]).toEqual({ accession: "P12345", valid: true, duplicate: false });
    expect(entries[1]).toEqual({ accession: "Q9UHC3-2", valid: true, duplicate: false });
    expect(entries[2]).toEqual({ accession: "FOO", valid: false, duplicate: false });
    expect(entries[3]).toEqual({ accession: "P12345", valid: true, duplicate: true });
  });

  it("handles commas, whitespace, comments, and blank lines", () => {
    const entries = parseAccessionList("P12345, Q9UHC3, # comment\n\n  A0A0K9RCN8");
    expect(entries).toHaveLength(3);
    expect(entries.every((e) => e.valid)).toBe(true);
    expect(entries.every((e) => !e.duplicate)).toBe(true);
    expect(entries.map((e) => e.accession)).toEqual(["P12345", "Q9UHC3", "A0A0K9RCN8"]);
  });
});

// ── isValidAccession ────────────────────────────────────────────────────

describe("isValidAccession", () => {
  it("accepts standard UniProt accessions", () => {
    expect(isValidAccession("P12345")).toBe(true);
    expect(isValidAccession("Q9UHC3-2")).toBe(true);
  });

  it("is case-insensitive", () => {
    expect(isValidAccession("p12345")).toBe(true);
  });

  it("rejects invalid strings", () => {
    expect(isValidAccession("foo")).toBe(false);
  });
});

// ── UniProtBatchPreview render ──────────────────────────────────────────

function makeEntries(): AccessionEntry[] {
  return [
    { accession: "P12345", valid: true, duplicate: false },
    { accession: "FOO", valid: false, duplicate: false },
    { accession: "P12345", valid: true, duplicate: true },
  ];
}

describe("UniProtBatchPreview", () => {
  it("shows correct valid/invalid/dupe counts in the summary bar", () => {
    const entries = makeEntries();
    render(
      <UniProtBatchPreview entries={entries} onRemove={vi.fn()} onCleanup={vi.fn()} />,
    );
    expect(screen.getByText("1 valid")).toBeInTheDocument();
    expect(screen.getByText("1 invalid")).toBeInTheDocument();
    expect(screen.getByText("1 duplicate")).toBeInTheDocument();
    expect(screen.getByText("Remove invalid & duplicates")).toBeInTheDocument();
  });

  it("calls onRemove with the correct index when X is clicked", () => {
    const onRemove = vi.fn();
    const entries = makeEntries();
    render(
      <UniProtBatchPreview entries={entries} onRemove={onRemove} onCleanup={vi.fn()} />,
    );
    // The fixture has P12345 twice (first valid, fourth duplicate), so both
    // X buttons share aria-label "Remove P12345" — getAllByLabelText is
    // required to disambiguate. Index 0 is the first row's X.
    const xButtons = screen.getAllByLabelText(`Remove ${entries[0].accession}`);
    fireEvent.click(xButtons[0]);
    expect(onRemove).toHaveBeenCalledWith(0);
  });

  it("calls onCleanup when 'Remove invalid & duplicates' is clicked", () => {
    const onCleanup = vi.fn();
    const entries = makeEntries();
    render(
      <UniProtBatchPreview entries={entries} onRemove={vi.fn()} onCleanup={onCleanup} />,
    );
    fireEvent.click(screen.getByText("Remove invalid & duplicates"));
    expect(onCleanup).toHaveBeenCalledTimes(1);
  });
});
