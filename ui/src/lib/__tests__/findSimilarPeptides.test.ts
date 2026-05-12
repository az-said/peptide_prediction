import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { findSimilarPeptides } from "../api";

// findSimilarPeptides hits `${API_BASE}/api/peptides/similar` with vanilla
// fetch, so we intercept globalThis.fetch and assert on the call payload.

const originalFetch = globalThis.fetch;
const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  globalThis.fetch = fetchMock as unknown as typeof fetch;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: "OK",
    text: async () => JSON.stringify(body),
  } as unknown as Response;
}

describe("findSimilarPeptides", () => {
  const refId = "P12345";

  it("POSTs reference_id + k as JSON to /api/peptides/similar", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        reference_id: refId,
        results: [],
        method: "lancedb+local-minilm",
        elapsed_ms: 12,
      }),
    );

    await findSimilarPeptides(refId, 7);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("/api/peptides/similar");
    expect(init?.method).toBe("POST");
    expect(init?.headers).toMatchObject({ "Content-Type": "application/json" });
    const body = JSON.parse(init?.body as string);
    expect(body).toEqual({ reference_id: refId, k: 7 });
  });

  it("defaults k to 10 when not provided", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        reference_id: refId,
        results: [],
        method: "lancedb+local-minilm",
        elapsed_ms: 1,
      }),
    );
    await findSimilarPeptides(refId);
    const init = fetchMock.mock.calls[0][1];
    expect(JSON.parse(init?.body as string)).toEqual({
      reference_id: refId,
      k: 10,
    });
  });

  it("includes dataset_id only when provided", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        reference_id: refId,
        results: [],
        method: "lancedb+local-minilm",
        elapsed_ms: 1,
      }),
    );
    await findSimilarPeptides(refId, 5, "demo");
    const body = JSON.parse(fetchMock.mock.calls[0][1]?.body as string);
    expect(body).toEqual({ reference_id: refId, k: 5, dataset_id: "demo" });
  });

  it("maps backend peptide rows through peptideMapper into canonical Peptide", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        reference_id: refId,
        results: [
          {
            peptide: {
              id: "Q98765",
              sequence: "AKLMNP",
              length: 6,
              ffHelixFlag: 1,
            },
            distance: 0.123,
          },
        ],
        method: "lancedb+local-minilm",
        elapsed_ms: 8,
      }),
    );

    const out = await findSimilarPeptides(refId, 10);
    expect(out.referenceId).toBe(refId);
    expect(out.method).toBe("lancedb+local-minilm");
    expect(out.elapsedMs).toBe(8);
    expect(out.results).toHaveLength(1);
    const hit = out.results[0];
    expect(hit.peptide.id).toBe("Q98765");
    expect(hit.peptide.sequence).toBe("AKLMNP");
    expect(hit.peptide.ffHelixFlag).toBe(1);
    expect(hit.distance).toBeCloseTo(0.123, 5);
  });

  it("returns empty results when method is 'disabled' (vector index off)", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        reference_id: refId,
        results: [],
        method: "disabled",
        elapsed_ms: 0,
      }),
    );

    const out = await findSimilarPeptides(refId);
    expect(out.method).toBe("disabled");
    expect(out.results).toEqual([]);
  });

  it("throws ApiError on non-2xx with the FastAPI detail message", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ detail: "Vector index unavailable" }, 503),
    );

    await expect(findSimilarPeptides(refId)).rejects.toThrow(
      /Vector index unavailable/,
    );
  });

  it("forwards an AbortSignal to fetch", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        reference_id: refId,
        results: [],
        method: "lancedb+local-minilm",
        elapsed_ms: 1,
      }),
    );
    const ctrl = new AbortController();
    await findSimilarPeptides(refId, 10, undefined, ctrl.signal);
    const init = fetchMock.mock.calls[0][1];
    expect(init?.signal).toBe(ctrl.signal);
  });
});
